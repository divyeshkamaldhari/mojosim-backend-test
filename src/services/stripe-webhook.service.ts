/* eslint-disable sonarjs/cognitive-complexity */
import type Stripe from 'stripe'

import { logger } from '../common/logger'
import { TemplateType } from '../modules/email'
import {
  retrieveCharge,
  retrievePaymentIntent,
  stripeClient,
} from '../modules/stripe'
import { getPaymentIntentIdFromCheckoutSessionPaymentIntent } from '../utils/stripe-checkout.util'
import type { Order } from '../models/order'
import type { WebhookEvent } from '../models/webhook-event'
import { invoiceQueue } from '../queues/invoice.queue'
import { provisioningQueue } from '../queues/provisioning.queue'
import { getProvisioningQueueJobOptions } from '../queues/provisioning-queue-options'
import { CartRepository } from '../repositories/cart.repository'
import { EsimProfileRepository } from '../repositories/esim-profile.repository'
import { InvoiceRepository } from '../repositories/invoice.repository'
import { OrderRepository } from '../repositories/order.repository'
import { PlanRepository } from '../repositories/plan.repository'
import { ProvisioningJobRepository } from '../repositories/provisioning-job.repository'
import { UserRepository } from '../repositories/user.repository'
import { sendAdminOperationsAlert } from './admin-operations-alert.service'
import { auditService } from './audit.service'
import { notificationService } from './notification.service'
import { isOrderRefunded } from '../utils/order-refund-guards'
import {
  getBillingSnapshotPromoCodeId,
  getBillingSnapshotQuantity,
  getBillingSnapshotSubtotalBeforeDiscount,
} from '../utils/billing-snapshot.util'
import { promoCodeService } from './promo-code.service'

const cartRepository = new CartRepository()
const orderRepository = new OrderRepository()
const provisioningJobRepository = new ProvisioningJobRepository()
const esimProfileRepository = new EsimProfileRepository()
const planRepository = new PlanRepository()
const invoiceRepository = new InvoiceRepository()
const userRepository = new UserRepository()

const ensurePlaceholderProfilesForOrder = async (
  order: Order
): Promise<number | null> => {
  const existing = await esimProfileRepository.findAllByOrderId(order.id)
  if (existing.length > 0) {
    return existing[0]?.id ?? null
  }

  const plan = await planRepository.findById(order.planId)
  if (plan === null) {
    logger.warn('Cannot create placeholder eSIMs: plan missing', {
      orderId: order.id,
      planId: order.planId,
    })
    return null
  }

  const quantity = getBillingSnapshotQuantity(order.billingSnapshot)
  let firstProfileId: number | null = null
  for (let index = 0; index < quantity; index += 1) {
    const profile = await esimProfileRepository.create({
      orderId: order.id,
      providerId: plan.providerId,
      iccid: null,
      ean: null,
      qrPayloadEnc: null,
      installInstructions: null,
      directAppleInstallationUrl: null,
      lifecycleState: 'created',
      activatedAt: null,
      expiresAt: null,
      lastSyncedAt: null,
      dataAllowanceMb: plan.dataMb,
    })
    if (firstProfileId === null) {
      firstProfileId = profile.id
    }
  }

  return firstProfileId
}

const enqueueNewOrderProvisioning = async (
  order: Order
): Promise<number | null> => {
  await ensurePlaceholderProfilesForOrder(order)

  const existingJob = await provisioningJobRepository.findByOrderId(order.id)
  let newProvisioningJobId: number | null = null
  const provisioningJob =
    existingJob ??
    (await provisioningJobRepository.create({
      orderId: order.id,
      // Keep null until fully provisioned so retry/recovery schedulers still match.
      esimProfileId: null,
      status: 'queued',
      providerRequest: {},
    }))
  if (existingJob === null) {
    newProvisioningJobId = provisioningJob.id
  }

  if (
    provisioningJob.status === 'queued' &&
    provisioningJob.esimProfileId === null
  ) {
    try {
      await provisioningQueue.add(
        'provision-esim',
        { jobId: provisioningJob.id },
        {
          jobId: `provision-order-${order.id}`,
          ...getProvisioningQueueJobOptions(),
        }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.warn('Provisioning queue enqueue failed', {
        orderId: order.id,
        provisioningJobId: provisioningJob.id,
        error: message,
      })
    }
  }

  return newProvisioningJobId
}

const getOrderIdFromPaymentIntent = (
  intent: Stripe.PaymentIntent
): number | null => {
  const metadataOrderId = intent.metadata.orderId
  if (!metadataOrderId) {
    return null
  }
  const parsed = Number.parseInt(metadataOrderId, 10)
  return Number.isNaN(parsed) ? null : parsed
}

const getOrderIdFromCheckoutSession = (
  session: Stripe.Checkout.Session
): number | null => {
  const metadataOrderId = session.metadata?.orderId
  if (!metadataOrderId) {
    return null
  }
  const parsed = Number.parseInt(metadataOrderId, 10)
  return Number.isNaN(parsed) ? null : parsed
}

const normalizePaymentMethodText = (value: string | null): string | null => {
  if (value === null) {
    return null
  }
  const normalized = value.trim()
  if (normalized.length === 0) {
    return null
  }
  return normalized
}

const extractPaymentMethodFromCharge = (
  charge: Stripe.Charge
): { paymentMethodType: string | null; paymentMethodBrand: string | null } => {
  const methodDetails = charge.payment_method_details
  if (!methodDetails) {
    return { paymentMethodType: null, paymentMethodBrand: null }
  }

  const paymentMethodType = normalizePaymentMethodText(methodDetails.type)
  const paymentMethodBrand =
    methodDetails.type === 'card'
      ? normalizePaymentMethodText(methodDetails.card?.brand ?? null)
      : null

  return { paymentMethodType, paymentMethodBrand }
}

type OrderChargeUpdate = {
  stripeChargeId: string
  stripeReceiptUrl: string | null
  paymentMethodType?: string
  paymentMethodBrand?: string
}

const buildOrderChargeUpdateFromCharge = (
  charge: Stripe.Charge
): OrderChargeUpdate => {
  const { paymentMethodType, paymentMethodBrand } =
    extractPaymentMethodFromCharge(charge)
  const update: OrderChargeUpdate = {
    stripeChargeId: charge.id,
    stripeReceiptUrl: charge.receipt_url ?? null,
  }
  if (paymentMethodType !== null) {
    update.paymentMethodType = paymentMethodType
  }
  if (paymentMethodBrand !== null) {
    update.paymentMethodBrand = paymentMethodBrand
  }
  return update
}

const orderNeedsChargeDetailsSync = (order: Order): boolean =>
  order.stripeChargeId === null

const resolveChargeFromPaymentIntent = async (
  paymentIntent: Stripe.PaymentIntent
): Promise<Stripe.Charge | null> => {
  const latestCharge = paymentIntent.latest_charge
  if (latestCharge === null) {
    return null
  }
  if (typeof latestCharge === 'object') {
    return latestCharge
  }

  try {
    return await retrieveCharge(latestCharge)
  } catch (error) {
    logger.warn('Could not retrieve Stripe charge for payment intent', {
      paymentIntentId: paymentIntent.id,
      chargeId: latestCharge,
      error: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

const syncOrderStripeChargeDetailsFromPaymentIntent = async (
  order: Order,
  paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
  if (!orderNeedsChargeDetailsSync(order)) {
    return
  }

  const charge = await resolveChargeFromPaymentIntent(paymentIntent)
  if (charge === null) {
    return
  }

  await orderRepository.updateById(
    order.id,
    buildOrderChargeUpdateFromCharge(charge)
  )
}

const buildInvoiceNumber = (orderId: number): string => {
  const year = new Date().getFullYear()
  return `INV-${year}-${String(orderId).padStart(5, '0')}`
}

export const confirmOrderPaymentFromIntent = async (
  paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
  const metadataOrderId = getOrderIdFromPaymentIntent(paymentIntent)
  const order =
    metadataOrderId === null
      ? await orderRepository.findByPaymentRef(paymentIntent.id)
      : await orderRepository.findById(metadataOrderId)

  if (!order) {
    logger.warn('Stripe succeeded event received for unknown order', {
      paymentIntentId: paymentIntent.id,
    })
    return
  }

  if (isOrderRefunded(order)) {
    logger.warn('Ignoring payment success for refunded order', {
      orderId: order.id,
      paymentIntentId: paymentIntent.id,
    })
    return
  }

  if (order.status === 'confirmed' && order.paymentStatus === 'paid') {
    if (order.paymentRef !== paymentIntent.id) {
      await orderRepository.updateById(order.id, {
        paymentRef: paymentIntent.id,
      })
    }
    await syncOrderStripeChargeDetailsFromPaymentIntent(order, paymentIntent)
    if (order.orderType === 'new') {
      await enqueueNewOrderProvisioning(order)
    }
    return
  }

  const orderAmount = String(order.amount)
  const orderCurrency = order.currency

  await orderRepository.updateById(order.id, {
    paymentStatus: 'paid',
    status: 'confirmed',
    paymentRef: paymentIntent.id,
  })

  await syncOrderStripeChargeDetailsFromPaymentIntent(order, paymentIntent)

  void auditService.createLog({
    action: 'order.created',
    entityType: 'orders',
    entityId: order.id,
    actorId: null,
    beforeState: null,
    afterState: {
      status: 'confirmed',
      payment_status: 'paid',
      amount: orderAmount,
      currency: orderCurrency,
    },
    ipAddress: null,
  })

  void auditService.createLog({
    action: 'order.payment_confirmed',
    entityType: 'orders',
    entityId: order.id,
    actorId: null,
    beforeState: { status: 'pending', payment_status: 'pending' },
    afterState: { status: 'confirmed', payment_status: 'paid' },
    ipAddress: null,
  })

  if (order.orderType !== 'new') {
    logger.warn('Ignoring non-new order payment success in M1-M4 scope', {
      orderId: order.id,
      orderType: order.orderType,
      paymentIntentId: paymentIntent.id,
    })
    return
  }

  const promoCodeId = getBillingSnapshotPromoCodeId(order.billingSnapshot)
  if (promoCodeId !== null) {
    try {
      await promoCodeService.redeemForOrder(promoCodeId, order.id)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.warn('Promo code redemption failed after payment success', {
        orderId: order.id,
        promoCodeId,
        error: message,
      })
    }
  }

  const billingSnapshot = order.billingSnapshot
  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null

  let planName = ''
  if (isRecord(billingSnapshot) && typeof billingSnapshot.name === 'string') {
    planName = billingSnapshot.name
  }

  const user = await userRepository.findByIdExcludingPasswordHash(order.userId)
  const firstName = String(user?.firstName ?? '')

  void notificationService.sendNotification({
    userId: order.userId,
    channel: 'both',
    type: TemplateType.order_confirmed,
    subject: 'Your mojoSim order is confirmed',
    body: 'Your eSIM plan is ready. Check your portal.',
    meta: { order_id: order.id },
    data: {
      firstName,
      planName,
      amount: orderAmount,
      currency: orderCurrency,
      orderId: String(order.id),
    },
  })

  let cartConverted = false
  if (typeof order.cartId === 'number') {
    const beforeCart = await cartRepository.findByIdAndUserId(
      order.cartId,
      order.userId
    )
    logger.info('Cart conversion attempt', {
      orderId: order.id,
      cartId: order.cartId,
      cartStatusBefore: beforeCart?.status ?? null,
    })

    await cartRepository.updateCartStatus(order.cartId, 'converted')
    cartConverted = true

    const afterCart = await cartRepository.findByIdAndUserId(
      order.cartId,
      order.userId
    )
    logger.info('Cart conversion result', {
      orderId: order.id,
      cartId: order.cartId,
      cartStatusAfter: afterCart?.status ?? null,
    })
  } else {
    logger.warn('Cart conversion skipped: invalid cartId', {
      orderId: order.id,
      cartId: order.cartId ?? null,
    })
  }

  const newProvisioningJobId = await enqueueNewOrderProvisioning(order)

  let invoice = await invoiceRepository.findByOrderId(order.id)
  if (!invoice) {
    const fullOrder = await orderRepository.findById(order.id)
    if (!fullOrder) {
      return
    }

    const orderId = fullOrder.id
    const userId = fullOrder.getDataValue('userId') as number
    const totalAmount = fullOrder.getDataValue('amount') as string
    const currency = fullOrder.getDataValue('currency') as string
    const subtotal =
      getBillingSnapshotSubtotalBeforeDiscount(fullOrder.billingSnapshot) ??
      totalAmount

    await invoiceRepository.create({
      orderId,
      userId,
      invoiceNumber: buildInvoiceNumber(orderId),
      subtotal,
      taxAmount: '0.00',
      totalAmount,
      currency,
      pdfUrl: null,
      issuedAt: new Date(),
    })
    invoice = await invoiceRepository.findByOrderId(order.id)
  }

  if (invoice) {
    if (invoice.pdfUrl === null) {
      try {
        await invoiceQueue.add(
          'generate-invoice',
          { invoiceId: invoice.id },
          {
            jobId: `invoice-${invoice.id}`,
            removeOnComplete: true,
            removeOnFail: false,
          }
        )
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        logger.warn('Invoice queue enqueue failed', {
          invoiceId: invoice.id,
          orderId: order.id,
          error: message,
        })
        void auditService.createLog({
          action: 'invoice.pdf_enqueue_failed',
          entityType: 'invoices',
          entityId: invoice.id,
          actorId: null,
          beforeState: null,
          afterState: {
            order_id: order.id,
            error: message.slice(0, 2000),
          },
          ipAddress: null,
        })
        void sendAdminOperationsAlert({
          title: 'Invoice PDF job enqueue failed',
          body: `invoiceId=${invoice.id} orderId=${order.id}\n${message}`,
        })
      }
    }

    void auditService.createLog({
      action: 'invoice.generated',
      entityType: 'invoices',
      entityId: invoice.id,
      actorId: null,
      beforeState: null,
      afterState: {
        invoice_number: invoice.invoiceNumber,
        total_amount: String(invoice.totalAmount),
        currency: invoice.currency,
      },
      ipAddress: null,
    })
  }

  if (newProvisioningJobId !== null) {
    void auditService.createLog({
      action: 'provisioning.job_created',
      entityType: 'provisioning_jobs',
      entityId: newProvisioningJobId,
      actorId: null,
      beforeState: null,
      afterState: { status: 'queued', order_id: order.id },
      ipAddress: null,
    })
  }

  if (cartConverted && typeof order.cartId === 'number') {
    void auditService.createLog({
      action: 'cart.converted',
      entityType: 'carts',
      entityId: order.cartId,
      actorId: null,
      beforeState: { status: 'active' },
      afterState: { status: 'converted' },
      ipAddress: null,
    })
  }
}

const handlePaymentIntentFailed = async (
  paymentIntent: Stripe.PaymentIntent
): Promise<void> => {
  const metadataOrderId = getOrderIdFromPaymentIntent(paymentIntent)
  const order =
    metadataOrderId === null
      ? await orderRepository.findByPaymentRef(paymentIntent.id)
      : await orderRepository.findById(metadataOrderId)

  if (!order) {
    return
  }

  await orderRepository.updateById(order.id, {
    paymentStatus: 'failed',
    status: 'failed',
  })

  void auditService.createLog({
    action: 'order.payment_failed',
    entityType: 'orders',
    entityId: order.id,
    actorId: null,
    beforeState: { status: 'pending', payment_status: 'pending' },
    afterState: { status: 'failed', payment_status: 'failed' },
    ipAddress: null,
  })

  const billingSnapshot = order.billingSnapshot
  const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === 'object' && v !== null

  let planName = ''
  if (isRecord(billingSnapshot) && typeof billingSnapshot.name === 'string') {
    planName = billingSnapshot.name
  }

  void notificationService.sendNotification({
    userId: order.userId,
    channel: 'both',
    type: TemplateType.payment_failed,
    subject: 'Your mojoSim payment failed',
    body: 'Your payment could not be processed. Please try again.',
    meta: { order_id: order.id },
    data: { planName, amount: String(order.amount) },
  })
}

const handleChargeSucceeded = async (charge: Stripe.Charge): Promise<void> => {
  const paymentIntentId =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : null
  if (!paymentIntentId) {
    return
  }

  let order = await orderRepository.findByPaymentRef(paymentIntentId)
  if (!order) {
    try {
      const intent = await stripeClient.paymentIntents.retrieve(paymentIntentId)
      const orderId = getOrderIdFromPaymentIntent(intent)
      if (orderId !== null) {
        order = await orderRepository.findById(orderId)
      }
    } catch (err) {
      logger.warn(
        'charge.succeeded: could not resolve order for PaymentIntent',
        {
          paymentIntentId,
          error: err instanceof Error ? err.message : String(err),
        }
      )
      return
    }
  }
  if (!order) {
    return
  }

  if (!orderNeedsChargeDetailsSync(order)) {
    return
  }

  await orderRepository.updateById(
    order.id,
    buildOrderChargeUpdateFromCharge(charge)
  )
}

const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session
): Promise<void> => {
  logger.info('Processing legacy Stripe Checkout session event', {
    stripeSessionId: session.id,
  })
  const orderId = getOrderIdFromCheckoutSession(session)
  if (orderId === null) {
    logger.warn('Checkout session completed without orderId metadata', {
      stripeSessionId: session.id,
    })
    return
  }

  const paymentIntentId = getPaymentIntentIdFromCheckoutSessionPaymentIntent(
    session.payment_intent
  )
  if (!paymentIntentId) {
    logger.warn('Checkout session completed without payment_intent', {
      stripeSessionId: session.id,
      orderId,
    })
    return
  }

  // Ensure charge.succeeded can attach payment method info later.
  await orderRepository.updateById(orderId, { paymentRef: paymentIntentId })

  const intent = await retrievePaymentIntent(paymentIntentId)
  await confirmOrderPaymentFromIntent(intent)
}

const handleCheckoutSessionExpired = async (
  session: Stripe.Checkout.Session
): Promise<void> => {
  logger.info('Processing legacy Stripe Checkout session expired event', {
    stripeSessionId: session.id,
  })
  const orderId = getOrderIdFromCheckoutSession(session)
  if (orderId === null) {
    logger.warn('Checkout session expired without orderId metadata', {
      stripeSessionId: session.id,
    })
    return
  }

  const order = await orderRepository.findById(orderId)
  if (!order) {
    return
  }
  if (order.status !== 'pending') {
    return
  }

  await orderRepository.updateById(orderId, {
    status: 'cancelled',
    paymentStatus: 'failed',
  })

  void auditService.createLog({
    action: 'order.payment_expired',
    entityType: 'orders',
    entityId: orderId,
    actorId: null,
    beforeState: { status: 'pending', payment_status: order.paymentStatus },
    afterState: { status: 'cancelled', payment_status: 'failed' },
    ipAddress: null,
  })
}

export class StripeWebhookService {
  processWebhookEvent = async (webhookEvent: WebhookEvent): Promise<void> => {
    const event = webhookEvent.payload as Stripe.Event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await confirmOrderPaymentFromIntent(event.data.object)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object)
        break
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object)
        break
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(event.data.object)
        break
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object)
        break
      case 'payment_intent.requires_action':
        logger.info('Stripe payment intent requires action', {
          stripeEventId: event.id,
        })
        break
      default:
        break
    }
  }
}

export const stripeWebhookService = new StripeWebhookService()

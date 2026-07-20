import { ConflictError, NotFoundError, ValidationError } from '../common/errors'
import { logInfo, logWarn } from '../common/logger'
import { env } from '../config/env'
import {
  cancelPaymentIntent,
  createCustomer,
  createPaymentIntent,
  retrievePaymentIntent,
} from '../modules/stripe'
import { CartRepository } from '../repositories/cart.repository'
import { AuditLogRepository } from '../repositories/audit-log.repository'
import { EsimProfileRepository } from '../repositories/esim-profile.repository'
import { InvoiceRepository } from '../repositories/invoice.repository'
import { OrderRepository } from '../repositories/order.repository'
import { PlanRepository } from '../repositories/plan.repository'
import { ProfileStatusHistoryRepository } from '../repositories/profile-status-history.repository'
import { ProvisioningJobRepository } from '../repositories/provisioning-job.repository'
import { UserRepository } from '../repositories/user.repository'
import {
  isPaymentIntentActionable,
  resolveClientSecretFromPaymentIntent,
} from '../utils/stripe-payment-intent.util'
import {
  getBillingSnapshotPromoCodeId,
  getBillingSnapshotQuantity,
} from '../utils/billing-snapshot.util'
import { isFullyProvisionedEsimProfile } from '../utils/esim-profile-status'
import { getEffectiveMargin } from '../utils/margin.util'
import {
  buildOrderTimeline,
  filterProfileHistoryForOrder,
  type OrderTimelineStep,
} from '../utils/build-order-timeline'
import { confirmOrderPaymentFromIntent } from './stripe-webhook.service'
import { promoCodeService } from './promo-code.service'

import type Stripe from 'stripe'

import type { CreateOrderDto } from '../dto/order.dto'
import type { Cart } from '../models/cart'
import type { CartItem } from '../models/cart-item'
import type { EsimProfile } from '../models/esim-profile'
import type { Order } from '../models/order'
import type { Plan } from '../models/plan'
import type { User } from '../models/user'

type OrderWithPlan = Order & { plan?: Plan }
type PlanWithProvider = Plan & { provider?: { marginPercent: string } }
type CartWithItems = Cart & { items?: CartItem[] }

export type OrderPlanSummary = {
  id: number
  name: string
  data_label: string | null
  validity_days: number
  plan_type: 'local' | 'regional' | 'global'
  flag_url: string | null
  region_name: string | null
}

export type LinkedEsimSummary = {
  id: number
  iccid: string | null
  lifecycle_state: EsimProfile['lifecycleState']
  activated_at: Date | null
  expires_at: Date | null
  created_at: Date
}

export type ProvisioningJobStatus =
  | 'queued'
  | 'processing'
  | 'success'
  | 'failed'
  | 'dead'

export type OrderResponse = {
  id: number
  user_id: number
  plan_id: number
  cart_id: number | null
  idempotency_key: string
  order_type: 'new' | 'renewal' | 'topup'
  status: 'pending' | 'confirmed' | 'failed' | 'refunded' | 'cancelled'
  amount: string
  currency: string
  payment_gateway: string
  payment_ref: string | null
  stripe_charge_id: string | null
  stripe_receipt_url: string | null
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  stripe_checkout_session_id: string | null
  checkout_expires_at: Date | null
  billing_snapshot: unknown
  plan: OrderPlanSummary | null
  esim_status: ProvisioningJobStatus | null
  created_at: Date
  updated_at: Date
}

export type OrderDetailResponse = OrderResponse & {
  timeline: OrderTimelineStep[]
  linked_esim: LinkedEsimSummary | null
}

export type OrderPaymentResponse = {
  order: OrderResponse
  client_secret: string | null
}

export type OrderStatusResponse = OrderPaymentResponse & {
  can_retry_payment: boolean
}

const mapOrderPlan = (plan: Plan | undefined): OrderPlanSummary | null => {
  if (plan === undefined) {
    return null
  }

  return {
    id: plan.id,
    name: plan.name,
    data_label: plan.dataLabel,
    validity_days: plan.validityDays,
    plan_type: plan.planType as 'local' | 'regional' | 'global',
    flag_url: plan.flagUrl,
    region_name: plan.regionName,
  }
}

const mapOrder = (
  order: OrderWithPlan,
  esimStatus: ProvisioningJobStatus | null = null
): OrderResponse => ({
  id: order.id,
  user_id: order.userId,
  plan_id: order.planId,
  cart_id: order.cartId,
  idempotency_key: order.idempotencyKey,
  order_type: order.orderType,
  status: order.status,
  amount: order.amount,
  currency: order.currency,
  payment_gateway: order.paymentGateway,
  payment_ref: order.paymentRef,
  stripe_charge_id: order.stripeChargeId,
  stripe_receipt_url: order.stripeReceiptUrl,
  payment_status: order.paymentStatus,
  stripe_checkout_session_id: order.stripeCheckoutSessionId,
  checkout_expires_at: order.checkoutExpiresAt,
  billing_snapshot: order.billingSnapshot,
  plan: mapOrderPlan(order.plan),
  esim_status: esimStatus,
  created_at: order.createdAt,
  updated_at: order.updatedAt,
})

const amountToCents = (amount: string): number => {
  return Math.round(Number.parseFloat(amount) * 100)
}

const formatMoney = (amount: number): string => amount.toFixed(2)

const pendingCheckoutExpiresAt = (): Date =>
  new Date(Date.now() + env.PENDING_ORDER_TTL_MINUTES * 60 * 1000)

const getPaymentWindowExpiresAtMs = (order: Order): number => {
  const candidates = [
    order.createdAt.getTime() + env.PENDING_ORDER_TTL_MINUTES * 60 * 1000,
  ]
  if (order.checkoutExpiresAt !== null) {
    candidates.push(order.checkoutExpiresAt.getTime())
  }
  return Math.max(...candidates)
}

const isPaymentWindowExpired = (order: Order): boolean =>
  Date.now() >= getPaymentWindowExpiresAtMs(order)

export class OrderService {
  private readonly orderRepository: OrderRepository

  private readonly planRepository: PlanRepository

  private readonly cartRepository: CartRepository

  private readonly userRepository: UserRepository

  private readonly auditLogRepository: AuditLogRepository

  private readonly invoiceRepository: InvoiceRepository

  private readonly provisioningJobRepository: ProvisioningJobRepository

  private readonly esimProfileRepository: EsimProfileRepository

  private readonly profileStatusHistoryRepository: ProfileStatusHistoryRepository

  constructor(
    orderRepository: OrderRepository = new OrderRepository(),
    planRepository: PlanRepository = new PlanRepository(),
    cartRepository: CartRepository = new CartRepository(),
    userRepository: UserRepository = new UserRepository(),
    auditLogRepository: AuditLogRepository = new AuditLogRepository(),
    invoiceRepository: InvoiceRepository = new InvoiceRepository(),
    provisioningJobRepository: ProvisioningJobRepository = new ProvisioningJobRepository(),
    esimProfileRepository: EsimProfileRepository = new EsimProfileRepository(),
    profileStatusHistoryRepository: ProfileStatusHistoryRepository = new ProfileStatusHistoryRepository()
  ) {
    this.orderRepository = orderRepository
    this.planRepository = planRepository
    this.cartRepository = cartRepository
    this.userRepository = userRepository
    this.auditLogRepository = auditLogRepository
    this.invoiceRepository = invoiceRepository
    this.provisioningJobRepository = provisioningJobRepository
    this.esimProfileRepository = esimProfileRepository
    this.profileStatusHistoryRepository = profileStatusHistoryRepository
  }

  private ensureStripeCustomerId = async (user: User): Promise<string> => {
    if (user.stripeCustomerId !== null) {
      return user.stripeCustomerId
    }

    const fullName = `${user.firstName} ${user.lastName}`.trim()
    const stripeCustomerId = await createCustomer(user.email, fullName)
    await this.userRepository.updateById(user.id, {
      stripeCustomerId,
    })

    return stripeCustomerId
  }

  private resolveClientSecretForOrder = async (
    order: Order
  ): Promise<string | null> => {
    if (order.status !== 'pending' || order.paymentRef === null) {
      return null
    }

    const intent = await retrievePaymentIntent(order.paymentRef)
    return resolveClientSecretFromPaymentIntent(intent)
  }

  private buildOrderPaymentResponse = async (
    order: OrderWithPlan
  ): Promise<OrderPaymentResponse> => ({
    order: mapOrder(order),
    client_secret: await this.resolveClientSecretForOrder(order),
  })

  private buildOrderStatusResponse = async (
    order: OrderWithPlan
  ): Promise<OrderStatusResponse> => {
    const clientSecret = await this.resolveClientSecretForOrder(order)
    return {
      order: mapOrder(order),
      client_secret: clientSecret,
      can_retry_payment: order.status === 'pending',
    }
  }

  private createOrRefreshPaymentIntent = async (
    order: Order,
    user: User
  ): Promise<OrderPaymentResponse> => {
    if (order.paymentRef !== null) {
      const existingIntent = await retrievePaymentIntent(order.paymentRef)
      const existingSecret =
        resolveClientSecretFromPaymentIntent(existingIntent)
      if (existingSecret !== null) {
        await this.orderRepository.updateById(order.id, {
          checkoutExpiresAt: pendingCheckoutExpiresAt(),
        })
        const currentOrder = await this.orderRepository.findById(order.id)
        if (!currentOrder) {
          throw new NotFoundError('Order')
        }
        return this.buildOrderPaymentResponse(currentOrder)
      }
    }

    const stripeCustomerId = await this.ensureStripeCustomerId(user)
    const paymentIntent = await createPaymentIntent({
      amount: amountToCents(order.amount),
      currency: order.currency.toLowerCase(),
      customer: stripeCustomerId,
      metadata: {
        orderId: String(order.id),
        userId: String(order.userId),
        planId: String(order.planId),
        type: order.orderType === 'new' ? 'new' : order.orderType,
      },
    })

    await this.orderRepository.updateById(order.id, {
      paymentRef: paymentIntent.paymentIntentId,
      checkoutExpiresAt: pendingCheckoutExpiresAt(),
    })

    const finalOrder = await this.orderRepository.findById(order.id)
    if (!finalOrder) {
      throw new NotFoundError('Order')
    }

    return {
      order: mapOrder(finalOrder),
      client_secret: paymentIntent.clientSecret,
    }
  }

  private getUserAndPlanForOrder = async (
    order: OrderWithPlan
  ): Promise<{ user: User; plan: Plan }> => {
    const user = await this.userRepository.findById(order.userId)
    if (!user) {
      throw new NotFoundError('User')
    }

    const plan =
      order.plan ??
      (await this.planRepository.findActivePlanByIdWithDetails(order.planId))
    if (!plan) {
      throw new NotFoundError('Plan')
    }

    return { user, plan }
  }

  private resumePendingOrderPayment = async (
    order: OrderWithPlan
  ): Promise<OrderPaymentResponse> => {
    const clientSecret = await this.resolveClientSecretForOrder(order)
    if (clientSecret !== null) {
      return this.buildOrderPaymentResponse(order)
    }

    const { user } = await this.getUserAndPlanForOrder(order)
    return this.createOrRefreshPaymentIntent(order, user)
  }

  private resolveIdempotentOrder = async (
    userId: number,
    idempotencyKey: string
  ): Promise<OrderPaymentResponse | null> => {
    const existing = await this.orderRepository.findByUserIdAndIdempotencyKey(
      userId,
      idempotencyKey
    )
    if (!existing) {
      return null
    }

    const existingOrder = existing as OrderWithPlan
    if (existingOrder.status === 'pending') {
      return this.resumePendingOrderPayment(existingOrder)
    }

    return this.buildOrderPaymentResponse(existingOrder)
  }

  private loadActiveCartPlan = async (
    userId: number,
    cartId: number
  ): Promise<{ cartItem: CartItem; plan: Plan }> => {
    const cart = await this.cartRepository.findByIdAndUserId(cartId, userId)
    if (cart?.status !== 'active') {
      throw new NotFoundError('Cart')
    }

    const activeCart = await this.cartRepository.findActiveCartByUserId(userId)
    if (activeCart?.id !== cartId) {
      throw new NotFoundError('Cart')
    }

    const cartItem = (activeCart as CartWithItems).items?.[0]
    if (!cartItem) {
      throw new NotFoundError('Cart item')
    }

    const plan = await this.planRepository.findActivePlanByIdWithDetails(
      cartItem.planId
    )
    if (!plan) {
      throw new NotFoundError('Plan')
    }

    return { cartItem, plan }
  }

  private buildOrderBillingSnapshot = (
    plan: Plan,
    unitPrice: string,
    quantity: number,
    currency: string,
    contact: CreateOrderDto['contact'],
    discount?: {
      promoCodeId: number
      promoCode: string
      discountPercent: number
      subtotalBeforeDiscount: string
      discountAmount: string
    }
  ): Record<string, unknown> => {
    const typedPlan = plan as PlanWithProvider
    const providerMargin = typedPlan.provider?.marginPercent
      ? Number.parseFloat(typedPlan.provider.marginPercent)
      : 0
    const customMargin = plan.customMarginPercent
      ? Number.parseFloat(plan.customMarginPercent)
      : null

    const effectiveMargin = getEffectiveMargin(providerMargin, customMargin)

    return {
      plan_id: plan.id,
      provider_id: plan.providerId,
      provider_sku: plan.providerSku,
      name: plan.name,
      description: plan.description,
      data_mb: plan.dataMb,
      data_label: plan.dataLabel,
      validity_days: plan.validityDays,
      plan_type: plan.planType,
      flag_url: plan.flagUrl,
      region_name: plan.regionName,
      net_price: plan.netPrice,
      effective_margin_percent: effectiveMargin,
      unit_price: unitPrice,
      quantity,
      currency,
      ...(discount === undefined
        ? {}
        : {
            promo_code_id: discount.promoCodeId,
            promo_code: discount.promoCode,
            discount_percent: discount.discountPercent,
            subtotal_before_discount: discount.subtotalBeforeDiscount,
            discount_amount: discount.discountAmount,
          }),
      ...(contact === undefined
        ? {}
        : {
            contact: {
              email: contact.email.toLowerCase(),
              first_name: contact.first_name,
              last_name: contact.last_name,
              phone: contact.phone ?? null,
            },
            ...(contact.billing === undefined
              ? {}
              : { billing: contact.billing }),
          }),
    }
  }

  createOrder = async (
    userId: number,
    dto: CreateOrderDto
  ): Promise<OrderPaymentResponse> => {
    const idempotentOrder = await this.resolveIdempotentOrder(
      userId,
      dto.idempotency_key
    )
    if (idempotentOrder !== null) {
      return idempotentOrder
    }

    const { cartItem, plan } = await this.loadActiveCartPlan(
      userId,
      dto.cart_id
    )
    const unitPrice = cartItem.unitPrice
    const quantity = cartItem.quantity
    const subtotal = Number.parseFloat(unitPrice) * quantity
    const currency = cartItem.currency

    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundError('User')
    }

    const checkoutEmail = dto.contact?.email ?? user.email
    const promoCode =
      dto.promo_code === undefined || dto.promo_code === null
        ? null
        : dto.promo_code.trim()

    let amount = formatMoney(subtotal)
    let discountMeta:
      | {
          promoCodeId: number
          promoCode: string
          discountPercent: number
          subtotalBeforeDiscount: string
          discountAmount: string
        }
      | undefined

    if (promoCode !== null && promoCode.length > 0) {
      if (!checkoutEmail) {
        throw new ValidationError(
          'Checkout email is required when applying a promo code'
        )
      }
      const validation = await promoCodeService.validateForCheckout(
        promoCode,
        checkoutEmail,
        subtotal
      )
      amount = validation.total
      discountMeta = {
        promoCodeId: validation.promo_code_id,
        promoCode: validation.promo_code,
        discountPercent: validation.discount_percent,
        subtotalBeforeDiscount: validation.subtotal,
        discountAmount: validation.discount_amount,
      }
    }

    const requestPromoCodeId = discountMeta?.promoCodeId ?? null

    const existingPendingOrder =
      await this.orderRepository.findLatestPendingByUserIdAndCartId(
        userId,
        dto.cart_id
      )
    const pendingSnapshotQuantity = existingPendingOrder
      ? getBillingSnapshotQuantity(existingPendingOrder.billingSnapshot)
      : 1
    const pendingPromoCodeId = existingPendingOrder
      ? getBillingSnapshotPromoCodeId(existingPendingOrder.billingSnapshot)
      : null
    if (
      existingPendingOrder &&
      existingPendingOrder.planId === plan.id &&
      existingPendingOrder.amount === amount &&
      existingPendingOrder.currency === currency &&
      pendingSnapshotQuantity === quantity &&
      pendingPromoCodeId === requestPromoCodeId
    ) {
      return this.resumePendingOrderPayment(existingPendingOrder)
    }

    const created = await this.orderRepository.create({
      userId,
      planId: plan.id,
      cartId: dto.cart_id,
      idempotencyKey: dto.idempotency_key,
      amount,
      currency,
      paymentRef: null,
      billingSnapshot: this.buildOrderBillingSnapshot(
        plan,
        unitPrice,
        quantity,
        currency,
        dto.contact,
        discountMeta
      ),
    })

    return this.createOrRefreshPaymentIntent(created, user)
  }

  private mapLinkedEsim = (
    profile: EsimProfile | null
  ): LinkedEsimSummary | null => {
    if (profile === null) {
      return null
    }

    return {
      id: profile.id,
      iccid: profile.iccid,
      lifecycle_state: profile.lifecycleState,
      activated_at: profile.activatedAt,
      expires_at: profile.expiresAt,
      created_at: profile.createdAt,
    }
  }

  private resolveLinkedEsimContext = async (
    order: Order
  ): Promise<{
    linkedProfile: EsimProfile | null
    esimProfileIdsForHistory: number[]
    fullyProvisionedCount: number
  }> => {
    const profiles = await this.esimProfileRepository.findAllByOrderId(order.id)
    return {
      linkedProfile: profiles[0] ?? null,
      esimProfileIdsForHistory: profiles.map((profile) => profile.id),
      fullyProvisionedCount: profiles.filter(isFullyProvisionedEsimProfile)
        .length,
    }
  }

  private buildOrderDetailExtras = async (
    order: Order
  ): Promise<Pick<OrderDetailResponse, 'timeline' | 'linked_esim'>> => {
    const { linkedProfile, esimProfileIdsForHistory, fullyProvisionedCount } =
      await this.resolveLinkedEsimContext(order)
    const [auditLogs, invoice, provisioningJob, profileHistoryRows] =
      await Promise.all([
        this.auditLogRepository.findByEntity('orders', order.id),
        this.invoiceRepository.findByOrderId(order.id),
        this.provisioningJobRepository.findByOrderId(order.id),
        esimProfileIdsForHistory.length > 0
          ? this.profileStatusHistoryRepository.findByEsimProfileIds(
              esimProfileIdsForHistory
            )
          : Promise.resolve([]),
      ])

    const profileHistory = filterProfileHistoryForOrder(
      order.orderType,
      profileHistoryRows
    )

    const orderQuantity = Math.max(
      getBillingSnapshotQuantity(order.billingSnapshot),
      esimProfileIdsForHistory.length,
      1
    )

    const timeline = buildOrderTimeline({
      order,
      esimQuantity: orderQuantity,
      provisionedEsimCount: fullyProvisionedCount,
      auditLogs,
      invoice,
      provisioningJob,
      profileHistory,
    })

    return {
      timeline,
      linked_esim: this.mapLinkedEsim(linkedProfile),
    }
  }

  getOrderById = async (
    userId: number,
    orderId: number
  ): Promise<OrderDetailResponse> => {
    const order = await this.orderRepository.findById(orderId)
    if (order?.userId !== userId) {
      throw new NotFoundError('Order')
    }
    const provisioningJob =
      await this.provisioningJobRepository.findByOrderId(orderId)
    const detailExtras = await this.buildOrderDetailExtras(order)
    return {
      ...mapOrder(order, provisioningJob?.status ?? null),
      ...detailExtras,
    }
  }

  getOrderStatus = async (
    userId: number,
    orderId: number
  ): Promise<OrderStatusResponse> => {
    const order = await this.orderRepository.findById(orderId)
    if (order?.userId !== userId) {
      throw new NotFoundError('Order')
    }

    return this.buildOrderStatusResponse(order)
  }

  private failExpiredPendingOrder = async (
    order: Order,
    paymentIntent: Stripe.PaymentIntent | null
  ): Promise<void> => {
    if (
      order.paymentRef !== null &&
      paymentIntent !== null &&
      isPaymentIntentActionable(paymentIntent.status)
    ) {
      try {
        await cancelPaymentIntent(order.paymentRef)
      } catch (error) {
        logWarn('Could not cancel expired Stripe payment intent', {
          orderId: order.id,
          paymentRef: order.paymentRef,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    await this.orderRepository.updateById(order.id, {
      status: 'cancelled',
      paymentStatus: 'failed',
    })

    logInfo('Pending order cancelled after payment window expired', {
      orderId: order.id,
      checkoutExpiresAt: order.checkoutExpiresAt,
    })
  }

  reconcilePaymentForOrder = async (order: Order): Promise<void> => {
    if (order.status !== 'pending') {
      return
    }

    let paymentIntent: Stripe.PaymentIntent | null = null

    if (order.paymentRef !== null) {
      paymentIntent = await retrievePaymentIntent(order.paymentRef)

      if (paymentIntent.status === 'succeeded') {
        await confirmOrderPaymentFromIntent(paymentIntent)
        return
      }
    }

    if (isPaymentWindowExpired(order)) {
      await this.failExpiredPendingOrder(order, paymentIntent)
      return
    }

    if (
      paymentIntent?.status === 'canceled' &&
      order.createdAt.getTime() <
        Date.now() - env.PENDING_ORDER_TTL_MINUTES * 60 * 1000
    ) {
      await this.orderRepository.updateById(order.id, {
        status: 'cancelled',
        paymentStatus: 'failed',
      })
    }
  }

  verifyPayment = async (
    userId: number,
    orderId: number
  ): Promise<OrderStatusResponse> => {
    const order = await this.orderRepository.findById(orderId)
    if (order?.userId !== userId) {
      throw new NotFoundError('Order')
    }

    await this.reconcilePaymentForOrder(order)

    const refreshed = await this.orderRepository.findById(orderId)
    if (!refreshed) {
      throw new NotFoundError('Order')
    }

    return this.buildOrderStatusResponse(refreshed)
  }

  refreshPaymentIntent = async (
    userId: number,
    orderId: number
  ): Promise<OrderPaymentResponse> => {
    const order = await this.orderRepository.findById(orderId)
    if (order?.userId !== userId) {
      throw new NotFoundError('Order')
    }

    const currentOrder = order as OrderWithPlan

    if (currentOrder.status !== 'pending') {
      throw new ConflictError('Only pending orders can refresh payment')
    }

    const { user } = await this.getUserAndPlanForOrder(currentOrder)
    return this.createOrRefreshPaymentIntent(currentOrder, user)
  }
}

export const orderService = new OrderService()

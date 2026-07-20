import { logInfo, logWarn } from '../common/logger'
import { env } from '../config/env'
import { uploadPdfBufferAtKey } from '../modules/s3'
import type { Order } from '../models/order'
import type { Plan } from '../models/plan'
import { InvoiceRepository } from '../repositories/invoice.repository'
import { OrderRepository } from '../repositories/order.repository'
import { PlanRepository } from '../repositories/plan.repository'
import { UserRepository } from '../repositories/user.repository'
import { generateInvoicePdfBuffer } from '../utils/generate-invoice-pdf'
import { resolveInvoicePdfLineItem } from '../utils/invoice-line-item-display'
import { getBillingSnapshotDiscountAmount } from '../utils/billing-snapshot.util'
import { withTimeout } from '../utils/timeout.util'

export type InvoiceQueuePayload = {
  invoiceId: number
  overwrite?: boolean
}
const INVOICE_PDF_TIMEOUT_MS = 30_000

const invoiceIssuerName = (): string => {
  const named = env.INVOICE_ISSUER_NAME.trim()
  if (named.length > 0) {
    return named
  }
  try {
    return new URL(env.APP_URL).hostname
  } catch {
    return 'MojoSim'
  }
}

const toTitleCase = (value: string): string => {
  const normalized = value.trim()
  if (normalized.length === 0) {
    return ''
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
}

const formatPaymentMethodLabel = (order: {
  paymentGateway: string
  paymentMethodType: string | null
  paymentMethodBrand: string | null
}): string => {
  const gateway = toTitleCase(order.paymentGateway)
  const methodType =
    order.paymentMethodType === null ? '' : toTitleCase(order.paymentMethodType)
  const methodBrand =
    order.paymentMethodBrand === null
      ? ''
      : toTitleCase(order.paymentMethodBrand)

  if (methodType.length > 0 && methodBrand.length > 0) {
    return `${methodType} (${methodBrand}) via ${gateway || 'Gateway'}`
  }
  if (methodType.length > 0) {
    return `${methodType} via ${gateway || 'Gateway'}`
  }
  if (gateway.length > 0) {
    return gateway
  }
  if (methodBrand.length > 0) {
    return methodBrand
  }
  if (methodType.length > 0) {
    return methodType
  }
  return 'N/A'
}

export class InvoiceJobService {
  private readonly invoiceRepository: InvoiceRepository
  private readonly orderRepository: OrderRepository
  private readonly planRepository: PlanRepository
  private readonly userRepository: UserRepository

  constructor(
    invoiceRepository: InvoiceRepository = new InvoiceRepository(),
    orderRepository: OrderRepository = new OrderRepository(),
    planRepository: PlanRepository = new PlanRepository(),
    userRepository: UserRepository = new UserRepository()
  ) {
    this.invoiceRepository = invoiceRepository
    this.orderRepository = orderRepository
    this.planRepository = planRepository
    this.userRepository = userRepository
  }

  processInvoiceJob = async (payload: InvoiceQueuePayload): Promise<void> => {
    const invoice = await this.invoiceRepository.findById(payload.invoiceId)
    if (invoice === null) {
      logWarn('Invoice job skipped: invoice not found', {
        invoiceId: payload.invoiceId,
      })
      return
    }
    if (invoice.pdfUrl !== null && payload.overwrite !== true) {
      return
    }

    const order = await this.orderRepository.findById(invoice.orderId)
    if (order === null) {
      logWarn('Invoice job skipped: order not found', {
        invoiceId: payload.invoiceId,
        orderId: invoice.orderId,
      })
      return
    }

    const user = await this.userRepository.findByIdForInvoice(invoice.userId)
    if (user === null) {
      logWarn('Invoice job skipped: user not found', {
        invoiceId: payload.invoiceId,
        userId: invoice.userId,
      })
      return
    }

    const customerName =
      `${user.firstName} ${user.lastName}`.trim() || user.email
    const orderWithPlan = order as Order & {
      plan?: Pick<Plan, 'planType' | 'regionName' | 'flagUrl'>
    }
    const countryNames =
      await this.planRepository.findPrimaryCountryNamesByPlanIds([order.planId])
    const lineItem = resolveInvoicePdfLineItem({
      billingSnapshot: order.billingSnapshot,
      plan: orderWithPlan.plan
        ? {
            planType:
              orderWithPlan.plan.planType === 'regional' ||
              orderWithPlan.plan.planType === 'global'
                ? orderWithPlan.plan.planType
                : 'local',
            regionName: orderWithPlan.plan.regionName,
            flagUrl: orderWithPlan.plan.flagUrl,
          }
        : null,
      countryName: countryNames.get(order.planId) ?? null,
    })
    const pdfBuffer = await withTimeout(
      generateInvoicePdfBuffer({
        issuerName: invoiceIssuerName(),
        invoiceNumber: invoice.invoiceNumber,
        issuedAt: invoice.issuedAt,
        orderId: order.id,
        paymentGateway: formatPaymentMethodLabel(order),
        customerName,
        customerEmail: user.email,
        lineItem,
        subtotal: invoice.subtotal,
        discountAmount: getBillingSnapshotDiscountAmount(order.billingSnapshot),
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
      }),
      INVOICE_PDF_TIMEOUT_MS,
      `Invoice PDF generation timed out for invoice ${invoice.id}`
    )

    const key = `invoices/${invoice.invoiceNumber}.pdf`
    const publicUrl = await withTimeout(
      uploadPdfBufferAtKey(pdfBuffer, key),
      INVOICE_PDF_TIMEOUT_MS,
      `Invoice PDF upload timed out for invoice ${invoice.id}`
    )
    await this.invoiceRepository.updatePdfUrlById(invoice.id, publicUrl)

    logInfo('Invoice PDF generated and stored', {
      invoiceId: invoice.id,
      orderId: order.id,
    })
  }
}

export const invoiceJobService = new InvoiceJobService()

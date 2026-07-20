import { AppError, NotFoundError } from '../common/errors'
import { getObjectByKey } from '../modules/s3'
import type {
  AdminListInvoicesQuery,
  ListCustomerInvoicesQuery,
} from '../dto/invoice.dto'
import type { Invoice } from '../models/invoice'
import type { Order } from '../models/order'
import type { Plan } from '../models/plan'
import type { User } from '../models/user'
import {
  InvoiceRepository,
  type AdminInvoiceFilters,
} from '../repositories/invoice.repository'
import { invoiceQueue } from '../queues/invoice.queue'
import { OrderRepository } from '../repositories/order.repository'
import { PlanRepository } from '../repositories/plan.repository'
import { auditService } from './audit.service'
import {
  buildAdminLineItems,
  type AdminLineItem,
} from '../utils/invoice-line-items'

type InvoiceOrderRelation = Pick<
  Order,
  'id' | 'status' | 'billingSnapshot' | 'amount' | 'currency' | 'planId'
> & {
  plan?: Pick<Plan, 'name' | 'flagUrl' | 'regionName' | 'planType'>
}

type InvoiceWithRelations = Invoice & {
  user?: Pick<User, 'id' | 'email'>
  order?: InvoiceOrderRelation
}

type CustomerInvoiceResponse = {
  id: number
  invoice_number: string
  order_id: number
  subtotal: string
  tax_amount: string
  total_amount: string
  currency: string
  pdf_url: string | null
  issued_at: Date
}

type AdminInvoiceResponse = CustomerInvoiceResponse & {
  user_id: number
  user: { id: number; email: string | null }
  order: { id: number; status: string }
  line_items: AdminLineItem[]
}

const mapCustomerInvoice = (
  invoice: InvoiceWithRelations
): CustomerInvoiceResponse => ({
  id: invoice.id,
  invoice_number: invoice.invoiceNumber,
  order_id: invoice.orderId,
  subtotal: invoice.subtotal,
  tax_amount: invoice.taxAmount,
  total_amount: invoice.totalAmount,
  currency: invoice.currency,
  pdf_url: invoice.pdfUrl,
  issued_at: invoice.issuedAt,
})

const mapAdminInvoice = (
  invoice: InvoiceWithRelations,
  lineItems?: AdminLineItem[]
): AdminInvoiceResponse => {
  const order = invoice.order

  return {
    ...mapCustomerInvoice(invoice),
    user_id: invoice.userId,
    user: {
      id: invoice.user?.id ?? invoice.userId,
      email: invoice.user?.email ?? null,
    },
    order: {
      id: order?.id ?? invoice.orderId,
      status: order?.status ?? 'pending',
    },
    line_items:
      lineItems ??
      buildAdminLineItems(order?.billingSnapshot ?? null, {
        amount: order?.amount ?? invoice.subtotal,
        currency: order?.currency ?? invoice.currency,
        planName: order?.plan?.name ?? null,
      }),
  }
}

const toAdminFilters = (
  query: AdminListInvoicesQuery
): AdminInvoiceFilters => ({
  id: query.id,
  orderId: query.order_id ?? query.orderId,
  userId: query.user_id ?? query.userId,
  currency: query.currency,
  from: query.from,
  to: query.to,
})

export class InvoiceService {
  private readonly invoiceRepository: InvoiceRepository
  private readonly orderRepository: OrderRepository
  private readonly planRepository: PlanRepository

  constructor(
    invoiceRepository: InvoiceRepository = new InvoiceRepository(),
    orderRepository: OrderRepository = new OrderRepository(),
    planRepository: PlanRepository = new PlanRepository()
  ) {
    this.invoiceRepository = invoiceRepository
    this.orderRepository = orderRepository
    this.planRepository = planRepository
  }

  private buildLineItemsForInvoice = async (
    invoice: InvoiceWithRelations
  ): Promise<AdminLineItem[]> => {
    const order = invoice.order
    if (!order) {
      return buildAdminLineItems(null, {
        amount: invoice.subtotal,
        currency: invoice.currency,
        planName: null,
      })
    }

    const countryNames =
      order.planId !== undefined
        ? await this.planRepository.findPrimaryCountryNamesByPlanIds([
            order.planId,
          ])
        : new Map<number, string>()

    return buildAdminLineItems(
      order.billingSnapshot,
      {
        amount: order.amount ?? invoice.subtotal,
        currency: order.currency ?? invoice.currency,
        planName: order.plan?.name ?? null,
      },
      {
        plan: order.plan
          ? {
              planType:
                order.plan.planType === 'regional' ||
                order.plan.planType === 'global'
                  ? order.plan.planType
                  : 'local',
              regionName: order.plan.regionName,
              flagUrl: order.plan.flagUrl,
            }
          : null,
        countryName: countryNames.get(order.planId) ?? null,
      }
    )
  }

  getInvoiceByOrderId = async (
    orderId: number,
    userId: number
  ): Promise<CustomerInvoiceResponse> => {
    const order = await this.orderRepository.findById(orderId)
    if (order?.userId !== userId) {
      throw new NotFoundError('Order')
    }

    const invoice = await this.invoiceRepository.findByOrderId(orderId)
    if (!invoice) {
      throw new NotFoundError('Invoice')
    }
    return mapCustomerInvoice(invoice)
  }

  getInvoicesForUser = async (
    userId: number,
    query: ListCustomerInvoicesQuery
  ): Promise<{
    items: CustomerInvoiceResponse[]
    meta: { page: number; limit: number; total: number }
  }> => {
    const { rows, count } = await this.invoiceRepository.findByUserId(
      userId,
      query.page,
      query.limit
    )

    return {
      items: rows.map((row) => mapCustomerInvoice(row as InvoiceWithRelations)),
      meta: { page: query.page, limit: query.limit, total: count },
    }
  }

  downloadInvoicePdfByOrderId = async (
    orderId: number,
    userId: number
  ): Promise<{ body: unknown; contentType: string; filename: string }> => {
    const order = await this.orderRepository.findById(orderId)
    if (order?.userId !== userId) {
      throw new NotFoundError('Order')
    }

    const invoice = await this.invoiceRepository.findByOrderId(orderId)
    if (!invoice) {
      throw new NotFoundError('Invoice')
    }
    if (!invoice.pdfUrl) {
      throw new AppError('Invoice PDF is not ready yet', 404, 'NOT_FOUND')
    }

    const key = `invoices/${invoice.invoiceNumber}.pdf`
    let body: unknown
    let contentType: string
    try {
      const result = await getObjectByKey(key)
      body = result.body
      contentType = result.contentType
    } catch (err) {
      if (err instanceof Error && err.name === 'NoSuchKey') {
        throw new NotFoundError('Invoice PDF')
      }
      throw err
    }
    return {
      body,
      contentType,
      filename: `${invoice.invoiceNumber}.pdf`,
    }
  }

  getAllInvoicesAdmin = async (
    query: AdminListInvoicesQuery
  ): Promise<{
    items: AdminInvoiceResponse[]
    meta: { page: number; limit: number; total: number }
  }> => {
    const { rows, count } = await this.invoiceRepository.findAll(
      toAdminFilters(query),
      query.page,
      query.limit
    )
    return {
      items: rows.map((row) => mapAdminInvoice(row as InvoiceWithRelations)),
      meta: { page: query.page, limit: query.limit, total: count },
    }
  }

  getInvoiceByIdAdmin = async (id: number): Promise<AdminInvoiceResponse> => {
    const invoice = await this.invoiceRepository.findById(id)
    if (!invoice) {
      throw new NotFoundError('Invoice')
    }
    const lineItems = await this.buildLineItemsForInvoice(invoice)
    return mapAdminInvoice(invoice, lineItems)
  }

  regenerateInvoicePdf = async (
    id: number,
    actorId: number
  ): Promise<{ message: string }> => {
    const invoice = await this.invoiceRepository.findById(id)
    if (!invoice) {
      throw new NotFoundError('Invoice')
    }

    await invoiceQueue.add(
      'generate-invoice',
      { invoiceId: invoice.id, overwrite: true },
      {
        jobId: `invoice-${invoice.id}-overwrite-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: false,
      }
    )

    void auditService.createLog({
      action: 'invoice.pdf_regenerated',
      entityType: 'invoices',
      entityId: id,
      actorId,
      beforeState: null,
      afterState: { message: 'PDF generation queued' },
      ipAddress: null,
    })

    return { message: 'PDF generation queued' }
  }
}

export const invoiceService = new InvoiceService()

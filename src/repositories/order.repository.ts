import { Op, fn, col, type Transaction, type WhereOptions } from 'sequelize'

import { Invoice } from '../models/invoice'
import { Order } from '../models/order'
import { Plan } from '../models/plan'
import { ProvisioningJob } from '../models/provisioning-job'
import { User } from '../models/user'

export type AdminOrderFilters = {
  orderId?: number
  status?: 'pending' | 'confirmed' | 'failed' | 'refunded' | 'cancelled'
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
  orderType?: 'new' | 'renewal' | 'topup'
  userId?: number
  from?: Date
  to?: Date
}

export type CreateOrderData = {
  userId: number
  planId: number
  cartId: number | null
  idempotencyKey: string
  orderType?: 'new' | 'renewal' | 'topup'
  amount: string
  currency: string
  paymentRef: string | null
  billingSnapshot: Record<string, unknown>
  status?: 'pending' | 'confirmed' | 'failed' | 'refunded' | 'cancelled'
  paymentGateway?: string
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded'
}

export type UpdateOrderData = Partial<{
  status: 'pending' | 'confirmed' | 'failed' | 'refunded' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  paymentRef: string
  stripeCheckoutSessionId: string | null
  stripeCheckoutUrl: string | null
  checkoutExpiresAt: Date | null
  paymentMethodType: string | null
  paymentMethodBrand: string | null
  stripeChargeId: string | null
  stripeReceiptUrl: string | null
}>

export type CustomerOrderListFilters = {
  status?: Order['status']
}

export type OrderStatusCounts = {
  all: number
  pending: number
  confirmed: number
  failed: number
  refunded: number
  cancelled: number
}

export class OrderRepository {
  findById = async (id: number): Promise<Order | null> => {
    return Order.findOne({
      where: { id },
      include: [{ model: Plan, as: 'plan' }],
    })
  }

  findByIdForProvisioning = async (id: number): Promise<Order | null> => {
    return Order.findByPk(id, {
      include: [
        { model: Plan, as: 'plan', required: true },
        {
          model: User,
          as: 'user',
          required: true,
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
    })
  }

  findByUserId = async (
    userId: number,
    page: number,
    limit: number
  ): Promise<{ rows: Order[]; count: number }> => {
    return this.findByUserIdFiltered(userId, {}, page, limit)
  }

  findByUserIdFiltered = async (
    userId: number,
    filters: CustomerOrderListFilters,
    page: number,
    limit: number
  ): Promise<{ rows: Order[]; count: number }> => {
    const where: WhereOptions<Order> = { userId }

    if (filters.status !== undefined) {
      where.status = filters.status
    }

    return Order.findAndCountAll({
      where,
      include: [{ model: Plan, as: 'plan' }],
      order: [['id', 'DESC']],
      limit,
      offset: (page - 1) * limit,
    })
  }

  countStatusesByUserId = async (
    userId: number
  ): Promise<OrderStatusCounts> => {
    const rows = (await Order.findAll({
      attributes: ['status', [fn('COUNT', col('id')), 'count']],
      where: { userId },
      group: ['status'],
      raw: true,
    })) as unknown as Array<{
      status: Order['status']
      count: string
    }>

    const counts: OrderStatusCounts = {
      all: 0,
      pending: 0,
      confirmed: 0,
      failed: 0,
      refunded: 0,
      cancelled: 0,
    }

    for (const row of rows) {
      const value = Number.parseInt(row.count, 10)
      if (!Number.isFinite(value)) {
        continue
      }
      counts[row.status] = value
      counts.all += value
    }

    return counts
  }

  findByIdempotencyKey = async (
    idempotencyKey: string
  ): Promise<Order | null> => {
    return Order.findOne({
      where: { idempotencyKey },
      include: [{ model: Plan, as: 'plan' }],
    })
  }

  findByUserIdAndIdempotencyKey = async (
    userId: number,
    idempotencyKey: string
  ): Promise<Order | null> => {
    return Order.findOne({
      where: { userId, idempotencyKey },
      include: [{ model: Plan, as: 'plan' }],
    })
  }

  findLatestPendingByUserIdAndCartId = async (
    userId: number,
    cartId: number
  ): Promise<Order | null> => {
    return Order.findOne({
      where: { userId, cartId, status: 'pending' },
      include: [{ model: Plan, as: 'plan' }],
      order: [['id', 'DESC']],
    })
  }

  findByPaymentRef = async (paymentRef: string): Promise<Order | null> => {
    return Order.findOne({
      where: { paymentRef },
      include: [{ model: Plan, as: 'plan' }],
    })
  }

  findByStripeCheckoutSessionId = async (
    stripeCheckoutSessionId: string
  ): Promise<Order | null> => {
    return Order.findOne({
      where: { stripeCheckoutSessionId },
      include: [{ model: Plan, as: 'plan' }],
    })
  }

  findStalePendingWithPaymentRef = async (
    createdBefore: Date,
    limit: number
  ): Promise<Order[]> => {
    return Order.findAll({
      where: {
        status: 'pending',
        paymentRef: { [Op.ne]: null },
        createdAt: { [Op.lt]: createdBefore },
      },
      order: [['createdAt', 'ASC']],
      limit,
    })
  }

  findPendingForPaymentReconciliation = async (
    createdBefore: Date,
    limit: number
  ): Promise<Order[]> => {
    const now = new Date()
    return Order.findAll({
      where: {
        status: 'pending',
        [Op.or]: [
          { createdAt: { [Op.lt]: createdBefore } },
          { checkoutExpiresAt: { [Op.lt]: now } },
        ],
      },
      order: [['createdAt', 'ASC']],
      limit,
    })
  }

  create = async (
    data: CreateOrderData,
    options?: { transaction?: Transaction }
  ): Promise<Order> => {
    return Order.create(
      {
        userId: data.userId,
        planId: data.planId,
        cartId: data.cartId,
        idempotencyKey: data.idempotencyKey,
        orderType: data.orderType ?? 'new',
        status: data.status ?? 'pending',
        amount: data.amount,
        currency: data.currency,
        paymentGateway: data.paymentGateway ?? 'stripe',
        paymentRef: data.paymentRef,
        paymentStatus: data.paymentStatus ?? 'pending',
        billingSnapshot: data.billingSnapshot,
      },
      { transaction: options?.transaction }
    )
  }

  updateById = async (
    id: number,
    data: UpdateOrderData,
    options?: { transaction?: Transaction }
  ): Promise<void> => {
    await Order.update(data, {
      where: { id },
      transaction: options?.transaction,
    })
  }

  findAllAdmin = async (
    filters: AdminOrderFilters,
    page: number,
    limit: number
  ): Promise<{ rows: Order[]; count: number }> => {
    const offset = (page - 1) * limit
    const andParts: WhereOptions[] = []
    if (filters.orderId !== undefined) {
      andParts.push({ id: filters.orderId })
    }
    if (filters.status !== undefined) {
      andParts.push({ status: filters.status })
    }
    if (filters.paymentStatus !== undefined) {
      andParts.push({ paymentStatus: filters.paymentStatus })
    }
    if (filters.orderType !== undefined) {
      andParts.push({ orderType: filters.orderType })
    }
    if (filters.userId !== undefined) {
      andParts.push({ userId: filters.userId })
    }
    if (filters.from !== undefined) {
      andParts.push({ createdAt: { [Op.gte]: filters.from } })
    }
    if (filters.to !== undefined) {
      andParts.push({ createdAt: { [Op.lte]: filters.to } })
    }

    let where: WhereOptions = {}
    if (andParts.length === 1) {
      where = andParts[0]
    } else if (andParts.length > 1) {
      where = { [Op.and]: andParts }
    }

    const { rows, count } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: ['id', 'name', 'flagUrl', 'regionName', 'planType'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
      distinct: true,
      subQuery: false,
    })

    return { rows, count }
  }

  findByIdAdmin = async (id: number): Promise<Order | null> => {
    return Order.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: Plan,
          as: 'plan',
          attributes: [
            'id',
            'name',
            'dataMb',
            'dataLabel',
            'providerId',
            'flagUrl',
            'regionName',
            'planType',
          ],
        },
        {
          model: ProvisioningJob,
          as: 'provisioningJobs',
          attributes: ['id', 'status', 'attemptCount'],
          required: false,
        },
        {
          model: Invoice,
          as: 'invoice',
          attributes: ['id', 'invoiceNumber'],
          required: false,
        },
      ],
      order: [
        [{ model: ProvisioningJob, as: 'provisioningJobs' }, 'id', 'DESC'],
      ],
    })
  }
}

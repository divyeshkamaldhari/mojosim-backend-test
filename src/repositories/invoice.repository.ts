import { Op } from 'sequelize'

import { Invoice } from '../models/invoice'
import { Order } from '../models/order'
import { Plan } from '../models/plan'
import { User } from '../models/user'

export type CreateInvoiceData = {
  orderId: number
  userId: number
  invoiceNumber: string
  subtotal: string
  taxAmount: string
  totalAmount: string
  currency: string
  pdfUrl: string | null
  issuedAt: Date
}

export type AdminInvoiceFilters = {
  id?: number
  orderId?: number
  userId?: number
  currency?: string
  from?: string
  to?: string
}

export class InvoiceRepository {
  create = async (data: CreateInvoiceData): Promise<Invoice> => {
    return Invoice.create({
      orderId: data.orderId,
      userId: data.userId,
      invoiceNumber: data.invoiceNumber,
      subtotal: data.subtotal,
      taxAmount: data.taxAmount,
      totalAmount: data.totalAmount,
      currency: data.currency,
      pdfUrl: data.pdfUrl,
      issuedAt: data.issuedAt,
    })
  }

  findByOrderId = async (orderId: number): Promise<Invoice | null> => {
    return Invoice.findOne({ where: { orderId } })
  }

  findByUserId = async (
    userId: number,
    page: number,
    limit: number
  ): Promise<{ rows: Invoice[]; count: number }> => {
    const offset = (page - 1) * limit
    return Invoice.findAndCountAll({
      where: { userId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'email'] },
        { model: Order, as: 'order', attributes: ['id', 'status'] },
      ],
      order: [['id', 'DESC']],
      limit,
      offset,
    })
  }

  findAll = async (
    filters: AdminInvoiceFilters,
    page: number,
    limit: number
  ): Promise<{ rows: Invoice[]; count: number }> => {
    const offset = (page - 1) * limit
    const where: Record<string, unknown> = {}
    if (filters.id !== undefined) {
      where.id = filters.id
    }
    if (filters.orderId !== undefined) {
      where.orderId = filters.orderId
    }
    if (filters.userId !== undefined) {
      where.userId = filters.userId
    }
    if (filters.currency !== undefined) {
      where.currency = filters.currency
    }
    if (filters.from !== undefined || filters.to !== undefined) {
      where.issuedAt = {
        ...(filters.from === undefined
          ? {}
          : { [Op.gte]: new Date(filters.from) }),
        ...(filters.to === undefined ? {} : { [Op.lte]: new Date(filters.to) }),
      }
    }

    const { rows, count } = await Invoice.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'email'] },
        { model: Order, as: 'order', attributes: ['id', 'status'] },
      ],
      order: [['id', 'DESC']],
      limit,
      offset,
      distinct: true,
    })

    return { rows, count }
  }

  findById = async (id: number): Promise<Invoice | null> => {
    return Invoice.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'email'] },
        {
          model: Order,
          as: 'order',
          attributes: [
            'id',
            'status',
            'billingSnapshot',
            'amount',
            'currency',
            'planId',
          ],
          include: [
            {
              model: Plan,
              as: 'plan',
              attributes: ['name', 'flagUrl', 'regionName', 'planType'],
              required: false,
            },
          ],
        },
      ],
    })
  }

  updatePdfUrlById = async (
    id: number,
    pdfUrl: string | null
  ): Promise<void> => {
    await Invoice.update(
      { pdfUrl },
      {
        where: { id },
      }
    )
  }
}

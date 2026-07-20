import { col, Op, where as sqlWhere, type WhereOptions } from 'sequelize'

import type { NewsletterSubscriptionStatus } from '../models/newsletter-subscription.model'
import { NewsletterSubscription } from '../models/newsletter-subscription.model'

export type CreateNewsletterSubscriptionData = {
  email: string
  promoCode: string
  discountPercent: string
  expiresAt: Date
  termsAcceptedAt: Date
  subscribedAt: Date
}

export type NewsletterSubscriptionFilters = {
  status?: NewsletterSubscriptionStatus
  search?: string
  from?: Date
  to?: Date
}

export class NewsletterSubscriptionRepository {
  findByEmail = async (
    email: string
  ): Promise<NewsletterSubscription | null> => {
    return NewsletterSubscription.findOne({
      where: { email: email.toLowerCase() },
    })
  }

  findByPromoCode = async (
    promoCode: string
  ): Promise<NewsletterSubscription | null> => {
    return NewsletterSubscription.findOne({
      where: { promoCode: promoCode.toUpperCase() },
    })
  }

  findById = async (id: number): Promise<NewsletterSubscription | null> => {
    return NewsletterSubscription.findByPk(id)
  }

  create = async (
    data: CreateNewsletterSubscriptionData
  ): Promise<NewsletterSubscription> => {
    const row = await NewsletterSubscription.create({
      email: data.email.toLowerCase(),
      promoCode: data.promoCode.toUpperCase(),
      discountPercent: data.discountPercent,
      status: 'active',
      expiresAt: data.expiresAt,
      termsAcceptedAt: data.termsAcceptedAt,
      subscribedAt: data.subscribedAt,
      usedOrderId: null,
      usedAt: null,
    })
    await row.reload()
    return row
  }

  markAsUsed = async (id: number, orderId: number): Promise<boolean> => {
    const [updatedCount] = await NewsletterSubscription.update(
      {
        status: 'used',
        usedOrderId: orderId,
        usedAt: new Date(),
      },
      {
        where: { id, status: 'active' },
      }
    )
    return updatedCount > 0
  }

  markAsExpired = async (id: number): Promise<void> => {
    await NewsletterSubscription.update(
      { status: 'expired' },
      { where: { id, status: 'active' } }
    )
  }

  findAll = async (
    filters: NewsletterSubscriptionFilters,
    page: number,
    limit: number
  ): Promise<{ rows: NewsletterSubscription[]; count: number }> => {
    const offset = (page - 1) * limit
    const andParts: WhereOptions[] = []

    if (filters.status !== undefined) {
      andParts.push({ status: filters.status })
    }

    if (filters.search !== undefined && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`
      andParts.push({
        [Op.or]: [
          { email: { [Op.iLike]: term } },
          { promoCode: { [Op.iLike]: term } },
        ],
      })
    }

    if (filters.from !== undefined) {
      andParts.push(sqlWhere(col('subscribed_at'), Op.gte, filters.from))
    }
    if (filters.to !== undefined) {
      andParts.push(sqlWhere(col('subscribed_at'), Op.lte, filters.to))
    }

    let where: WhereOptions = {}
    if (andParts.length === 1) {
      where = andParts[0]!
    } else if (andParts.length > 1) {
      where = { [Op.and]: andParts }
    }

    const { rows, count } = await NewsletterSubscription.findAndCountAll({
      where,
      limit,
      offset,
      order: [[col('subscribed_at'), 'DESC']],
    })
    return { rows, count }
  }
}

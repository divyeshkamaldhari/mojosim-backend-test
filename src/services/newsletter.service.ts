import { AppError, NotFoundError, ValidationError } from '../common/errors'
import { env } from '../config/env'
import type {
  AdminListNewsletterSubscriptionsQuery,
  SubscribeNewsletterDto,
} from '../dto/newsletter.dto'
import type { NewsletterSubscription } from '../models/newsletter-subscription.model'
import { TemplateType } from '../modules/email/email.types'
import { sendEmail } from '../modules/email/email.service'
import {
  NewsletterSubscriptionRepository,
  type NewsletterSubscriptionFilters,
} from '../repositories/newsletter-subscription.repository'
import {
  generateCartReferenceNumber,
  generatePromoCode,
} from '../utils/promo-code.util'

const NEWSLETTER_DISCOUNT_PERCENT = '10.00'
const PROMO_CODE_VALIDITY_MS = 365 * 24 * 60 * 60 * 1000
const MAX_CODE_GENERATION_ATTEMPTS = 5

type NewsletterSubscriptionResponse = {
  id: number
  email: string
  promo_code: string
  discount_percent: string
  status: 'active' | 'used' | 'expired'
  expires_at: Date
  terms_accepted_at: Date
  used_order_id: number | null
  used_at: Date | null
  subscribed_at: Date
  created_at: Date
  updated_at: Date
}

const mapSubscription = (
  row: NewsletterSubscription
): NewsletterSubscriptionResponse => ({
  id: row.id,
  email: row.email,
  promo_code: row.promoCode,
  discount_percent: row.discountPercent,
  status: row.status,
  expires_at: row.expiresAt,
  terms_accepted_at: row.termsAcceptedAt,
  used_order_id: row.usedOrderId,
  used_at: row.usedAt,
  subscribed_at: row.subscribedAt,
  created_at: row.createdAt,
  updated_at: row.updatedAt,
})

const parseOptionalDate = (value: string | undefined): Date | undefined => {
  if (value === undefined || value.trim() === '') {
    return undefined
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('Invalid from or to date')
  }
  return parsed
}

const toFilters = (
  query: AdminListNewsletterSubscriptionsQuery
): NewsletterSubscriptionFilters => ({
  status: query.status,
  search: query.search,
  from: parseOptionalDate(query.from),
  to: parseOptionalDate(query.to),
})

const sendPromoCodeEmail = async (
  row: NewsletterSubscription
): Promise<void> => {
  await sendEmail({
    to: row.email,
    templateType: TemplateType.newsletter_promo_code,
    data: {
      code: row.promoCode,
      discountPercent: row.discountPercent,
      expiresAt: row.expiresAt.toISOString().slice(0, 10),
      shopUrl: `${env.FRONTEND_URL}/plans`,
      cartReference: generateCartReferenceNumber(),
    },
  })
}

export class NewsletterService {
  private readonly repository: NewsletterSubscriptionRepository

  constructor(
    repository: NewsletterSubscriptionRepository = new NewsletterSubscriptionRepository()
  ) {
    this.repository = repository
  }

  private generateUniquePromoCode = async (): Promise<string> => {
    for (
      let attempt = 0;
      attempt < MAX_CODE_GENERATION_ATTEMPTS;
      attempt += 1
    ) {
      const code = generatePromoCode()
      const existing = await this.repository.findByPromoCode(code)
      if (!existing) {
        return code
      }
    }
    throw new AppError(
      'Could not generate promo code',
      500,
      'PROMO_CODE_GENERATION_FAILED'
    )
  }

  subscribe = async (
    dto: SubscribeNewsletterDto
  ): Promise<{ message: string }> => {
    const email = dto.email.toLowerCase()
    const existing = await this.repository.findByEmail(email)
    if (existing) {
      throw new AppError(
        'This email is already subscribed',
        409,
        'ALREADY_SUBSCRIBED'
      )
    }

    const now = new Date()
    const promoCode = await this.generateUniquePromoCode()
    const expiresAt = new Date(now.getTime() + PROMO_CODE_VALIDITY_MS)

    const row = await this.repository.create({
      email,
      promoCode,
      discountPercent: NEWSLETTER_DISCOUNT_PERCENT,
      expiresAt,
      termsAcceptedAt: now,
      subscribedAt: now,
    })

    void sendPromoCodeEmail(row)

    return {
      message: 'Check your email for your 10% discount code.',
    }
  }

  getSubscriptions = async (
    query: AdminListNewsletterSubscriptionsQuery
  ): Promise<{
    items: NewsletterSubscriptionResponse[]
    meta: { page: number; limit: number; total: number }
  }> => {
    const filters = toFilters(query)
    const { rows, count } = await this.repository.findAll(
      filters,
      query.page,
      query.limit
    )
    return {
      items: rows.map(mapSubscription),
      meta: { page: query.page, limit: query.limit, total: count },
    }
  }

  getSubscriptionById = async (
    id: number
  ): Promise<NewsletterSubscriptionResponse> => {
    const row = await this.repository.findById(id)
    if (!row) {
      throw new NotFoundError('Newsletter subscription')
    }
    return mapSubscription(row)
  }

  resendPromoEmail = async (id: number): Promise<{ message: string }> => {
    const row = await this.repository.findById(id)
    if (!row) {
      throw new NotFoundError('Newsletter subscription')
    }

    if (row.status === 'used') {
      throw new ValidationError(
        'This promo code has already been used and cannot be resent'
      )
    }

    if (row.status === 'active' && row.expiresAt.getTime() <= Date.now()) {
      await this.repository.markAsExpired(row.id)
      throw new ValidationError('This promo code has expired')
    }

    await sendPromoCodeEmail(row)

    return { message: 'Promo code email resent successfully' }
  }
}

export const newsletterService = new NewsletterService()

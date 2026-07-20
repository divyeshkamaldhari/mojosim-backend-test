import { AppError, ValidationError } from '../common/errors'
import type { NewsletterSubscription } from '../models/newsletter-subscription.model'
import { NewsletterSubscriptionRepository } from '../repositories/newsletter-subscription.repository'
import {
  calculatePercentDiscount,
  formatMoney,
  normalizePromoCode,
} from '../utils/promo-code.util'

export type PromoCodeValidationResult = {
  valid: true
  promo_code_id: number
  promo_code: string
  discount_percent: number
  subtotal: string
  discount_amount: string
  total: string
}

export class PromoCodeService {
  private readonly repository: NewsletterSubscriptionRepository

  constructor(
    repository: NewsletterSubscriptionRepository = new NewsletterSubscriptionRepository()
  ) {
    this.repository = repository
  }

  private ensureActiveSubscription = async (
    row: NewsletterSubscription
  ): Promise<NewsletterSubscription> => {
    if (row.status === 'used') {
      throw new ValidationError('This promo code has already been used')
    }

    if (row.status === 'expired' || row.expiresAt.getTime() <= Date.now()) {
      if (row.status === 'active') {
        await this.repository.markAsExpired(row.id)
      }
      throw new ValidationError('This promo code has expired')
    }

    return row
  }

  private assertEmailMatch = (
    row: NewsletterSubscription,
    email: string
  ): void => {
    if (row.email.toLowerCase() !== email.toLowerCase()) {
      throw new ValidationError(
        'This promo code was issued to a different email address'
      )
    }
  }

  validateForCheckout = async (
    code: string,
    email: string,
    subtotal: number
  ): Promise<PromoCodeValidationResult> => {
    const normalizedCode = normalizePromoCode(code)
    if (normalizedCode.length === 0) {
      throw new ValidationError('Promo code is required')
    }

    const row = await this.repository.findByPromoCode(normalizedCode)
    if (!row) {
      throw new ValidationError('Invalid promo code')
    }

    const activeRow = await this.ensureActiveSubscription(row)
    this.assertEmailMatch(activeRow, email)

    const discountPercent = Number.parseFloat(activeRow.discountPercent)
    const { discountAmount, total } = calculatePercentDiscount(
      subtotal,
      discountPercent
    )

    return {
      valid: true,
      promo_code_id: activeRow.id,
      promo_code: activeRow.promoCode,
      discount_percent: discountPercent,
      subtotal: formatMoney(subtotal),
      discount_amount: formatMoney(discountAmount),
      total: formatMoney(total),
    }
  }

  redeemForOrder = async (
    promoCodeId: number,
    orderId: number
  ): Promise<void> => {
    const redeemed = await this.repository.markAsUsed(promoCodeId, orderId)
    if (!redeemed) {
      const row = await this.repository.findById(promoCodeId)
      if (row?.status === 'used' && row.usedOrderId === orderId) {
        return
      }
      throw new AppError(
        'Promo code could not be redeemed',
        409,
        'PROMO_CODE_REDEEM_FAILED'
      )
    }
  }
}

export const promoCodeService = new PromoCodeService()

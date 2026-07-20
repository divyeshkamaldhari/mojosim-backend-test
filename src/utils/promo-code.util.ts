import { randomBytes, randomInt } from 'node:crypto'

export const normalizePromoCode = (code: string): string =>
  code.trim().toUpperCase()

export const generatePromoCode = (): string => {
  const suffix = randomBytes(4).toString('hex').toUpperCase()
  return `MOJO-${suffix}`
}

/** Random 4-digit cart reference for transactional-style email subjects. */
export const generateCartReferenceNumber = (): string =>
  String(randomInt(1000, 10000))

export const calculatePercentDiscount = (
  subtotal: number,
  discountPercent: number
): { discountAmount: number; total: number } => {
  const discountAmount =
    Math.round(subtotal * (discountPercent / 100) * 100) / 100
  const total = Math.round((subtotal - discountAmount) * 100) / 100
  return { discountAmount, total }
}

export const formatMoney = (amount: number): string => amount.toFixed(2)

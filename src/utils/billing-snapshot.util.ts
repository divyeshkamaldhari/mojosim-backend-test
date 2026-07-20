const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const getBillingSnapshotQuantity = (
  billingSnapshot: unknown
): number => {
  if (!isRecord(billingSnapshot)) {
    return 1
  }
  const raw = billingSnapshot.quantity
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return 1
  }
  const quantity = Math.trunc(raw)
  return quantity >= 1 ? quantity : 1
}

export const getBillingSnapshotPromoCodeId = (
  billingSnapshot: unknown
): number | null => {
  if (!isRecord(billingSnapshot)) {
    return null
  }
  const raw = billingSnapshot.promo_code_id
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return null
  }
  const promoCodeId = Math.trunc(raw)
  return promoCodeId > 0 ? promoCodeId : null
}

export const getBillingSnapshotSubtotalBeforeDiscount = (
  billingSnapshot: unknown
): string | null => {
  if (!isRecord(billingSnapshot)) {
    return null
  }
  const raw = billingSnapshot.subtotal_before_discount
  return typeof raw === 'string' && raw.trim() !== '' ? raw : null
}

export const getBillingSnapshotDiscountAmount = (
  billingSnapshot: unknown
): string | null => {
  if (!isRecord(billingSnapshot)) {
    return null
  }
  const raw = billingSnapshot.discount_amount
  return typeof raw === 'string' && raw.trim() !== '' ? raw : null
}

export const getEffectiveMargin = (
  providerMarginPercent: number,
  customMarginPercent: number | null
): number => customMarginPercent ?? providerMarginPercent

export const calculateSellingPrice = (
  netPrice: number,
  providerMarginPercent: number,
  customMarginPercent: number | null
): number => {
  const effectiveMargin = getEffectiveMargin(
    providerMarginPercent,
    customMarginPercent
  )
  const calculated = netPrice * (1 + effectiveMargin / 100)
  return Math.round(calculated * 100) / 100
}

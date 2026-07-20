import { detailCard, greeting, heading, text } from './email-parts'

const formatDiscountPercent = (raw: string): string => {
  const parsed = Number.parseFloat(raw)
  if (!Number.isFinite(parsed)) {
    return raw.trim() || '10'
  }
  return String(parsed)
}

export const renderNewsletterPromoCodeTemplate = (
  data: Record<string, string>
) => {
  const code = data.code ?? ''
  const discountPercent = formatDiscountPercent(data.discountPercent ?? '10')
  const expiresAt = data.expiresAt ?? ''
  const shopUrl = data.shopUrl ?? data.frontendUrl ?? ''

  const cartReference = data.cartReference?.trim() || '0000'
  const subject = `Your ${discountPercent}% mojoSim Discount Code - Cart #${cartReference}`
  const html = `
    ${greeting('')}
    ${text(`Thanks for subscribing to the mojoSim newsletter! Here is your exclusive ${discountPercent}% discount code for your first purchase.`)}
    ${detailCard([
      { label: 'Your code', value: code || '-' },
      { label: 'Discount', value: `${discountPercent}% off` },
      { label: 'Valid until', value: expiresAt || '-' },
      { label: 'Usage', value: 'One-time use only' },
    ])}
    ${heading('How to use it')}
    ${text('Browse our plans, add one to your cart, and enter this code at checkout. The discount applies immediately to your order total.')}
    ${text(
      shopUrl.length > 0
        ? `<a href="${shopUrl}" style="color:#FF063C;font-weight:600;">Browse plans</a>`
        : 'Browse plans on our website when you are ready to travel.'
    )}
  `

  return { subject, html }
}

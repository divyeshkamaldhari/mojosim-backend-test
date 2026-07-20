import { detailCard, greeting, textLast } from './email-parts'

export const renderPaymentFailedTemplate = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const planName = data.planName ?? ''
  const amount = data.amount ?? ''
  const currency = data.currency ?? ''
  const orderId = data.orderId ?? ''

  const subject = 'Your mojoSim payment failed'
  const html = `
    ${greeting(firstName)}
    ${textLast(`Unfortunately, your payment could not be processed${planName ? ` for <strong>${planName}</strong>` : ''}. No charges were made to your account. Please try again or use a different payment method.`)}
    ${detailCard([
      { label: 'Amount', value: `${amount || '-'} ${currency}`.trim() },
      { label: 'Order Reference', value: `#${orderId || '-'}` },
    ])}
  `

  return { subject, html }
}

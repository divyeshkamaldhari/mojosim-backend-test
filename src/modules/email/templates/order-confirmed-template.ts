import { detailCard, greeting, heading, stepsList, text } from './email-parts'

export const renderOrderConfirmedTemplate = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const orderId = data.orderId ?? ''
  const planName = data.planName ?? ''
  const amount = data.amount ?? ''
  const currency = data.currency ?? ''

  const subject = 'Your mojoSim order is confirmed'
  const html = `
    ${greeting(firstName)}
    ${text("Great news! Your order has been confirmed and is being processed. You'll receive another email with your eSIM installation details shortly.")}
    ${detailCard([
      { label: 'Order Reference', value: `#${orderId || '-'}` },
      { label: 'Plan', value: planName || 'Digital eSIM Package' },
      { label: 'Amount', value: `${amount} ${currency}`.trim() },
    ])}
    ${heading("What's next?")}
    ${stepsList([
      'We are currently provisioning your eSIM.',
      "In a few minutes, you'll receive an email with your QR code.",
      'Follow the instructions to install it on your device.',
    ])}
  `

  return { subject, html }
}

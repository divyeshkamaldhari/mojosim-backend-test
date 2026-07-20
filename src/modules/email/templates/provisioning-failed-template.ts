import { detailCard, greeting, textLast } from './email-parts'

export const renderProvisioningFailedTemplate = (
  data: Record<string, string>
) => {
  const firstName = data.firstName ?? ''
  const orderId = data.orderId ?? ''
  const reason = data.reason ?? ''

  const subject = 'eSIM provisioning failed'
  const html = `
    ${greeting(firstName)}
    ${textLast(`We encountered an issue while setting up your eSIM for order <strong>#${orderId || '-'}</strong>. Our team has been notified and is working to resolve this. We'll send you another update as soon as your eSIM is ready.`)}
    ${detailCard([
      { label: 'Reason', value: reason || 'System provisioning delay' },
      { label: 'Order Reference', value: `#${orderId || '-'}` },
    ])}
  `

  return { subject, html }
}

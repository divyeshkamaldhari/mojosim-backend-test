import { detailCard, greeting, textLast } from './email-parts'

export const renderEsimSuspendedTemplate = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const iccid = data.iccid ?? ''

  const subject = 'Your eSIM has been suspended'
  const html = `
    ${greeting(firstName)}
    ${textLast('Your eSIM is currently suspended. This may be due to data exhaustion or plan expiration. Please check your portal to top up or renew your plan.')}
    ${detailCard([{ label: 'ICCID', value: iccid || '-' }])}
  `

  return { subject, html }
}

import { detailCard, greeting, textLast } from './email-parts'

export const renderEsimExpiredTemplate = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const iccid = data.iccid ?? ''

  const subject = 'Your eSIM has expired'
  const html = `
    ${greeting(firstName)}
    ${textLast('Your eSIM plan has reached its expiration date and your connection has been deactivated. To stay connected, purchase a new plan or renew through your mojoSim portal.')}
    ${detailCard([{ label: 'ICCID', value: iccid || '-' }])}
  `

  return { subject, html }
}

import {
  alertBox,
  ctaButton,
  detailCard,
  greeting,
  heading,
  text,
} from './email-parts'

export const renderEsimActivatedTemplate = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const esimId = data.esimId ?? ''
  const iccid = data.iccid ?? ''
  const frontendUrl = (data.frontendUrl ?? '').replace(/\/$/, '')
  const esimUrl = esimId
    ? `${frontendUrl}/dashboard/esims/${esimId}`
    : `${frontendUrl}/dashboard/esims`

  const subject = 'Your mojoSim eSIM is ready for installation'
  const html = `
    ${greeting(firstName)}
    ${text('Great news! Your mojoSim eSIM is ready. You can now install it on your device and stay connected on your journey.')}
    ${detailCard([{ label: 'eSIM Identifier (ICCID)', value: iccid || '-' }])}
    ${heading('How to install')}
    ${alertBox('Important tips', [
      'Ensure you have a stable Wi-Fi connection.',
      'Turn on <strong>Data Roaming</strong> for this eSIM.',
      'Do not delete the eSIM profile once installed.',
    ])}
    ${ctaButton(esimUrl, 'View QR Code & Instructions')}
  `

  return { subject, html }
}

import { ctaButton, fallbackLink, greeting, text } from './email-parts'

export const renderVerificationTemplate = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const verificationUrl = data.verificationUrl ?? ''

  const subject = 'Verify your email'
  const html = `
    ${greeting(firstName)}
    ${text('Welcome to mojoSim! Please verify your email address to complete your registration and start your journey with us.')}
    ${ctaButton(verificationUrl, 'Verify email address')}
    ${fallbackLink(verificationUrl)}
  `

  return { subject, html }
}

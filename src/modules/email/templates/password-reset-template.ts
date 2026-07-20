import { ctaButton, fallbackLink, greeting, note, text } from './email-parts'

export const renderPasswordResetTemplate = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const resetUrl = data.resetUrl ?? ''

  const subject = 'Reset your password'
  const html = `
    ${greeting(firstName)}
    ${text('We received a request to reset your password for your mojoSim account. Click the button below to choose a new one:')}
    ${ctaButton(resetUrl, 'Reset password')}
    ${fallbackLink(resetUrl)}
    ${note("If you didn't request a password reset, you can safely ignore this email.")}
  `

  return { subject, html }
}

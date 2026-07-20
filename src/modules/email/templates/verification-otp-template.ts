import { greeting, note, otpBox, text } from './email-parts'

export const renderVerificationOtpTemplate = (
  data: Record<string, string>
): { subject: string; html: string } => {
  const firstName = data.firstName ?? 'there'
  const code = data.code ?? ''
  const expiresMinutes = data.expiresMinutes ?? '10'

  const subject = 'Verify your mojoSim email'
  const html = `
    ${greeting(firstName)}
    ${text('Use this code to verify your email address and complete your setup:')}
    ${otpBox(code)}
    ${note(`This code expires in <strong>${expiresMinutes} minutes</strong>. If you did not request this verification, you can safely ignore this email.`)}
  `

  return { subject, html }
}

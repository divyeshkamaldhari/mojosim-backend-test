import { greeting, note, otpBox, text } from './email-parts'

export const renderOtpLoginTemplate = (
  data: Record<string, string>
): { subject: string; html: string } => {
  const firstName = data.firstName ?? 'there'
  const code = data.code ?? ''
  const expiresMinutes = data.expiresMinutes ?? '10'

  const subject = 'Your mojoSim login code'
  const html = `
    ${greeting(firstName)}
    ${text('Use this code to sign in to your mojoSim account:')}
    ${otpBox(code)}
    ${note(`This code expires in <strong>${expiresMinutes} minutes</strong>. If you did not request this code, you can safely ignore this email.`)}
  `

  return { subject, html }
}

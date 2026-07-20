import { ctaButton, fallbackLink, greeting, note, text } from './email-parts'

export const renderAdminInviteTemplate = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const resetUrl = data.resetUrl ?? ''

  const subject = 'Welcome to mojoSim — Staff Invitation'
  const html = `
    ${greeting(firstName)}
    ${text('You have been invited to join the <strong>mojoSim Admin Portal</strong> as a staff member. Click the button below to set up your password and activate your account.')}
    ${ctaButton(resetUrl, 'Set Up My Account')}
    ${text('This invitation link will expire in <strong>24 hours</strong>.')}
    ${fallbackLink(resetUrl)}
    ${note("If you weren't expecting this invitation, you can safely ignore this email.")}
  `

  return { subject, html }
}

import { keyValueCard, messageCard, text } from './email-parts'

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export const renderContactFormReceivedTemplate = (
  data: Record<string, string>
) => {
  const fullName = data.fullName ?? ''
  const email = data.email ?? ''
  const phone = data.phone ?? ''
  const message = data.message ?? ''
  const submittedAt = data.submittedAt ?? ''

  const subject = 'New Contact Form Submission — mojoSim'
  const html = `
    ${text('You have received a new message through the mojoSim contact form.')}
    ${keyValueCard([
      { label: 'Full Name', value: escapeHtml(fullName) },
      { label: 'Email', value: escapeHtml(email) },
      {
        label: 'Phone',
        value: phone.trim() === '' ? '(not provided)' : escapeHtml(phone),
      },
      { label: 'Submitted', value: escapeHtml(submittedAt) },
    ])}
    ${messageCard('Message', escapeHtml(message))}
  `

  return { subject, html }
}

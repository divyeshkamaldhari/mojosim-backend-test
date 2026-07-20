import { codeBlock, note, text } from './email-parts'

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export const renderOperationsAlertTemplate = (
  data: Record<string, string>
): { subject: string; html: string } => {
  const title = escapeHtml(data.title ?? '')
  const body = escapeHtml(data.body ?? '')
  const occurredAt = escapeHtml(data.occurredAt ?? '')

  const subject = `[MojoSim Ops] ${data.title ?? 'Alert'}`.slice(0, 998)

  const html = `
    ${text(`<strong style="color:#B3194B;">${title}</strong>`)}
    ${note(`Occurred at: ${occurredAt}`)}
    ${codeBlock(body)}
    ${note('This is an automated operational alert. Please investigate immediately if required.')}
  `

  return { subject, html }
}

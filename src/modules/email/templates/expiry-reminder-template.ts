import { detailCard, greeting, textLast } from './email-parts'

export const renderExpiryReminderTemplate = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const daysLeft = data.daysLeft ?? ''

  const subject = 'Your eSIM is expiring soon'
  const html = `
    ${greeting(firstName)}
    ${textLast('Your eSIM plan is approaching its expiration date. Renew now to ensure your connection remains uninterrupted.')}
    ${detailCard([
      { label: 'Time Remaining', value: `${daysLeft || 'a few'} days` },
    ])}
  `

  return { subject, html }
}

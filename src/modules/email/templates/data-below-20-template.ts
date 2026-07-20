import { detailCard, greeting, textLast } from './email-parts'

export const renderDataBelow20Template = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const remainingPercent = data.remainingPercent ?? ''

  const subject = 'Data usage alert'
  const html = `
    ${greeting(firstName)}
    ${textLast("Your data balance is running low — you've used more than 80% of your current plan. Top up from your mojoSim portal to stay connected.")}
    ${detailCard([
      { label: 'Remaining Data', value: `${remainingPercent || '< 20'}%` },
    ])}
  `

  return { subject, html }
}

import { detailCard, greeting, textLast } from './email-parts'

export const renderLowDataWarningTemplate = (data: Record<string, string>) => {
  const firstName = data.firstName ?? ''
  const remainingMb = data.remainingMb ?? ''

  const subject = 'Low data warning'
  const html = `
    ${greeting(firstName)}
    ${textLast("You're almost out of data! To avoid any interruption to your service, consider topping up your balance now from your mojoSim dashboard.")}
    ${detailCard([
      { label: 'Remaining Data', value: `${remainingMb || '-'} MB` },
    ])}
  `

  return { subject, html }
}

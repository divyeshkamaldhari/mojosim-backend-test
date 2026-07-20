import sgMail from '@sendgrid/mail'

import { env } from '../../config/env'

sgMail.setApiKey(env.SENDGRID_API_KEY)

export const sendgridClient = {
  send: async ({
    from,
    to,
    subject,
    html,
  }: {
    from: string
    to: string
    subject: string
    html: string
  }): Promise<void> => {
    await sgMail.send({
      to,
      from,
      subject,
      html,
    })
  },
}

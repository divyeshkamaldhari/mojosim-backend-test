import { TemplateType } from '../email.types'

type EmailTone = 'success' | 'warning' | 'danger' | 'info'

type LayoutInput = {
  subject: string
  bodyHtml: string
  templateType: TemplateType
  frontendUrl: string
  logoSrc: string
}

const toneByTemplateType: Record<TemplateType, EmailTone> = {
  [TemplateType.verification]: 'info',
  [TemplateType.password_reset]: 'warning',
  [TemplateType.admin_invite]: 'info',
  [TemplateType.order_confirmed]: 'success',
  [TemplateType.payment_failed]: 'danger',
  [TemplateType.esim_activated]: 'success',
  [TemplateType.expiry_reminder]: 'warning',
  [TemplateType.provisioning_failed]: 'danger',
  [TemplateType.esim_suspended]: 'warning',
  [TemplateType.esim_expired]: 'warning',
  [TemplateType.data_below_20]: 'warning',
  [TemplateType.low_data_warning]: 'warning',
  [TemplateType.contact_form_received]: 'info',
  [TemplateType.operations_alert]: 'danger',
  [TemplateType.otp_login]: 'info',
  [TemplateType.verification_otp]: 'info',
  [TemplateType.newsletter_promo_code]: 'success',
}

const paletteByTone: Record<
  EmailTone,
  { accent: string; badgeBg: string; badgeText: string; label: string }
> = {
  success: {
    accent: '#0A8F7D',
    badgeBg: '#E5F9F4',
    badgeText: '#0A7A62',
    label: 'Success',
  },
  warning: {
    accent: '#D4920A',
    badgeBg: '#FFF8E6',
    badgeText: '#8A6500',
    label: 'Action needed',
  },
  danger: {
    accent: '#D9365E',
    badgeBg: '#FFF0F4',
    badgeText: '#B3194B',
    label: 'Important',
  },
  info: {
    accent: '#0A8F7D',
    badgeBg: '#E9F7F6',
    badgeText: '#0A7A7A',
    label: 'Notification',
  },
}

const extractBodyContent = (html: string): string => {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch?.[1]) {
    return bodyMatch[1].trim()
  }
  return html.trim()
}

export const applyEmailLayout = ({
  subject,
  bodyHtml,
  templateType,
  frontendUrl,
  logoSrc,
}: LayoutInput): string => {
  const tone = toneByTemplateType[templateType]
  const palette = paletteByTone[tone]
  const normalizedBody = extractBodyContent(bodyHtml)
  const baseUrl = frontendUrl.replace(/\/$/, '')
  const year = new Date().getFullYear()

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#F0F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#122B33;-webkit-font-smoothing:antialiased;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F5;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">

            <!-- Header -->
            <tr>
              <td style="background:#FFFFFF;border-radius:16px 16px 0 0;border-top:4px solid ${palette.accent};padding:32px 40px 24px;text-align:center;">
                <a href="${baseUrl}" style="text-decoration:none;display:inline-block;">
                  <img src="${logoSrc}" alt="mojoSim" width="150" style="display:block;border:0;outline:none;max-width:150px;height:auto;margin:0 auto;" />
                </a>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td style="background:#FFFFFF;padding:0 40px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td>
                      <span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${palette.badgeBg};color:${palette.badgeText};font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">${palette.label}</span>
                      <h1 style="margin:14px 0 0;font-size:24px;line-height:1.35;color:#122B33;font-weight:700;">${subject}</h1>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="background:#FFFFFF;padding:0 40px 36px;border-bottom:1px solid #E8EFF1;">
                ${normalizedBody}
              </td>
            </tr>

            <!-- Support -->
            <tr>
              <td style="background:#F8FAFB;padding:28px 40px;border-bottom:1px solid #E8EFF1;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:16px;vertical-align:middle;">
                      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#122B33;">Need help?</p>
                      <p style="margin:0;font-size:13px;line-height:1.5;color:#7B9198;">Our support team is available 24/7 for any questions about your eSIM.</p>
                    </td>
                    <td align="right" style="vertical-align:middle;white-space:nowrap;">
                      <a href="${baseUrl}/contact" style="display:inline-block;padding:10px 20px;background:#0A8F7D;color:#FFFFFF;font-size:13px;font-weight:700;text-decoration:none;border-radius:8px;">Contact Support</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#FFFFFF;border-radius:0 0 16px 16px;padding:24px 40px 32px;text-align:center;">
                <p style="margin:0 0 16px;">
                  <a href="${baseUrl}" style="margin:0 8px;color:#4E6872;text-decoration:none;font-size:13px;font-weight:500;">Website</a>
                  <span style="color:#D8E0E3;">|</span>
                  <a href="${baseUrl}/dashboard" style="margin:0 8px;color:#4E6872;text-decoration:none;font-size:13px;font-weight:500;">My Account</a>
                  <span style="color:#D8E0E3;">|</span>
                  <a href="${baseUrl}/terms-of-service" style="margin:0 8px;color:#4E6872;text-decoration:none;font-size:13px;font-weight:500;">Terms</a>
                  <span style="color:#D8E0E3;">|</span>
                  <a href="${baseUrl}/privacy-policy" style="margin:0 8px;color:#4E6872;text-decoration:none;font-size:13px;font-weight:500;">Privacy</a>
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#A0B4BC;">
                  mojoSim &mdash; Stay connected wherever your journey takes you.<br />
                  &copy; ${year} mojoSim. All rights reserved.
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

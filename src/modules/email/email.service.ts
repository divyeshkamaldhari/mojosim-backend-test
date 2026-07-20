import { env } from '../../config/env'
import { sendgridClient } from './email.client'
import { EmailPayload, TemplateType } from './email.types'
import { renderEsimActivatedTemplate } from './templates/esim-activated-template'
import { renderExpiryReminderTemplate } from './templates/expiry-reminder-template'
import { renderLowDataWarningTemplate } from './templates/low-data-warning-template'
import { renderOrderConfirmedTemplate } from './templates/order-confirmed-template'
import { renderPasswordResetTemplate } from './templates/password-reset-template'
import { renderAdminInviteTemplate } from './templates/admin-invite-template'
import { renderPaymentFailedTemplate } from './templates/payment-failed-template'
import { renderProvisioningFailedTemplate } from './templates/provisioning-failed-template'
import { renderEsimSuspendedTemplate } from './templates/esim-suspended-template'
import { renderEsimExpiredTemplate } from './templates/esim-expired-template'
import { renderDataBelow20Template } from './templates/data-below-20-template'
import { renderVerificationTemplate } from './templates/verification-template'
import { renderContactFormReceivedTemplate } from './templates/contact-form-received-template'
import { renderOperationsAlertTemplate } from './templates/operations-alert-template'
import { renderOtpLoginTemplate } from './templates/otp-login-template'
import { renderVerificationOtpTemplate } from './templates/verification-otp-template'
import { renderNewsletterPromoCodeTemplate } from './templates/newsletter-promo-code-template'
import { applyEmailLayout } from './templates/email-layout'
import { resolveEmailLogoUrl } from './templates/resolve-email-logo'

type RenderedEmail = { subject: string; html: string }

const renderTemplate = (
  templateType: TemplateType,
  data: Record<string, string>
): RenderedEmail => {
  const renders: Record<
    TemplateType,
    (d: Record<string, string>) => RenderedEmail
  > = {
    [TemplateType.verification]: renderVerificationTemplate,
    [TemplateType.password_reset]: renderPasswordResetTemplate,
    [TemplateType.admin_invite]: renderAdminInviteTemplate,
    [TemplateType.order_confirmed]: renderOrderConfirmedTemplate,
    [TemplateType.payment_failed]: renderPaymentFailedTemplate,
    [TemplateType.esim_activated]: renderEsimActivatedTemplate,
    [TemplateType.expiry_reminder]: renderExpiryReminderTemplate,
    [TemplateType.provisioning_failed]: renderProvisioningFailedTemplate,
    [TemplateType.esim_suspended]: renderEsimSuspendedTemplate,
    [TemplateType.esim_expired]: renderEsimExpiredTemplate,
    [TemplateType.data_below_20]: renderDataBelow20Template,
    [TemplateType.low_data_warning]: renderLowDataWarningTemplate,
    [TemplateType.contact_form_received]: renderContactFormReceivedTemplate,
    [TemplateType.operations_alert]: renderOperationsAlertTemplate,
    [TemplateType.otp_login]: renderOtpLoginTemplate,
    [TemplateType.verification_otp]: renderVerificationOtpTemplate,
    [TemplateType.newsletter_promo_code]: renderNewsletterPromoCodeTemplate,
  }

  return renders[templateType](data)
}

export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  const { to, templateType, data } = payload
  const { subject, html } = renderTemplate(templateType, {
    ...data,
    frontendUrl: env.FRONTEND_URL,
  })
  const logoSrc = await resolveEmailLogoUrl(env.FRONTEND_URL)
  const brandedHtml = applyEmailLayout({
    subject,
    bodyHtml: html,
    templateType,
    frontendUrl: env.FRONTEND_URL,
    logoSrc,
  })

  await sendgridClient.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html: brandedHtml,
  })
}

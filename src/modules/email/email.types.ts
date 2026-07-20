export enum TemplateType {
  verification = 'verification',
  password_reset = 'password_reset',
  admin_invite = 'admin_invite',
  order_confirmed = 'order_confirmed',
  payment_failed = 'payment_failed',
  esim_activated = 'esim_activated',
  expiry_reminder = 'expiry_reminder',
  provisioning_failed = 'provisioning_failed',
  esim_suspended = 'esim_suspended',
  esim_expired = 'esim_expired',
  data_below_20 = 'data_below_20',
  low_data_warning = 'low_data_warning',
  contact_form_received = 'contact_form_received',
  operations_alert = 'operations_alert',
  otp_login = 'otp_login',
  verification_otp = 'verification_otp',
  newsletter_promo_code = 'newsletter_promo_code',
}

export type EmailPayload = {
  to: string
  templateType: TemplateType
  data: Record<string, string>
}

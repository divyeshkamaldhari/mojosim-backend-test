import type Stripe from 'stripe'

const ACTIONABLE_PAYMENT_INTENT_STATUSES: ReadonlySet<Stripe.PaymentIntent.Status> =
  new Set([
    'requires_payment_method',
    'requires_confirmation',
    'requires_action',
  ])

export const isPaymentIntentActionable = (
  status: Stripe.PaymentIntent.Status
): boolean => ACTIONABLE_PAYMENT_INTENT_STATUSES.has(status)

export const resolveClientSecretFromPaymentIntent = (
  intent: Stripe.PaymentIntent
): string | null => {
  if (!isPaymentIntentActionable(intent.status)) {
    return null
  }
  return intent.client_secret ?? null
}

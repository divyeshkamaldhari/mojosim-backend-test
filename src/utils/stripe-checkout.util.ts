import type Stripe from 'stripe'

export function getPaymentIntentIdFromCheckoutSessionPaymentIntent(
  paymentIntent: Stripe.Checkout.Session['payment_intent']
): string | null {
  if (typeof paymentIntent === 'string') {
    return paymentIntent
  }
  if (
    paymentIntent !== null &&
    typeof paymentIntent === 'object' &&
    'id' in paymentIntent
  ) {
    const id = (paymentIntent as { id: unknown }).id
    return typeof id === 'string' ? id : null
  }
  return null
}

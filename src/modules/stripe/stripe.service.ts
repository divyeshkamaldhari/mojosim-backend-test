import { stripeClient } from './stripe.client'
import type Stripe from 'stripe'
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  CreateRefundInput,
  CreateRefundResult,
} from './stripe.types'

export const createPaymentIntent = async (
  input: CreatePaymentIntentInput
): Promise<CreatePaymentIntentResult> => {
  const intent = await stripeClient.paymentIntents.create({
    amount: input.amount,
    currency: input.currency,
    metadata: input.metadata,
    ...(input.customer === undefined ? {} : { customer: input.customer }),
    payment_method_types: ['card'],
  })

  return {
    paymentIntentId: intent.id,
    clientSecret: intent.client_secret ?? '',
  }
}

export const createRefund = async (
  input: CreateRefundInput
): Promise<CreateRefundResult> => {
  const refund = await stripeClient.refunds.create({
    payment_intent: input.paymentIntentId,
  })
  return { refundId: refund.id }
}

export const createCustomer = async (
  email: string,
  name: string
): Promise<string> => {
  const customer = await stripeClient.customers.create({
    email,
    name,
  })
  return customer.id
}

export const retrievePaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  return stripeClient.paymentIntents.retrieve(paymentIntentId)
}

export const retrieveCharge = async (
  chargeId: string
): Promise<Stripe.Charge> => {
  return stripeClient.charges.retrieve(chargeId)
}

export const cancelPaymentIntent = async (
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> => {
  return stripeClient.paymentIntents.cancel(paymentIntentId)
}

export const retrieveCheckoutSession = async (
  sessionId: string
): Promise<Stripe.Checkout.Session> => {
  return stripeClient.checkout.sessions.retrieve(sessionId)
}

export type CreatePaymentIntentInput = {
  amount: number
  currency: string
  metadata: Record<string, string>
  customer?: string
}

export type CreatePaymentIntentResult = {
  paymentIntentId: string
  clientSecret: string
}

export type CreateRefundInput = {
  paymentIntentId: string
}

export type CreateRefundResult = {
  refundId: string
}

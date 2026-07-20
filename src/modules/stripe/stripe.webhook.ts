import { NextFunction, Request, Response } from 'express'
import type Stripe from 'stripe'

import { env } from '../../config/env'
import { stripeClient } from './stripe.client'

declare module 'express' {
  interface Request {
    stripeEvent?: Stripe.Event
  }
}

export const stripeWebhookMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const signature = req.headers['stripe-signature']
  if (typeof signature !== 'string') {
    res
      .status(400)
      .json({ success: false, error: { message: 'Invalid signature' } })
    return
  }

  try {
    const rawBody = req.body as Buffer
    req.stripeEvent = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    )
    next()
  } catch {
    res
      .status(400)
      .json({ success: false, error: { message: 'Invalid signature' } })
  }
}

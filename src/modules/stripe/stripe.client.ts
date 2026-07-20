import Stripe from 'stripe'

import { env } from '../../config/env'

export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY)

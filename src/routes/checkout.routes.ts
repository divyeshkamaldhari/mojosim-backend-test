import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { authenticate } from '../middlewares/auth.middleware'
import {
  identifyCheckout,
  identifyCheckoutAuthenticated,
} from '../controllers/checkout.controller'

export const checkoutRouter = Router()

const checkoutIdentifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
})

checkoutRouter.post('/identify', checkoutIdentifyLimiter, identifyCheckout)
checkoutRouter.post(
  '/identify/me',
  checkoutIdentifyLimiter,
  authenticate,
  identifyCheckoutAuthenticated
)

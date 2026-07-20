import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import {
  createGuestCart,
  deleteGuestCart,
  getGuestCart,
  replaceGuestCartItem,
} from '../controllers/guest-cart.controller'
import { requireGuestCartToken } from '../middlewares/guest-cart.middleware'

export const guestCartRouter = Router()

const guestCartWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
})

guestCartRouter.post('/', guestCartWriteLimiter, createGuestCart)
guestCartRouter.get('/', getGuestCart)
guestCartRouter.put('/item', requireGuestCartToken, replaceGuestCartItem)
guestCartRouter.delete('/', requireGuestCartToken, deleteGuestCart)

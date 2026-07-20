import { Router } from 'express'

import { authenticate, requireRole } from '../middlewares/auth.middleware'
import {
  createCart,
  deleteCart,
  getCart,
  replaceCartItem,
} from '../controllers/cart.controller'

export const cartRouter = Router()

cartRouter.use(authenticate, requireRole('customer'))

cartRouter.post('/', createCart)
cartRouter.get('/', getCart)
cartRouter.put('/item', replaceCartItem)
cartRouter.delete('/', deleteCart)

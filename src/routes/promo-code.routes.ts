import { Router } from 'express'

import { validatePromoCode } from '../controllers/promo-code.controller'

export const promoCodeRouter = Router()

promoCodeRouter.post('/validate', validatePromoCode)

import { Router } from 'express'

import { authRouter } from './auth.routes'
import { cartRouter } from './cart.routes'
import { esimRouter } from './esim.routes'
import { meRouter } from './me.routes'
import { orderRouter } from './order.routes'
import { planRouter } from './plan.routes'
import { compatibilityRouter } from './compatibility.routes'
import { contentRouter } from './content.routes'
import { contactRouter } from './contact.routes'
import { newsletterRouter } from './newsletter.routes'
import { promoCodeRouter } from './promo-code.routes'
import { adminMeRouter } from './admin/me.routes'
import { adminAuthRouter } from './admin/auth.routes'
import { adminContentRouter } from './admin/content.routes'
import { guestCartRouter } from './guest-cart.routes'
import { checkoutRouter } from './checkout.routes'
import { swaggerRouter } from './swagger.routes'
import { trustpilotRouter } from './trustpilot.routes'

export const routes = Router()

routes.use('/auth', authRouter)
routes.use('/cart', cartRouter)
routes.use('/me', meRouter)
routes.use('/orders', orderRouter)
routes.use('/esims', esimRouter)
routes.use('/plans', planRouter)
routes.use('/', compatibilityRouter)
routes.use('/content', contentRouter)
routes.use('/contact', contactRouter)
routes.use('/newsletter', newsletterRouter)
routes.use('/promo-codes', promoCodeRouter)
routes.use('/admin/me', adminMeRouter)
routes.use('/admin', adminAuthRouter)
routes.use('/admin', adminContentRouter)
routes.use('/guest/cart', guestCartRouter)
routes.use('/checkout', checkoutRouter)
routes.use('/trustpilot', trustpilotRouter)
routes.use('/', swaggerRouter)

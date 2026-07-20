import { Router } from 'express'

import { subscribeNewsletter } from '../controllers/newsletter.controller'

export const newsletterRouter = Router()

newsletterRouter.post('/subscribe', subscribeNewsletter)

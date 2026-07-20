import { Router } from 'express'

import { submitForm } from '../controllers/contact.controller'

export const contactRouter = Router()

contactRouter.post('/', submitForm)

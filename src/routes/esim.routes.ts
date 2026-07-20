import { Router } from 'express'

import { getEsimById, getEsimQr } from '../controllers/esim.controller'
import { authenticate, requireRole } from '../middlewares/auth.middleware'

export const esimRouter = Router()

esimRouter.get('/:id/qr', authenticate, requireRole('customer'), getEsimQr)
esimRouter.get('/:id', authenticate, requireRole('customer'), getEsimById)

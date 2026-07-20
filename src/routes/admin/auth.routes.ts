import { Router } from 'express'

import { staffLogout, staffRefresh } from '../../controllers/auth.controller'
import { authenticate, requireRole } from '../../middlewares/auth.middleware'

export const adminAuthRouter = Router()

adminAuthRouter.post('/auth/refresh', staffRefresh)
adminAuthRouter.post(
  '/auth/logout',
  authenticate,
  requireRole('manager', 'admin'),
  staffLogout
)

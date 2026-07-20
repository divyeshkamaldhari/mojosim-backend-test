import { Router } from 'express'

import { authenticate, requireRole } from '../../middlewares/auth.middleware'
import { uploadSingleAvatar } from '../../middlewares/upload.middleware'
import {
  changePassword,
  deleteSessionById,
  getMe,
  listSessions,
  revokeOtherSessions,
  updateMe,
} from '../../controllers/me.controller'

export const adminMeRouter = Router()

adminMeRouter.get('/', authenticate, requireRole('manager', 'admin'), getMe)

adminMeRouter.patch(
  '/',
  authenticate,
  requireRole('manager', 'admin'),
  uploadSingleAvatar,
  updateMe
)

adminMeRouter.patch(
  '/password',
  authenticate,
  requireRole('manager', 'admin'),
  changePassword
)

adminMeRouter.get(
  '/sessions',
  authenticate,
  requireRole('manager', 'admin'),
  listSessions
)

adminMeRouter.delete(
  '/sessions',
  authenticate,
  requireRole('manager', 'admin'),
  revokeOtherSessions
)

adminMeRouter.delete(
  '/sessions/:id',
  authenticate,
  requireRole('manager', 'admin'),
  deleteSessionById
)

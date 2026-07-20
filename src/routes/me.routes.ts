import { Router } from 'express'

import { authenticate, requireRole } from '../middlewares/auth.middleware'
import { uploadSingleAvatar } from '../middlewares/upload.middleware'
import {
  changePassword,
  deleteSessionById,
  getMe,
  listSessions,
  revokeOtherSessions,
  updateMe,
} from '../controllers/me.controller'

export const meRouter = Router()

meRouter.get('/', authenticate, requireRole('customer'), getMe)

meRouter.patch(
  '/',
  authenticate,
  requireRole('customer'),
  uploadSingleAvatar,
  updateMe
)

meRouter.patch(
  '/password',
  authenticate,
  requireRole('customer'),
  changePassword
)

meRouter.get('/sessions', authenticate, requireRole('customer'), listSessions)

meRouter.delete(
  '/sessions',
  authenticate,
  requireRole('customer'),
  revokeOtherSessions
)

meRouter.delete(
  '/sessions/:id',
  authenticate,
  requireRole('customer'),
  deleteSessionById
)

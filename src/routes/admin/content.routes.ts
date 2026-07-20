import { Router } from 'express'

import { authenticate, requireRole } from '../../middlewares/auth.middleware'
import { uploadSingleContentAsset } from '../../middlewares/upload.middleware'
import {
  deleteContent,
  getAllContent,
  togglePublished,
  uploadContentAsset,
  upsertContent,
} from '../../controllers/content-block.controller'

export const adminContentRouter = Router()

adminContentRouter.get(
  '/content',
  authenticate,
  requireRole('manager', 'admin'),
  getAllContent
)
adminContentRouter.post(
  '/content/upload',
  authenticate,
  requireRole('manager', 'admin'),
  uploadSingleContentAsset,
  uploadContentAsset
)
adminContentRouter.put(
  '/content/:key',
  authenticate,
  requireRole('manager', 'admin'),
  upsertContent
)
adminContentRouter.patch(
  '/content/:key/:locale/publish',
  authenticate,
  requireRole('manager', 'admin'),
  togglePublished
)
adminContentRouter.delete(
  '/content/:key/:locale',
  authenticate,
  requireRole('manager', 'admin'),
  deleteContent
)

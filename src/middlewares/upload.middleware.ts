import multer from 'multer'
import type { NextFunction, Request, Response } from 'express'

import { ValidationError } from '../common/errors'

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

const CONTENT_MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024
const CONTENT_ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
])

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new ValidationError('Avatar must be a jpeg, jpg, png, or webp image'))
      return
    }
    cb(null, true)
  },
})

export const uploadSingleAvatar = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  upload.single('avatar')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof ValidationError) {
        next(err)
        return
      }

      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        next(new ValidationError('Avatar image size must be 2MB or less'))
        return
      }
      next(new ValidationError('Invalid avatar upload'))
      return
    }
    next()
  })
}

const contentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: CONTENT_MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!CONTENT_ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new ValidationError(
          'Content file must be image or video (jpg/png/webp/mp4/webm/mov)'
        )
      )
      return
    }
    cb(null, true)
  },
})

export const uploadSingleContentAsset = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  contentUpload.single('file')(req, res, (err: unknown) => {
    if (err) {
      if (err instanceof ValidationError) {
        next(err)
        return
      }
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        next(new ValidationError('Content file size must be 20MB or less'))
        return
      }
      next(new ValidationError('Invalid content file upload'))
      return
    }
    next()
  })
}

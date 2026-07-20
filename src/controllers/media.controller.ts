import { Request, Response } from 'express'
import { Readable } from 'node:stream'

import { NotFoundError, ValidationError } from '../common/errors'
import { getObjectByKey } from '../modules/s3'

const getMediaKeyFromRequest = (req: Request): string => {
  const raw = req.params[0]
  if (!raw) {
    throw new ValidationError('Missing media key')
  }
  const decoded = decodeURIComponent(raw)
  if (decoded.includes('..')) {
    throw new ValidationError('Invalid media key')
  }
  return decoded.replace(/^\/+/, '')
}

export const streamMedia = async (
  req: Request,
  res: Response
): Promise<void> => {
  const key = getMediaKeyFromRequest(req)
  let body: unknown
  let contentType: string
  try {
    const result = await getObjectByKey(key)
    body = result.body
    contentType = result.contentType
  } catch (err) {
    if (err instanceof Error && err.name === 'NoSuchKey') {
      throw new NotFoundError('Media')
    }
    throw err
  }
  res.setHeader('Content-Type', contentType)
  res.setHeader('Cache-Control', 'public, max-age=300')
  if (body instanceof Readable) {
    body.pipe(res)
    return
  }
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Unable to stream media' },
  })
}

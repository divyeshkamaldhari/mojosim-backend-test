import { Request, Response } from 'express'

import { UnauthorizedError, ValidationError } from '../common/errors'
import {
  ContentKeyLocaleParamsSchema,
  ContentKeyParamsSchema,
  GetContentQuerySchema,
  ListContentQuerySchema,
  TogglePublishedSchema,
  UploadContentAssetBodySchema,
  UpsertContentBlockSchema,
} from '../dto/content-block.dto'
import { contentBlockService } from '../services/content-block.service'
import { getRequestIpAddress } from '../utils/request-client.util'

const requireUserId = (req: Request): number => {
  const userId = req.user?.userId
  if (userId === undefined) {
    throw new UnauthorizedError()
  }
  return userId
}

export const getPublicContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { key } = ContentKeyParamsSchema.parse(req.params)
  const query = GetContentQuerySchema.parse(req.query)
  const data = await contentBlockService.getPublicContent(key, query.locale)
  res.status(200).json({ success: true, data })
}

export const getAllContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = ListContentQuerySchema.parse(req.query)
  const result = await contentBlockService.getAllContent(
    query.page,
    query.limit
  )
  res.status(200).json({ success: true, data: result.items, meta: result.meta })
}

export const upsertContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { key } = ContentKeyParamsSchema.parse(req.params)
  const body = UpsertContentBlockSchema.parse(req.body)
  const data = await contentBlockService.upsertContent(
    key,
    body,
    userId,
    getRequestIpAddress(req)
  )
  res.status(200).json({ success: true, data })
}

export const togglePublished = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { key, locale } = ContentKeyLocaleParamsSchema.parse(req.params)
  const body = TogglePublishedSchema.parse(req.body)
  const data = await contentBlockService.togglePublished(
    key,
    locale,
    body,
    userId,
    getRequestIpAddress(req)
  )
  res.status(200).json({ success: true, data })
}

export const deleteContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { key, locale } = ContentKeyLocaleParamsSchema.parse(req.params)
  const data = await contentBlockService.deleteContent(
    key,
    locale,
    userId,
    getRequestIpAddress(req)
  )
  res.status(200).json({ success: true, data })
}

export const uploadContentAsset = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const body = UploadContentAssetBodySchema.parse(req.body)
  const file = req.file
  if (!file) {
    throw new ValidationError('No file uploaded')
  }
  const data = await contentBlockService.uploadContentAssetDraft(
    userId,
    body.key,
    body.slot,
    file
  )
  res.status(201).json({ success: true, data })
}

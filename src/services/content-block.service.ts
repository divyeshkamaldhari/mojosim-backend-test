import path from 'node:path'

import { NotFoundError, ValidationError } from '../common/errors'
import { env } from '../config/env'
import type { ContentBlock } from '../models/content-block'
import type {
  UpsertContentBlockDto,
  TogglePublishedDto,
} from '../dto/content-block.dto'
import type { UploadFileInput } from '../modules/s3'
import {
  buildPublicUrlForKey,
  copyObjectByKey,
  deleteObjectByKey,
  objectExistsByKey,
  uploadFileAtKey,
} from '../modules/s3'
import {
  ContentBlockRepository,
  type UpsertContentBlockData,
} from '../repositories/content-block.repository'
import { auditService } from './audit.service'

type PublicContentResponse = {
  key: string
  type: string
  locale: string
  value: unknown
}

type AdminContentItem = {
  id: number
  key: string
  locale: string
  type: string
  value: unknown
  isPublished: boolean
  updatedBy: number | null
  createdAt: Date
  updatedAt: Date
}

type AdminUpsertResponse = {
  id: number
  key: string
  locale: string
  type: string
  value: unknown
  isPublished: boolean
  updatedAt: Date
}

type UploadContentAssetResponse = {
  draft_url: string
  key: string
  slot: string
}

const capitalizeCategories = (value: unknown): unknown => {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(capitalizeCategories)
  }

  const result: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (key === 'category' && typeof val === 'string' && val.length > 0) {
      result[key] = val.charAt(0).toUpperCase() + val.slice(1)
    } else {
      result[key] = capitalizeCategories(val)
    }
  }
  return result
}

const mapAdminItem = (row: ContentBlock): AdminContentItem => ({
  id: row.id,
  key: row.key,
  locale: row.locale,
  type: row.type,
  value: capitalizeCategories(row.value),
  isPublished: row.isPublished,
  updatedBy: row.updatedBy,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
})

const mapAdminUpsert = (row: ContentBlock): AdminUpsertResponse => ({
  id: row.id,
  key: row.key,
  locale: row.locale,
  type: row.type,
  value: capitalizeCategories(row.value),
  isPublished: row.isPublished,
  updatedAt: row.updatedAt,
})

const storageBaseUrl = env.STORAGE_BASE_URL.replace(/\/$/, '')
const baseS3Url = env.AWS_S3_BASE_URL.replace(/\/$/, '')
const storageBasePath = (() => {
  try {
    const parsed = new URL(storageBaseUrl)
    return parsed.pathname.replace(/\/$/, '')
  } catch {
    return ''
  }
})()

const isDraftUrlForActor = (url: string, actorId: number): boolean => {
  return (
    url.startsWith(`${storageBaseUrl}/content/_draft/${actorId}/`) ||
    url.startsWith(`${baseS3Url}/content/_draft/${actorId}/`)
  )
}

const toS3KeyFromUrl = (url: string): string => {
  try {
    const parsed = new URL(url)
    let pathname = decodeURIComponent(parsed.pathname)
    if (storageBasePath && pathname.startsWith(`${storageBasePath}/`)) {
      pathname = pathname.slice(storageBasePath.length)
    }
    return pathname.replace(/^\/+/, '')
  } catch {
    return url.replace(`${baseS3Url}/`, '')
  }
}

const buildLiveKeyFromDraftKey = (draftKey: string): string => {
  const parts = draftKey.split('/')
  if (parts.length < 5) {
    throw new ValidationError('Invalid draft media path')
  }
  // content/_draft/{actorId}/{key}/{slot}-{ts}.{ext}
  const contentPrefix = parts[0]
  const maybeDraft = parts[1]
  const key = parts[3]
  const fileName = parts[4]
  if (
    contentPrefix !== 'content' ||
    maybeDraft !== '_draft' ||
    !key ||
    !fileName
  ) {
    throw new ValidationError('Invalid draft media path')
  }

  const fileExt = path.extname(fileName)
  const nameWithoutExt = fileName.slice(
    0,
    Math.max(0, fileName.length - fileExt.length)
  )
  const dashIndex = nameWithoutExt.lastIndexOf('-')
  if (dashIndex <= 0) {
    throw new ValidationError('Invalid draft media filename')
  }
  const slot = nameWithoutExt.slice(0, dashIndex)
  return `content/${key}/${slot}${fileExt}`
}

const commitDraftToLive = async (draftKey: string): Promise<string> => {
  const liveKey = buildLiveKeyFromDraftKey(draftKey)
  try {
    await copyObjectByKey(draftKey, liveKey)
    await deleteObjectByKey(draftKey)
  } catch (err) {
    const isNoSuchKey =
      err instanceof Error &&
      (err.name === 'NoSuchKey' || err.message.includes('NoSuchKey'))
    if (!isNoSuchKey) {
      throw err
    }
    const liveExists = await objectExistsByKey(liveKey)
    if (!liveExists) {
      throw err
    }
  }
  return buildPublicUrlForKey(liveKey)
}

const replaceDraftUrlsWithLiveUrls = async (
  value: unknown,
  actorId: number
): Promise<unknown> => {
  if (typeof value === 'string') {
    if (!isDraftUrlForActor(value, actorId)) {
      return value
    }
    const draftKey = toS3KeyFromUrl(value)
    return commitDraftToLive(draftKey)
  }

  if (Array.isArray(value)) {
    const items: unknown[] = []
    for (const item of value) {
      items.push(await replaceDraftUrlsWithLiveUrls(item, actorId))
    }
    return items
  }

  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = await replaceDraftUrlsWithLiveUrls(v, actorId)
    }
    return out
  }

  return value
}

export class ContentBlockService {
  private readonly repository: ContentBlockRepository

  constructor(
    repository: ContentBlockRepository = new ContentBlockRepository()
  ) {
    this.repository = repository
  }

  getPublicContent = async (
    key: string,
    locale: string
  ): Promise<PublicContentResponse> => {
    const direct = await this.repository.findByKeyAndLocale(key, locale)
    if (direct?.isPublished) {
      return {
        key: direct.key,
        type: direct.type,
        locale: direct.locale,
        value: capitalizeCategories(direct.value),
      }
    }

    if (locale !== 'en') {
      const fallback = await this.repository.findByKeyAndLocale(key, 'en')
      if (fallback?.isPublished) {
        return {
          key: fallback.key,
          type: fallback.type,
          locale: fallback.locale,
          value: capitalizeCategories(fallback.value),
        }
      }
    }

    throw new NotFoundError('Content')
  }

  getAllContent = async (
    page: number,
    limit: number
  ): Promise<{
    items: AdminContentItem[]
    meta: { page: number; limit: number; total: number }
  }> => {
    const { rows, count } = await this.repository.findAll(page, limit)
    return {
      items: rows.map(mapAdminItem),
      meta: { page, limit, total: count },
    }
  }

  upsertContent = async (
    key: string,
    dto: UpsertContentBlockDto,
    actorId: number,
    ipAddress: string
  ): Promise<AdminUpsertResponse> => {
    const processedValue = await replaceDraftUrlsWithLiveUrls(
      dto.value,
      actorId
    )
    const capitalizedValue = capitalizeCategories(processedValue)
    const upsertData: UpsertContentBlockData = {
      key,
      locale: dto.locale,
      type: dto.type,
      value: capitalizedValue,
      isPublished: dto.isPublished,
      updatedBy: actorId,
    }

    const row = await this.repository.upsert(upsertData)

    void auditService.createLog({
      action: 'content.updated',
      entityType: 'content_blocks',
      entityId: row.id,
      actorId,
      beforeState: null,
      afterState: {
        key: row.key,
        locale: row.locale,
        type: row.type,
        isPublished: row.isPublished,
      },
      ipAddress,
    })

    return mapAdminUpsert(row)
  }

  uploadContentAssetDraft = async (
    actorId: number,
    key: string,
    slot: string,
    file: UploadFileInput
  ): Promise<UploadContentAssetResponse> => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin'
    const timestamp = Date.now()
    const draftKey = `content/_draft/${actorId}/${key}/${slot}-${timestamp}${ext}`
    const draftUrl = await uploadFileAtKey(file, draftKey)
    return {
      draft_url: draftUrl,
      key,
      slot,
    }
  }

  togglePublished = async (
    key: string,
    locale: string,
    dto: TogglePublishedDto,
    actorId: number,
    ipAddress: string
  ): Promise<{ message: string; isPublished: boolean }> => {
    const existing = await this.repository.findByKeyAndLocale(key, locale)
    if (!existing) {
      throw new NotFoundError('Content')
    }

    await this.repository.updatePublished(key, locale, dto.isPublished)

    void auditService.createLog({
      action: dto.isPublished ? 'content.published' : 'content.unpublished',
      entityType: 'content_blocks',
      entityId: existing.id,
      actorId,
      beforeState: { isPublished: existing.isPublished },
      afterState: { isPublished: dto.isPublished },
      ipAddress,
    })

    return {
      message: dto.isPublished ? 'Content published' : 'Content unpublished',
      isPublished: dto.isPublished,
    }
  }

  deleteContent = async (
    key: string,
    locale: string,
    actorId: number,
    ipAddress: string
  ): Promise<{ message: string }> => {
    const existing = await this.repository.findByKeyAndLocale(key, locale)
    if (!existing) {
      throw new NotFoundError('Content')
    }

    await this.repository.deleteByKeyAndLocale(key, locale)

    void auditService.createLog({
      action: 'content.deleted',
      entityType: 'content_blocks',
      entityId: existing.id,
      actorId,
      beforeState: null,
      afterState: { key, locale },
      ipAddress,
    })

    return { message: 'Content block deleted successfully' }
  }
}

export const contentBlockService = new ContentBlockService()

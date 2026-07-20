/* eslint-disable sonarjs/no-duplicate-string */
import { z } from 'zod'

import {
  isAllowedContentKey,
  isAllowedContentSlot,
} from '../config/content-block.contract'

export const GetContentQuerySchema = z.object({
  locale: z.string().min(2).max(10).default('en'),
})

export const UpsertContentBlockSchema = z.object({
  locale: z.string().min(2).max(10),
  type: z.enum(['faq', 'promoCard', 'destinationCard', 'richText']),
  value: z.any(),
  isPublished: z.boolean().default(false),
})

export const TogglePublishedSchema = z.object({
  isPublished: z.boolean(),
})

export const ContentKeyLocaleParamsSchema = z.object({
  key: z
    .string()
    .min(1)
    .refine((value) => isAllowedContentKey(value), {
      message: 'Invalid content key',
    }),
  locale: z.string().min(2).max(10),
})

export const ContentKeyParamsSchema = z.object({
  key: z
    .string()
    .min(1)
    .refine((value) => isAllowedContentKey(value), {
      message: 'Invalid content key',
    }),
})

export const UploadContentAssetBodySchema = z
  .object({
    key: z.string().min(1),
    slot: z.string().min(1),
  })
  .refine((data) => isAllowedContentKey(data.key), {
    message: 'Invalid content key',
    path: ['key'],
  })
  .refine((data) => isAllowedContentSlot(data.key, data.slot), {
    message: 'Invalid slot for content key',
    path: ['slot'],
  })

export const ListContentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export type GetContentQuery = z.infer<typeof GetContentQuerySchema>
export type UpsertContentBlockDto = z.infer<typeof UpsertContentBlockSchema>
export type TogglePublishedDto = z.infer<typeof TogglePublishedSchema>
export type ContentKeyLocaleParams = z.infer<
  typeof ContentKeyLocaleParamsSchema
>
export type ContentKeyParams = z.infer<typeof ContentKeyParamsSchema>
export type ListContentQuery = z.infer<typeof ListContentQuerySchema>
export type UploadContentAssetBody = z.infer<
  typeof UploadContentAssetBodySchema
>

import { z } from 'zod'

import { ProviderCountryCodeSchema } from './country-code.schema'

export const optionalBooleanQuery = z
  .union([z.literal('true'), z.literal('false')])
  .optional()
  .transform((v) => {
    if (v === 'true') {
      return true
    }
    if (v === 'false') {
      return false
    }
    return undefined
  })

const optionalDataQuery = z.preprocess(
  (val: unknown) => {
    if (val === undefined || val === null || val === '') {
      return undefined
    }

    if (typeof val === 'string') {
      const normalized = val.trim().toLowerCase()
      if (normalized === 'unlimited') {
        return normalized
      }
      const dataPattern = /^(\d+)\s*(gb|mb)$/
      const match = dataPattern.exec(normalized)
      if (match) {
        const amount = Number(match[1])
        if (Number.isInteger(amount) && amount > 0) {
          return `${amount}${match[2]}`
        }
      }
    }

    return val
  },
  z
    .string()
    .regex(/^(unlimited|\d+(gb|mb))$/)
    .optional()
)

export const ListPlansQuerySchema = z.object({
  country_code: ProviderCountryCodeSchema.optional(),
  region: z.string().min(1).max(100).optional(),
  plan_type: z.enum(['local', 'regional', 'global']).optional(),
  airalo_package_type: z
    .string()
    .min(1)
    .max(20)
    .transform((s) => s.toLowerCase())
    .optional(),
  is_featured: optionalBooleanQuery,
  provider_id: z.coerce.number().int().positive().optional(),
  data: optionalDataQuery,
  validity_days: z.coerce.number().int().min(1).max(3650).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export type ListPlansQuery = z.infer<typeof ListPlansQuerySchema>

export const PlanIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const SearchPlansQuerySchema = z.object({
  q: z.string().min(1).max(200).trim(),
})

export type SearchPlansQuery = z.infer<typeof SearchPlansQuerySchema>

export const SearchDestinationsQuerySchema = z.object({
  q: z.string().min(1).max(200).trim().optional(),
})

export type SearchDestinationsQuery = z.infer<
  typeof SearchDestinationsQuerySchema
>

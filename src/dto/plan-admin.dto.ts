import { z } from 'zod'
import { ProviderCountryCodeSchema } from './country-code.schema'
import { ListPlansQuerySchema, optionalBooleanQuery } from './plan.dto'

export const UpdatePlanAdminSchema = z
  .object({
    is_active: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    custom_margin_percent: z.number().min(0).max(200).nullable().optional(),
  })
  .refine(
    (data) =>
      data.is_active !== undefined ||
      data.is_featured !== undefined ||
      data.custom_margin_percent !== undefined,
    {
      message: 'At least one field must be provided',
    }
  )

export const UpsertPlanTranslationSchema = z.object({
  locale: z.string().min(2).max(10),
  name: z.string().min(1).max(255),
  description: z.string().min(1),
})

export const PlanIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const RecalculateProviderParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const PlanTranslationParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  locale: z.string().min(2).max(10),
})

export const DestinationCodeParamsSchema = z.object({
  country_code: ProviderCountryCodeSchema,
})

export const UpdateDestinationStatusSchema = z.object({
  is_active: z.boolean(),
})

export const AdminListDestinationsQuerySchema = z.object({
  q: z.string().min(1).max(200).trim().optional(),
})

export const AdminListPlansQuerySchema = ListPlansQuerySchema.extend({
  is_active: optionalBooleanQuery,
})

export type UpdatePlanAdminDto = z.infer<typeof UpdatePlanAdminSchema>
export type UpsertPlanTranslationDto = z.infer<
  typeof UpsertPlanTranslationSchema
>
export type PlanIdParams = z.infer<typeof PlanIdParamsSchema>
export type RecalculateProviderParams = z.infer<
  typeof RecalculateProviderParamsSchema
>
export type PlanTranslationParams = z.infer<typeof PlanTranslationParamsSchema>
export type AdminListPlansQuery = z.infer<typeof AdminListPlansQuerySchema>
export type DestinationCodeParams = z.infer<typeof DestinationCodeParamsSchema>
export type UpdateDestinationStatusDto = z.infer<
  typeof UpdateDestinationStatusSchema
>
export type AdminListDestinationsQuery = z.infer<
  typeof AdminListDestinationsQuerySchema
>

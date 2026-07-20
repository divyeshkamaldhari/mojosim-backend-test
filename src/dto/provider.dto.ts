import { z } from 'zod'

export const CreateProviderSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(100),
  api_base_url: z.string().url(),
  api_credentials: z.object({
    client_id: z.string().min(1),
    client_secret: z.string().min(1),
    api_key: z.string().min(1).optional().nullable(),
  }),
  priority: z.number().int().min(0).default(0),
  margin_percent: z.number().min(0).max(200).default(20),
  capabilities: z.object({
    webhooks: z.boolean().default(false),
    topup: z.boolean().default(false),
    renewal: z.boolean().default(false),
    usage_api: z.boolean().default(false),
  }),
})

export const UpdateProviderSchema = CreateProviderSchema.partial()
  .omit({ slug: true })
  .strict()

export const ProviderIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const ListProvidersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export const AiraloWebhookOptInSchema = z.object({
  webhook_url: z.string().url().optional().nullable(),
  types: z.array(z.string().min(1).max(100)).min(1).optional().nullable(),
})

export type CreateProviderDto = z.infer<typeof CreateProviderSchema>
export type UpdateProviderDto = z.infer<typeof UpdateProviderSchema>
export type ProviderIdParams = z.infer<typeof ProviderIdParamsSchema>
export type ListProvidersQuery = z.infer<typeof ListProvidersQuerySchema>
export type AiraloWebhookOptInDto = z.infer<typeof AiraloWebhookOptInSchema>

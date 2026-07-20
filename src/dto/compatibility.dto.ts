import { z } from 'zod'

export const ListCompatibleDevicesQuerySchema = z.object({
  provider_id: z.coerce.number().int().positive().optional(),
  search: z.string().min(1).max(255).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export type ListCompatibleDevicesQuery = z.infer<
  typeof ListCompatibleDevicesQuerySchema
>

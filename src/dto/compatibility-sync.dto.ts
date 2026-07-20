import { z } from 'zod'

export const SyncCompatibilitySchema = z.object({
  provider_id: z.coerce.number().int().positive().optional(),
})

export type SyncCompatibilityDto = z.infer<typeof SyncCompatibilitySchema>

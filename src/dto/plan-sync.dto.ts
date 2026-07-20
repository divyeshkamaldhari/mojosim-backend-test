import { z } from 'zod'

export const SyncPlansSchema = z.object({
  provider_id: z.coerce.number().int().positive().optional(),
})

export type SyncPlansDto = z.infer<typeof SyncPlansSchema>

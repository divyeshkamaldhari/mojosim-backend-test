import { z } from 'zod'

export const UpsertCartItemDtoSchema = z.object({
  plan_id: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
})

export type UpsertCartItemDto = z.infer<typeof UpsertCartItemDtoSchema>

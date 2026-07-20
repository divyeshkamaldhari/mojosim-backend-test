import { z } from 'zod'

export const EsimIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type EsimIdParams = z.infer<typeof EsimIdParamsSchema>

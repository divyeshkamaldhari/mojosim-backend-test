import { z } from 'zod'

export const ListWebhookEventsQuerySchema = z.object({
  source: z.enum(['stripe', 'airalo']).optional().nullable(),
  event_type: z.string().min(1).max(100).optional().nullable(),
  processed: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export const WebhookEventIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type ListWebhookEventsQuery = z.infer<
  typeof ListWebhookEventsQuerySchema
>
export type WebhookEventIdParams = z.infer<typeof WebhookEventIdParamsSchema>

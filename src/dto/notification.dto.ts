import { z } from 'zod'

const ChannelSchema = z.enum(['email', 'in_app'])
const BooleanQuerySchema = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true') {
      return true
    }

    if (normalized === 'false') {
      return false
    }
  }

  return value
}, z.boolean())

export const ListNotificationsQuerySchema = z.object({
  channel: ChannelSchema.optional(),
  is_read: BooleanQuerySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export type ListNotificationsQuery = z.infer<
  typeof ListNotificationsQuerySchema
>

import { z } from 'zod'

export const SubscribeNewsletterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  terms_accepted: z.boolean().refine((value) => value === true, {
    message: 'You must accept the terms and privacy policy',
  }),
})

export type SubscribeNewsletterDto = z.infer<typeof SubscribeNewsletterSchema>

const newsletterStatusValues = ['active', 'used', 'expired'] as const

export const AdminListNewsletterSubscriptionsQuerySchema = z.object({
  status: z.enum(newsletterStatusValues).optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export const NewsletterSubscriptionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type AdminListNewsletterSubscriptionsQuery = z.infer<
  typeof AdminListNewsletterSubscriptionsQuerySchema
>

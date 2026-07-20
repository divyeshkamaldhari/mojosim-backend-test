import { z } from 'zod'

export const CreateOrderDtoSchema = z.object({
  cart_id: z.coerce.number().int().positive(),
  idempotency_key: z.string().min(1).max(255),
  contact: z
    .object({
      email: z.string().email(),
      first_name: z.string().min(1).max(100),
      last_name: z.string().min(1).max(100),
      phone: z.string().min(1).max(25).optional().nullable(),
      billing: z
        .object({
          country: z.string().min(1).max(10),
          address_line1: z.string().min(1).max(200),
          postal_code: z.string().min(1).max(20),
          city: z.string().min(1).max(100),
          state: z.string().max(100).optional().nullable(),
        })
        .optional(),
    })
    .optional(),
  promo_code: z.string().min(1).max(32).optional().nullable(),
})

export type CreateOrderDto = z.infer<typeof CreateOrderDtoSchema>

export const ListOrdersQuerySchema = z.object({
  status: z
    .enum(['pending', 'confirmed', 'failed', 'refunded', 'cancelled'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export type ListOrdersQuery = z.infer<typeof ListOrdersQuerySchema>

export const OrderIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type OrderIdParams = z.infer<typeof OrderIdParamsSchema>

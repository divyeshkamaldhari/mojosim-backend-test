import { z } from 'zod'

export const InvoiceOrderParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const AdminListInvoicesQuerySchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  order_id: z.coerce.number().int().positive().optional(),
  orderId: z.coerce.number().int().positive().optional(),
  user_id: z.coerce.number().int().positive().optional(),
  userId: z.coerce.number().int().positive().optional(),
  currency: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export const ListCustomerInvoicesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export const InvoiceIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type InvoiceOrderParams = z.infer<typeof InvoiceOrderParamsSchema>
export type AdminListInvoicesQuery = z.infer<
  typeof AdminListInvoicesQuerySchema
>
export type ListCustomerInvoicesQuery = z.infer<
  typeof ListCustomerInvoicesQuerySchema
>
export type InvoiceIdParams = z.infer<typeof InvoiceIdParamsSchema>

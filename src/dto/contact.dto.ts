import { z } from 'zod'

export const CreateContactSubmissionSchema = z.object({
  full_name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().min(1).max(25).optional().nullable(),
  message: z.string().min(10).max(2000),
})

const optionalQueryBoolean = z.preprocess((val: unknown) => {
  if (val === undefined || val === null || val === '') return undefined
  if (typeof val === 'boolean') return val
  if (typeof val === 'string') {
    const s = val.toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
  }
  return val
}, z.boolean().optional())

export const AdminListContactSubmissionsQuerySchema = z.object({
  is_read: optionalQueryBoolean,
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export const ContactSubmissionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export type CreateContactSubmissionDto = z.infer<
  typeof CreateContactSubmissionSchema
>
export type AdminListContactSubmissionsQuery = z.infer<
  typeof AdminListContactSubmissionsQuerySchema
>

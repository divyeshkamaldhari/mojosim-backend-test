import { z } from 'zod'

export const CheckoutIdentifyDtoSchema = z.object({
  email: z.string().email('Email must be valid'),
  first_name: z.string().min(1, 'First name is required').max(100),
  last_name: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().min(1).max(25).optional().nullable(),
  locale: z.string().min(2).max(10).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
})

export type CheckoutIdentifyDto = z.infer<typeof CheckoutIdentifyDtoSchema>

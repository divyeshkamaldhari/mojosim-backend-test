import { z } from 'zod'

export const ValidatePromoCodeSchema = z.object({
  code: z.string().min(1, 'Promo code is required').max(32),
  email: z.string().email('Please enter a valid email address'),
  subtotal: z.coerce.number().positive('A valid subtotal is required'),
})

export type ValidatePromoCodeDto = z.infer<typeof ValidatePromoCodeSchema>

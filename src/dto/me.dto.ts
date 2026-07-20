import { z } from 'zod'

export const UpdateProfileDtoSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(25).optional().nullable(),
  locale: z.string().min(2).max(10).optional(),
})

export type UpdateProfileDto = z.infer<typeof UpdateProfileDtoSchema>

export const ChangePasswordDtoSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
})

export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>

export const SessionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

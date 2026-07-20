import { z } from 'zod'

const EMAIL_VALIDATION_MESSAGE = 'Email must be valid'

export const RegisterDtoSchema = z.object({
  email: z.string().email(EMAIL_VALIDATION_MESSAGE),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  locale: z.string().min(2).max(10).optional(),
  currency: z.string().length(3).toUpperCase().optional(),
  phone: z.string().min(1).max(25).optional().nullable(),
})

export type RegisterDto = z.infer<typeof RegisterDtoSchema>

export const VerifyEmailDtoSchema = z.object({
  token: z.string().min(1),
})

export type VerifyEmailDto = z.infer<typeof VerifyEmailDtoSchema>

export const ResendVerificationDtoSchema = z.object({
  email: z.string().email(),
})

export type ResendVerificationDto = z.infer<typeof ResendVerificationDtoSchema>

export const LoginDtoSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export type LoginDto = z.infer<typeof LoginDtoSchema>

export const ForgotPasswordDtoSchema = z.object({
  email: z.string().email(),
})

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDtoSchema>

export const ResetPasswordDtoSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
})

export type ResetPasswordDto = z.infer<typeof ResetPasswordDtoSchema>

export const VerifyResetTokenDtoSchema = z.object({
  token: z.string().min(1),
})

export type VerifyResetTokenDto = z.infer<typeof VerifyResetTokenDtoSchema>

export const OtpRequestDtoSchema = z.object({
  email: z.string().email(EMAIL_VALIDATION_MESSAGE),
})

export type OtpRequestDto = z.infer<typeof OtpRequestDtoSchema>

export const OtpVerifyDtoSchema = z.object({
  email: z.string().email(EMAIL_VALIDATION_MESSAGE),
  code: z.string().regex(/^\d{6}$/, 'Login code must be a 6-digit number'),
  purpose: z.string().optional(),
})

export type OtpVerifyDto = z.infer<typeof OtpVerifyDtoSchema>

export const ChangePasswordDtoSchema = z.object({
  oldPassword: z.string().min(8).max(128),
  newPassword: z.string().min(8).max(128),
})

export type ChangePasswordDto = z.infer<typeof ChangePasswordDtoSchema>

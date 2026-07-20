import { Router } from 'express'
import rateLimit from 'express-rate-limit'

import { authenticate, requireRole } from '../middlewares/auth.middleware'
import {
  forgotPassword,
  login,
  logout,
  refresh,
  register,
  requestOtp,
  requestVerificationOtp,
  resetPassword,
  resendVerification,
  verifyOtp,
  verifyResetToken,
  verifyEmail,
} from '../controllers/auth.controller'

export const authRouter = Router()

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
})

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

authRouter.post('/register', register)
authRouter.post('/verify-email', verifyEmail)
authRouter.post('/resend-verification', resendVerification)
authRouter.post('/login', login)
authRouter.post('/otp/request', otpRequestLimiter, requestOtp)
authRouter.post(
  '/otp/verify-request',
  otpRequestLimiter,
  requestVerificationOtp
)
authRouter.post('/otp/verify', otpVerifyLimiter, verifyOtp)
authRouter.post('/logout', authenticate, requireRole('customer'), logout)
authRouter.post('/refresh', refresh)
authRouter.post('/forgot-password', forgotPassword)
authRouter.post('/reset-password', resetPassword)
authRouter.post('/reset-password/verify', verifyResetToken)

import { Request, Response } from 'express'

import {
  REFRESH_COOKIE_CUSTOMER,
  REFRESH_COOKIE_LEGACY,
  REFRESH_COOKIE_STAFF,
} from '../constants/auth-cookies'
import { UnauthorizedError } from '../common/errors'
import { authService } from '../services/auth.service'
import {
  getRequestIpAddress,
  getRequestUserAgent,
} from '../utils/request-client.util'
import {
  clearAllRefreshCookies,
  clearRefreshCookie,
  setRefreshCookie,
} from '../utils/auth-cookie.util'
import {
  ForgotPasswordDtoSchema,
  LoginDtoSchema,
  OtpRequestDtoSchema,
  OtpVerifyDtoSchema,
  RegisterDtoSchema,
  ResetPasswordDtoSchema,
  ResendVerificationDtoSchema,
  VerifyResetTokenDtoSchema,
  VerifyEmailDtoSchema,
} from '../dto/auth.dto'

const getCookieValue = (req: Request, name: string): string | null => {
  const raw = req.headers.cookie
  if (!raw) return null

  const parts = raw.split(';').map((p) => p.trim())
  for (const part of parts) {
    const [k, ...rest] = part.split('=')
    if (!k) continue
    if (k === name) return rest.join('=')
  }

  return null
}

const pickCustomerRefreshToken = (
  req: Request
): { token: string; source: 'customer' | 'legacy' } | null => {
  const lane = getCookieValue(req, REFRESH_COOKIE_CUSTOMER)
  if (lane) return { token: lane, source: 'customer' }
  const legacy = getCookieValue(req, REFRESH_COOKIE_LEGACY)
  if (legacy) return { token: legacy, source: 'legacy' }
  return null
}

const pickStaffRefreshToken = (
  req: Request
): { token: string; source: 'staff' | 'legacy' } | null => {
  const lane = getCookieValue(req, REFRESH_COOKIE_STAFF)
  if (lane) return { token: lane, source: 'staff' }
  const legacy = getCookieValue(req, REFRESH_COOKIE_LEGACY)
  if (legacy) return { token: legacy, source: 'legacy' }
  return null
}

const clearCustomerLaneCookies = (res: Response): void => {
  clearRefreshCookie(res, REFRESH_COOKIE_CUSTOMER)
  clearRefreshCookie(res, REFRESH_COOKIE_LEGACY)
}

const clearStaffLaneCookies = (res: Response): void => {
  clearRefreshCookie(res, REFRESH_COOKIE_STAFF)
  clearRefreshCookie(res, REFRESH_COOKIE_LEGACY)
}

export const register = async (req: Request, res: Response): Promise<void> => {
  const body = RegisterDtoSchema.parse(req.body)
  const result = await authService.register(body)
  res.status(201).json({ success: true, data: result })
}

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = VerifyEmailDtoSchema.parse(req.body)
  const result = await authService.verifyEmail(body)
  res.status(200).json({ success: true, data: result })
}

export const resendVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = ResendVerificationDtoSchema.parse(req.body)
  const result = await authService.resendVerification(body)
  res.status(200).json({ success: true, data: result })
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const body = LoginDtoSchema.parse(req.body)
  const userAgent = getRequestUserAgent(req)
  const ipAddress = getRequestIpAddress(req)

  const { accessToken, accessExpiresInSeconds, refreshToken, user } =
    await authService.login(body, ipAddress, userAgent)

  clearAllRefreshCookies(res)
  const laneCookie =
    user.role === 'customer' ? REFRESH_COOKIE_CUSTOMER : REFRESH_COOKIE_STAFF
  setRefreshCookie(res, laneCookie, refreshToken)

  res.status(200).json({
    success: true,
    data: {
      access_token: accessToken,
      expires_in: accessExpiresInSeconds,
      user,
    },
  })
}

export const logout = async (req: Request, res: Response): Promise<void> => {
  const picked = pickCustomerRefreshToken(req)
  if (!picked) {
    throw new UnauthorizedError()
  }

  const result = await authService.logout(picked.token)

  clearCustomerLaneCookies(res)

  res.status(200).json({ success: true, data: result })
}

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const picked = pickCustomerRefreshToken(req)
  if (!picked) {
    throw new UnauthorizedError()
  }

  const result = await authService.refresh(picked.token, 'customer')

  if (picked.source === 'legacy') {
    setRefreshCookie(res, REFRESH_COOKIE_CUSTOMER, picked.token)
    clearRefreshCookie(res, REFRESH_COOKIE_LEGACY)
  }

  res.status(200).json({
    success: true,
    data: {
      access_token: result.accessToken,
      expires_in: result.accessExpiresInSeconds,
    },
  })
}

export const staffLogout = async (
  req: Request,
  res: Response
): Promise<void> => {
  const picked = pickStaffRefreshToken(req)
  if (!picked) {
    throw new UnauthorizedError()
  }

  const result = await authService.logout(picked.token)

  clearStaffLaneCookies(res)

  res.status(200).json({ success: true, data: result })
}

export const staffRefresh = async (
  req: Request,
  res: Response
): Promise<void> => {
  const picked = pickStaffRefreshToken(req)
  if (!picked) {
    throw new UnauthorizedError()
  }

  const result = await authService.refresh(picked.token, 'staff')

  if (picked.source === 'legacy') {
    setRefreshCookie(res, REFRESH_COOKIE_STAFF, picked.token)
    clearRefreshCookie(res, REFRESH_COOKIE_LEGACY)
  }

  res.status(200).json({
    success: true,
    data: {
      access_token: result.accessToken,
      expires_in: result.accessExpiresInSeconds,
    },
  })
}

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = ForgotPasswordDtoSchema.parse(req.body)
  const result = await authService.forgotPassword(body)
  res.status(200).json({ success: true, data: result })
}

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = ResetPasswordDtoSchema.parse(req.body)
  const result = await authService.resetPassword(body)
  res.status(200).json({ success: true, data: result })
}

export const verifyResetToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = VerifyResetTokenDtoSchema.parse(req.body)
  const valid = await authService.verifyResetToken(body.token)
  res.status(200).json({ success: true, data: { valid } })
}

export const requestOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = OtpRequestDtoSchema.parse(req.body)
  const result = await authService.requestOtp(body)
  res.status(200).json({ success: true, data: result })
}
export const requestVerificationOtp = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = OtpRequestDtoSchema.parse(req.body)
  const result = await authService.requestVerificationOtp(body)
  res.status(200).json({ success: true, data: result })
}

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  const body = OtpVerifyDtoSchema.parse(req.body)
  const userAgent = getRequestUserAgent(req)
  const ipAddress = getRequestIpAddress(req)

  const { accessToken, accessExpiresInSeconds, refreshToken, user } =
    await authService.verifyOtp(body, ipAddress, userAgent, body.purpose)

  clearAllRefreshCookies(res)
  setRefreshCookie(res, REFRESH_COOKIE_CUSTOMER, refreshToken)

  res.status(200).json({
    success: true,
    data: {
      access_token: accessToken,
      expires_in: accessExpiresInSeconds,
      user,
    },
  })
}

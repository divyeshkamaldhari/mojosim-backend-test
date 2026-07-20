import { CookieOptions, Response } from 'express'
import { env } from '../config/env'
import { GUEST_CART_COOKIE } from '../constants/guest-cart-cookies'

const GUEST_CART_MAX_AGE_MS = 24 * 60 * 60 * 1000

const getGuestCartCookieOptions = (isClear = false): CookieOptions => {
  const opts: CookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }

  if (env.AUTH_COOKIE_DOMAIN) {
    opts.domain = env.AUTH_COOKIE_DOMAIN
  }

  if (!isClear) {
    opts.maxAge = GUEST_CART_MAX_AGE_MS
  }

  return opts
}

export const setGuestCartCookie = (res: Response, guestToken: string): void => {
  res.cookie(GUEST_CART_COOKIE, guestToken, getGuestCartCookieOptions())
}

export const clearGuestCartCookie = (res: Response): void => {
  res.clearCookie(GUEST_CART_COOKIE, getGuestCartCookieOptions(true))
}

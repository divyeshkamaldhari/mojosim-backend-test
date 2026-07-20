import { CookieOptions, Response } from 'express'
import { env } from '../config/env'
import {
  REFRESH_COOKIE_CUSTOMER,
  REFRESH_COOKIE_STAFF,
  REFRESH_COOKIE_LEGACY,
} from '../constants/auth-cookies'

const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

const COOKIE_DOMAIN = env.AUTH_COOKIE_DOMAIN

export const getRefreshCookieOpts = (isClear = false): CookieOptions => {
  const opts: CookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  }

  if (COOKIE_DOMAIN) {
    opts.domain = COOKIE_DOMAIN
  }

  if (!isClear) {
    opts.maxAge = REFRESH_MAX_AGE_MS
  }

  return opts
}

export const setRefreshCookie = (
  res: Response,
  name: string,
  token: string
): void => {
  res.cookie(name, token, getRefreshCookieOpts())
}

export const clearRefreshCookie = (res: Response, name: string): void => {
  res.clearCookie(name, getRefreshCookieOpts(true))
}

export const clearAllRefreshCookies = (res: Response): void => {
  const names = [
    REFRESH_COOKIE_CUSTOMER,
    REFRESH_COOKIE_STAFF,
    REFRESH_COOKIE_LEGACY,
  ]
  for (const name of names) {
    clearRefreshCookie(res, name)
  }
}

import { NextFunction, Request, Response } from 'express'

import { UnauthorizedError } from '../common/errors'
import { GUEST_CART_COOKIE } from '../constants/guest-cart-cookies'

const getCookieValue = (req: Request, name: string): string | null => {
  const raw = req.headers.cookie
  if (!raw) {
    return null
  }

  const parts = raw.split(';').map((part) => part.trim())
  for (const part of parts) {
    const [key, ...rest] = part.split('=')
    if (key === name) {
      return decodeURIComponent(rest.join('='))
    }
  }

  return null
}

export const requireGuestCartToken = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const token = getCookieValue(req, GUEST_CART_COOKIE)
  if (!token || token.length < 32) {
    throw new UnauthorizedError()
  }

  req.guestCartToken = token
  next()
}

export const getGuestCartTokenFromRequest = (req: Request): string | null => {
  return getCookieValue(req, GUEST_CART_COOKIE)
}

declare module 'express' {
  interface Request {
    guestCartToken?: string
  }
}

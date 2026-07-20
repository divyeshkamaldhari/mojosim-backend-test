import { Request, Response } from 'express'

import { UnauthorizedError } from '../common/errors'
import { REFRESH_COOKIE_CUSTOMER } from '../constants/auth-cookies'
import { CheckoutIdentifyDtoSchema } from '../dto/checkout.dto'
import { checkoutService } from '../services/checkout.service'
import { getGuestCartTokenFromRequest } from '../middlewares/guest-cart.middleware'
import { clearGuestCartCookie } from '../utils/guest-cart-cookie.util'
import {
  getRequestIpAddress,
  getRequestUserAgent,
} from '../utils/request-client.util'
import { setRefreshCookie } from '../utils/auth-cookie.util'

const respondIdentifyCheckout = (
  res: Response,
  result: Awaited<ReturnType<typeof checkoutService.identify>>
): void => {
  setRefreshCookie(res, REFRESH_COOKIE_CUSTOMER, result.refreshToken)
  clearGuestCartCookie(res)

  res.status(200).json({
    success: true,
    data: {
      cart: result.cart,
      access_token: result.access_token,
      expires_in: result.expires_in,
      user: result.user,
    },
  })
}

export const identifyCheckout = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = CheckoutIdentifyDtoSchema.parse(req.body)
  const guestToken = getGuestCartTokenFromRequest(req)

  const result = await checkoutService.identify(
    body,
    guestToken,
    getRequestIpAddress(req),
    getRequestUserAgent(req),
    req.user?.userId
  )

  respondIdentifyCheckout(res, result)
}

export const identifyCheckoutAuthenticated = async (
  req: Request,
  res: Response
): Promise<void> => {
  if (req.user?.userId === undefined) {
    throw new UnauthorizedError()
  }

  const body = CheckoutIdentifyDtoSchema.parse(req.body)
  const guestToken = getGuestCartTokenFromRequest(req)

  const result = await checkoutService.identify(
    body,
    guestToken,
    getRequestIpAddress(req),
    getRequestUserAgent(req),
    req.user.userId
  )

  respondIdentifyCheckout(res, result)
}

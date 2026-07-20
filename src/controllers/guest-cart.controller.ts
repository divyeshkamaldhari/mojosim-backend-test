import { Request, Response } from 'express'

import { UpsertCartItemDtoSchema } from '../dto/cart.dto'
import { cartService } from '../services/cart.service'
import { generateGuestCartToken } from '../utils/guest-auth.util'
import {
  clearGuestCartCookie,
  setGuestCartCookie,
} from '../utils/guest-cart-cookie.util'
import { getGuestCartTokenFromRequest } from '../middlewares/guest-cart.middleware'

export const createGuestCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = UpsertCartItemDtoSchema.parse(req.body)
  const existingToken = getGuestCartTokenFromRequest(req)
  const guestToken = existingToken ?? generateGuestCartToken()

  const result = await cartService.createOrGetGuestCart(guestToken, body)
  if (result.isNewToken || existingToken === null) {
    setGuestCartCookie(res, result.guestToken)
  }

  res.status(201).json({ success: true, data: result.cart })
}

export const getGuestCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  const guestToken = getGuestCartTokenFromRequest(req)
  if (guestToken === null) {
    const data = await cartService.getGuestCart('')
    res.status(200).json({ success: true, data })
    return
  }

  const data = await cartService.getGuestCart(guestToken)
  res.status(200).json({ success: true, data })
}

export const replaceGuestCartItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = UpsertCartItemDtoSchema.parse(req.body)
  const data = await cartService.replaceGuestCartItem(
    req.guestCartToken ?? '',
    body
  )
  res.status(200).json({ success: true, data })
}

export const deleteGuestCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  const data = await cartService.abandonGuestCart(req.guestCartToken ?? '')
  clearGuestCartCookie(res)
  res.status(200).json({ success: true, data })
}

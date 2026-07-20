import { Request, Response } from 'express'

import { UnauthorizedError } from '../common/errors'
import { UpsertCartItemDtoSchema } from '../dto/cart.dto'
import { cartService } from '../services/cart.service'

const requireUserId = (req: Request): number => {
  const userId = req.user?.userId
  if (userId === undefined) {
    throw new UnauthorizedError()
  }
  return userId
}

export const createCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const body = UpsertCartItemDtoSchema.parse(req.body)
  const data = await cartService.createOrGetActiveCart(userId, body)
  res.status(201).json({ success: true, data })
}

export const getCart = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req)
  const data = await cartService.getActiveCart(userId)
  res.status(200).json({ success: true, data })
}

export const replaceCartItem = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const body = UpsertCartItemDtoSchema.parse(req.body)
  const data = await cartService.replaceCartItem(userId, body)
  res.status(200).json({ success: true, data })
}

export const deleteCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const data = await cartService.abandonActiveCart(userId)
  res.status(200).json({ success: true, data })
}

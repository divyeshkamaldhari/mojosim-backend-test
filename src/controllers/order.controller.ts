import { Request, Response } from 'express'

import { UnauthorizedError } from '../common/errors'
import { CreateOrderDtoSchema, OrderIdParamsSchema } from '../dto/order.dto'
import { orderService } from '../services/order.service'

const requireUserId = (req: Request): number => {
  const userId = req.user?.userId
  if (userId === undefined) {
    throw new UnauthorizedError()
  }
  return userId
}

export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const body = CreateOrderDtoSchema.parse(req.body)
  const data = await orderService.createOrder(userId, body)
  res.status(201).json({ success: true, data })
}

export const getOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { id } = OrderIdParamsSchema.parse(req.params)
  const data = await orderService.getOrderById(userId, id)
  res.status(200).json({ success: true, data })
}

export const getOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { id } = OrderIdParamsSchema.parse(req.params)
  const data = await orderService.getOrderStatus(userId, id)
  res.status(200).json({ success: true, data })
}

export const refreshOrderPaymentIntent = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { id } = OrderIdParamsSchema.parse(req.params)
  const data = await orderService.refreshPaymentIntent(userId, id)
  res.status(200).json({ success: true, data })
}

export const verifyOrderPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { id } = OrderIdParamsSchema.parse(req.params)
  const data = await orderService.verifyPayment(userId, id)
  res.status(200).json({ success: true, data })
}

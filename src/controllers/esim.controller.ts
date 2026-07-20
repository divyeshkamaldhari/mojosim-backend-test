import { Request, Response } from 'express'

import { UnauthorizedError } from '../common/errors'
import { EsimIdParamsSchema } from '../dto/esim.dto'
import { esimService } from '../services/esim.service'

const requireUserId = (req: Request): number => {
  const userId = req.user?.userId
  if (userId === undefined) {
    throw new UnauthorizedError()
  }
  return userId
}

export const getEsimById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { id } = EsimIdParamsSchema.parse(req.params)
  const data = await esimService.getByIdForUser(userId, id)
  res.status(200).json({ success: true, data })
}

export const getEsimQr = async (req: Request, res: Response): Promise<void> => {
  const userId = requireUserId(req)
  const { id } = EsimIdParamsSchema.parse(req.params)
  const data = await esimService.getQrForUser(userId, id)
  res.status(200).json({ success: true, data })
}

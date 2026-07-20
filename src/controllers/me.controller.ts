import { Request, Response } from 'express'

import { UnauthorizedError } from '../common/errors'
import {
  ChangePasswordDtoSchema,
  SessionIdParamsSchema,
  UpdateProfileDtoSchema,
} from '../dto/me.dto'
import { uploadFile } from '../modules/s3'
import { meService } from '../services/me.service'

const requireUser = (req: Request): { userId: number; sessionId: number } => {
  const userId = req.user?.userId
  const sessionId = req.user?.sessionId
  if (userId === undefined || sessionId === undefined) {
    throw new UnauthorizedError()
  }
  return { userId, sessionId }
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  const { userId } = requireUser(req)
  const data = await meService.getProfile(userId)
  res.status(200).json({ success: true, data })
}

export const updateMe = async (req: Request, res: Response): Promise<void> => {
  const { userId } = requireUser(req)
  const body = UpdateProfileDtoSchema.parse(req.body)
  const file = req.file
  const avatarUrl = file ? await uploadFile(file, 'avatars') : undefined
  await meService.updateProfile(userId, {
    firstName: body.first_name,
    lastName: body.last_name,
    phone: body.phone,
    locale: body.locale,
    avatarUrl,
  })
  const data = await meService.getProfile(userId)
  res.status(200).json({ success: true, data })
}

export const changePassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, sessionId } = requireUser(req)
  const body = ChangePasswordDtoSchema.parse(req.body)
  const result = await meService.changePassword(userId, sessionId, body)
  res.status(200).json({ success: true, data: result })
}

export const listSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = requireUser(req)
  const data = await meService.listSessions(userId)
  res.status(200).json({ success: true, data })
}

export const deleteSessionById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = requireUser(req)
  const { id } = SessionIdParamsSchema.parse(req.params)
  const result = await meService.revokeSession(userId, id)
  res.status(200).json({ success: true, data: result })
}

export const revokeOtherSessions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId, sessionId } = requireUser(req)
  const result = await meService.revokeAllOtherSessions(userId, sessionId)
  res.status(200).json({ success: true, data: result })
}

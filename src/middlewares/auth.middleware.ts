import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

import { env } from '../config/env'
import { ForbiddenError, UnauthorizedError } from '../common/errors'
import { UserRepository } from '../repositories/user.repository'
import { UserSessionRepository } from '../repositories/user-session.repository'

export type UserRole = 'customer' | 'manager' | 'admin'

export type AuthenticatedUser = {
  userId: number
  role: UserRole
  sessionId: number
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser
  }
}

const userRepository = new UserRepository()
const userSessionRepository = new UserSessionRepository()

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    throw new UnauthorizedError()
  }

  const token = authHeader.slice('Bearer '.length)
  try {
    const result = jwt.verify(token, env.JWT_SECRET)
    if (typeof result === 'string') throw new UnauthorizedError()

    const userIdValue: unknown = result.userId
    const sessionIdValue: unknown = result.sessionId

    if (typeof userIdValue !== 'number') throw new UnauthorizedError()
    if (typeof sessionIdValue !== 'number') throw new UnauthorizedError()

    const activeSession =
      await userSessionRepository.findActiveByUserIdAndSessionId(
        userIdValue,
        sessionIdValue
      )
    if (!activeSession) {
      throw new UnauthorizedError()
    }

    const user = await userRepository.findByIdExcludingPasswordHash(userIdValue)
    if (!user?.isActive) {
      throw new UnauthorizedError()
    }

    req.user = {
      userId: user.id,
      role: user.role,
      sessionId: activeSession.id,
    }

    next()
  } catch {
    throw new UnauthorizedError()
  }
}

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user
    if (!user) {
      throw new UnauthorizedError()
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenError()
    }

    next()
  }

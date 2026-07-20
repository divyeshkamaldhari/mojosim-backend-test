import { Op } from 'sequelize'
import { UserSession } from '../models/user-session'

export type CreateUserSessionData = {
  userId: number
  tokenHash: string
  ipAddress: string
  userAgent: string
  expiresAt: Date
}

export class UserSessionRepository {
  create = async (data: CreateUserSessionData): Promise<UserSession> => {
    return UserSession.create({
      userId: data.userId,
      tokenHash: data.tokenHash,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt: data.expiresAt,
    })
  }

  findActiveByUserIdAndSessionId = async (
    userId: number,
    sessionId: number
  ): Promise<UserSession | null> => {
    const now = new Date()
    return UserSession.findOne({
      where: {
        userId,
        id: sessionId,
        expiresAt: { [Op.gt]: now },
      },
      attributes: { exclude: ['tokenHash'] },
    })
  }

  findByTokenHash = async (tokenHash: string): Promise<UserSession | null> => {
    const now = new Date()
    return UserSession.findOne({
      where: {
        tokenHash,
        expiresAt: { [Op.gt]: now },
      },
    })
  }

  deleteById = async (id: number): Promise<void> => {
    await UserSession.destroy({ where: { id } })
  }

  deleteByUserId = async (userId: number): Promise<void> => {
    await UserSession.destroy({ where: { userId } })
  }

  deleteExpired = async (): Promise<number> => {
    const now = new Date()
    const deletedCount = await UserSession.destroy({
      where: {
        expiresAt: { [Op.lt]: now },
      },
    })
    return deletedCount
  }

  findActiveByUserIdExcludingTokenHash = async (
    userId: number
  ): Promise<UserSession[]> => {
    const now = new Date()
    return UserSession.findAll({
      where: {
        userId,
        expiresAt: { [Op.gt]: now },
      },
      attributes: { exclude: ['tokenHash'] },
      order: [['createdAt', 'DESC']],
    })
  }

  deleteByUserIdExceptSessionId = async (
    userId: number,
    exceptSessionId: number
  ): Promise<number> => {
    return UserSession.destroy({
      where: {
        userId,
        id: { [Op.ne]: exceptSessionId },
      },
    })
  }

  deleteByUserIdAndSessionId = async (
    userId: number,
    sessionId: number
  ): Promise<number> => {
    return UserSession.destroy({
      where: { userId, id: sessionId },
    })
  }
}

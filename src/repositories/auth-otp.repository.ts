import { Op, type Transaction } from 'sequelize'

import { AuthOtp } from '../models/auth-otp'

export type CreateAuthOtpData = {
  email: string
  codeHash: string
  purpose: string
  expiresAt: Date
}

export class AuthOtpRepository {
  create = async (data: CreateAuthOtpData): Promise<AuthOtp> => {
    return AuthOtp.create({
      email: data.email.toLowerCase(),
      codeHash: data.codeHash,
      purpose: data.purpose,
      expiresAt: data.expiresAt,
      attemptCount: 0,
      consumedAt: null,
    })
  }

  findLatestActive = async (
    email: string,
    purpose: string
  ): Promise<AuthOtp | null> => {
    const now = new Date()
    return AuthOtp.findOne({
      where: {
        email: email.toLowerCase(),
        purpose,
        consumedAt: null,
        expiresAt: { [Op.gt]: now },
      },
      order: [['id', 'DESC']],
    })
  }

  incrementAttemptCount = async (id: number): Promise<void> => {
    await AuthOtp.increment('attemptCount', { where: { id } })
  }

  markConsumed = async (id: number): Promise<void> => {
    await AuthOtp.update({ consumedAt: new Date() }, { where: { id } })
  }

  invalidateActiveForEmail = async (
    email: string,
    purpose: string,
    transaction?: Transaction
  ): Promise<void> => {
    await AuthOtp.update(
      { consumedAt: new Date() },
      {
        where: {
          email: email.toLowerCase(),
          purpose,
          consumedAt: null,
        },
        transaction,
      }
    )
  }
}

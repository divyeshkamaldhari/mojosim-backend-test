import bcrypt from 'bcrypt'

import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../common/errors'
import { UserRepository } from '../repositories/user.repository'
import type { UpdateProfileData } from '../repositories/user.repository'
import { UserSessionRepository } from '../repositories/user-session.repository'

import type { ChangePasswordDto } from '../dto/me.dto'
import { auditService } from './audit.service'

export type UpdateProfileServiceInput = {
  firstName?: string
  lastName?: string
  phone?: string | null
  locale?: string
  avatarUrl?: string | null
}

export type PublicProfile = {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar_url: string | null
  phone: string | null
  locale: string
  currency: string
  role: 'customer' | 'manager' | 'admin'
  is_active: boolean
  email_verified: boolean
  created_at: Date
  updated_at: Date
}

export type SessionListItem = {
  id: number
  ip_address: string
  user_agent: string
  expires_at: Date
  created_at: Date
}

const BCRYPT_SALT_ROUNDS = 12

const mapProfile = (user: {
  id: number
  email: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  phone: string | null
  locale: string
  currency: string
  role: 'customer' | 'manager' | 'admin'
  isActive: boolean
  emailVerified: boolean
  createdAt: Date
  updatedAt: Date
}): PublicProfile => ({
  id: user.id,
  email: user.email,
  first_name: user.firstName,
  last_name: user.lastName,
  avatar_url: user.avatarUrl,
  phone: user.phone,
  locale: user.locale,
  currency: user.currency,
  role: user.role,
  is_active: user.isActive,
  email_verified: user.emailVerified,
  created_at: user.createdAt,
  updated_at: user.updatedAt,
})

type ProfileSnapshot = {
  firstName: string
  lastName: string
  locale: string
  phone: string | null
  avatarUrl: string | null
}

const PROFILE_AUDIT_FIELDS: Array<{
  updateKey: keyof UpdateProfileData
  auditKey: string
  getCurrent: (u: ProfileSnapshot) => string | null
}> = [
  {
    updateKey: 'firstName',
    auditKey: 'first_name',
    getCurrent: (u) => u.firstName,
  },
  {
    updateKey: 'lastName',
    auditKey: 'last_name',
    getCurrent: (u) => u.lastName,
  },
  { updateKey: 'locale', auditKey: 'locale', getCurrent: (u) => u.locale },
  { updateKey: 'phone', auditKey: 'phone', getCurrent: (u) => u.phone },
  {
    updateKey: 'avatarUrl',
    auditKey: 'avatar_url',
    getCurrent: (u) => u.avatarUrl,
  },
]

const buildProfileAuditStates = (
  user: ProfileSnapshot,
  updates: UpdateProfileData
): {
  beforeState: Record<string, unknown>
  afterState: Record<string, unknown>
} => {
  const beforeState: Record<string, unknown> = {}
  const afterState: Record<string, unknown> = {}

  for (const { updateKey, auditKey, getCurrent } of PROFILE_AUDIT_FIELDS) {
    if (!(updateKey in updates)) {
      continue
    }
    const newVal = updates[updateKey]
    if (newVal === undefined) {
      continue
    }
    const oldVal = getCurrent(user)
    if (newVal === oldVal) {
      continue
    }
    beforeState[auditKey] = oldVal
    afterState[auditKey] = newVal
  }

  return { beforeState, afterState }
}

export class MeService {
  private readonly userRepository: UserRepository

  private readonly userSessionRepository: UserSessionRepository

  constructor(
    userRepository: UserRepository = new UserRepository(),
    userSessionRepository: UserSessionRepository = new UserSessionRepository()
  ) {
    this.userRepository = userRepository
    this.userSessionRepository = userSessionRepository
  }

  getProfile = async (userId: number): Promise<PublicProfile> => {
    const user = await this.userRepository.findByIdExcludingPasswordHash(userId)
    if (!user) {
      throw new NotFoundError('User')
    }
    return mapProfile(user)
  }

  updateProfile = async (
    userId: number,
    dto: UpdateProfileServiceInput
  ): Promise<{ message: string }> => {
    const user = await this.userRepository.findByIdExcludingPasswordHash(userId)
    if (!user) {
      throw new NotFoundError('User')
    }

    const updates: UpdateProfileData = {}

    if (dto.firstName !== undefined) updates.firstName = dto.firstName
    if (dto.lastName !== undefined) updates.lastName = dto.lastName
    if (dto.locale !== undefined) updates.locale = dto.locale
    if (dto.phone !== undefined) updates.phone = dto.phone
    if (dto.avatarUrl !== undefined) updates.avatarUrl = dto.avatarUrl

    if (Object.keys(updates).length === 0) {
      return { message: 'No profile changes' }
    }

    const { beforeState, afterState } = buildProfileAuditStates(user, updates)

    await this.userRepository.updateProfileById(userId, updates)

    if (Object.keys(beforeState).length > 0) {
      void auditService.createLog({
        action: 'user.profile_updated',
        entityType: 'users',
        entityId: userId,
        actorId: userId,
        beforeState,
        afterState,
        ipAddress: null,
      })
    }

    return { message: 'Profile updated' }
  }

  changePassword = async (
    userId: number,
    currentSessionId: number,
    dto: ChangePasswordDto
  ): Promise<{ message: string }> => {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new NotFoundError('User')
    }

    if (user.passwordHash === null) {
      throw new ConflictError(
        'Password change is not available for OTP-only accounts.'
      )
    }

    const passwordOk = await bcrypt.compare(
      dto.current_password,
      user.passwordHash
    )
    if (!passwordOk) {
      throw new UnauthorizedError()
    }

    const newHash = await bcrypt.hash(dto.new_password, BCRYPT_SALT_ROUNDS)
    await this.userRepository.updateById(userId, { passwordHash: newHash })

    await this.userSessionRepository.deleteByUserIdExceptSessionId(
      userId,
      currentSessionId
    )

    const updatedUser = await this.userRepository.findById(userId)
    const updatedAt =
      updatedUser?.updatedAt.toISOString() ?? new Date().toISOString()

    void auditService.createLog({
      action: 'user.password_changed',
      entityType: 'users',
      entityId: userId,
      actorId: userId,
      beforeState: null,
      afterState: { updated_at: updatedAt },
      ipAddress: null,
    })

    return { message: 'Password updated' }
  }

  listSessions = async (userId: number): Promise<SessionListItem[]> => {
    const rows =
      await this.userSessionRepository.findActiveByUserIdExcludingTokenHash(
        userId
      )
    return rows.map((s) => ({
      id: s.id,
      ip_address: s.ipAddress,
      user_agent: s.userAgent,
      expires_at: s.expiresAt,
      created_at: s.createdAt,
    }))
  }

  revokeSession = async (
    userId: number,
    sessionId: number
  ): Promise<{ message: string }> => {
    const deleted = await this.userSessionRepository.deleteByUserIdAndSessionId(
      userId,
      sessionId
    )
    if (deleted === 0) {
      throw new NotFoundError('Session')
    }
    return { message: 'Session revoked' }
  }

  revokeAllOtherSessions = async (
    userId: number,
    currentSessionId: number
  ): Promise<{ message: string }> => {
    await this.userSessionRepository.deleteByUserIdExceptSessionId(
      userId,
      currentSessionId
    )
    return { message: 'Other sessions revoked' }
  }
}

export const meService = new MeService()

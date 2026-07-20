import bcrypt from 'bcrypt'
import jwt, { type JwtPayload } from 'jsonwebtoken'
import crypto from 'node:crypto'

import { env } from '../config/env'
import { logger } from '../common/logger'
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../common/errors'
import { sendEmail, TemplateType } from '../modules/email'
import type { User } from '../models/user'
import { UserRepository } from '../repositories/user.repository'
import { UserSessionRepository } from '../repositories/user-session.repository'
import { AuthOtpRepository } from '../repositories/auth-otp.repository'
import { auditService } from './audit.service'
import { generateOtpCode, hashOtpCode } from '../utils/guest-auth.util'

import type {
  ForgotPasswordDto,
  LoginDto,
  OtpRequestDto,
  OtpVerifyDto,
  RegisterDto,
  ResetPasswordDto,
  ResendVerificationDto,
  VerifyEmailDto,
} from '../dto/auth.dto'

export type AccessTokenResponse = {
  accessToken: string
  accessExpiresInSeconds: number
}

export type LoginUserResponse = {
  id: number
  email: string
  first_name: string
  last_name: string
  avatar_url: string | null
  role: 'customer' | 'manager' | 'admin'
  locale: string
  currency: string
}

type AccessTokenPayload = {
  userId: number
  role: 'customer' | 'manager' | 'admin'
  sessionId: number
}

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
const REFRESH_TOKEN_TTL_DAYS = 7
const BCRYPT_SALT_ROUNDS = 12
const RESET_NONCE_BYTES = 32
const OTP_TTL_MINUTES = 10
const OTP_MAX_ATTEMPTS = 5
const OTP_PURPOSE = 'login'

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex')
}

const generateToken = (payload: object, expiresInSeconds: number): string => {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: expiresInSeconds })
}

const generateRefreshToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export class AuthService {
  private readonly userRepository: UserRepository
  private readonly userSessionRepository: UserSessionRepository
  private readonly authOtpRepository: AuthOtpRepository

  constructor() {
    this.userRepository = new UserRepository()
    this.userSessionRepository = new UserSessionRepository()
    this.authOtpRepository = new AuthOtpRepository()
  }

  createCustomerSession = async (
    user: User,
    ipAddress: string,
    userAgent: string
  ): Promise<
    AccessTokenResponse & { refreshToken: string; user: LoginUserResponse }
  > => {
    if (user.role !== 'customer' || !user.isActive) {
      throw new UnauthorizedError()
    }

    await this.userSessionRepository.deleteExpired()

    const refreshToken = generateRefreshToken()
    const tokenHash = hashToken(refreshToken)
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
    )

    const session = await this.userSessionRepository.create({
      userId: user.id,
      tokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    })

    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        sessionId: session.id,
      } satisfies AccessTokenPayload,
      env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
    )

    return {
      accessToken,
      accessExpiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        avatar_url: user.avatarUrl,
        role: user.role,
        locale: user.locale,
        currency: user.currency,
      },
    }
  }

  register = (_dto: RegisterDto): Promise<{ message: string }> => {
    throw new ConflictError(
      'Registration is no longer available. Purchase an eSIM to create your account.'
    )
  }

  verifyEmail = (_dto: VerifyEmailDto): Promise<{ message: string }> => {
    throw new ConflictError(
      'Email verification is no longer required. Sign in with a one-time code instead.'
    )
  }

  resendVerification = (
    _dto: ResendVerificationDto
  ): Promise<{ message: string }> => {
    throw new ConflictError(
      'Email verification is no longer required. Sign in with a one-time code instead.'
    )
  }

  requestOtp = async (dto: OtpRequestDto): Promise<{ message: string }> => {
    const user = await this.userRepository.findByEmail(dto.email)
    if (!user) {
      throw new NotFoundError('Account')
    }

    if (user.role !== 'customer' || !user.isActive) {
      return { message: 'If an account exists, a login code has been sent.' }
    }

    const code = generateOtpCode()
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)

    await this.authOtpRepository.invalidateActiveForEmail(
      user.email,
      OTP_PURPOSE
    )
    await this.authOtpRepository.create({
      email: user.email,
      codeHash: hashOtpCode(code),
      purpose: OTP_PURPOSE,
      expiresAt,
    })

    await sendEmail({
      to: user.email,
      templateType: TemplateType.otp_login,
      data: {
        firstName: user.firstName,
        code,
        expiresMinutes: String(OTP_TTL_MINUTES),
      },
    })

    logger.info('OTP login email sent', { userId: user.id })
    return { message: 'If an account exists, a login code has been sent.' }
  }

  requestVerificationOtp = async (
    dto: OtpRequestDto
  ): Promise<{ message: string }> => {
    const user = await this.userRepository.findByEmail(dto.email)
    if (!user) {
      throw new NotFoundError('Account')
    }

    if (user.role !== 'customer' || !user.isActive) {
      return {
        message: 'If an account exists, a verification code has been sent.',
      }
    }

    const code = generateOtpCode()
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
    const purpose = 'verification'

    await this.authOtpRepository.invalidateActiveForEmail(user.email, purpose)
    await this.authOtpRepository.create({
      email: user.email,
      codeHash: hashOtpCode(code),
      purpose,
      expiresAt,
    })

    await sendEmail({
      to: user.email,
      templateType: TemplateType.verification_otp,
      data: {
        firstName: user.firstName,
        code,
        expiresMinutes: String(OTP_TTL_MINUTES),
      },
    })

    logger.info('OTP verification email sent', { userId: user.id })
    return {
      message: 'If an account exists, a verification code has been sent.',
    }
  }
  verifyOtp = async (
    dto: OtpVerifyDto,
    ipAddress: string,
    userAgent: string,
    purpose: string = OTP_PURPOSE
  ): Promise<
    AccessTokenResponse & { refreshToken: string; user: LoginUserResponse }
  > => {
    const user = await this.userRepository.findByEmail(dto.email)
    if (!user || user.role !== 'customer' || !user.isActive) {
      throw new UnauthorizedError()
    }

    const otp = await this.authOtpRepository.findLatestActive(
      user.email,
      purpose
    )
    if (!otp) {
      throw new UnauthorizedError()
    }

    if (otp.attemptCount >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedError()
    }

    if (hashOtpCode(dto.code) !== otp.codeHash) {
      await this.authOtpRepository.incrementAttemptCount(otp.id)
      throw new UnauthorizedError()
    }

    await this.authOtpRepository.markConsumed(otp.id)
    if (!user.emailVerified) {
      await this.userRepository.updateById(user.id, { emailVerified: true })
    }

    void auditService.createLog({
      action: 'user.login',
      entityType: 'users',
      entityId: user.id,
      actorId: user.id,
      beforeState: null,
      afterState: { method: 'otp', ip_address: ipAddress },
      ipAddress,
    })

    return this.createCustomerSession(user, ipAddress, userAgent)
  }

  impersonate = async (
    targetUserId: number,
    adminId: number,
    ipAddress: string,
    userAgent: string
  ): Promise<
    AccessTokenResponse & { refreshToken: string; user: LoginUserResponse }
  > => {
    const user = await this.userRepository.findById(targetUserId)
    if (!user || user.role !== 'customer' || !user.isActive) {
      throw new NotFoundError('Customer')
    }

    void auditService.createLog({
      action: 'admin.impersonate',
      entityType: 'users',
      entityId: user.id,
      actorId: adminId,
      beforeState: null,
      afterState: { ip_address: ipAddress, user_agent: userAgent },
      ipAddress,
    })

    logger.info('Admin impersonating user', { adminId, targetUserId })

    return this.createCustomerSession(user, ipAddress, userAgent)
  }

  login = async (
    dto: LoginDto,
    ipAddress: string,
    userAgent: string
  ): Promise<
    AccessTokenResponse & { refreshToken: string; user: LoginUserResponse }
  > => {
    const user = await this.userRepository.findByEmail(dto.email)
    if (!user || user.role === 'customer') {
      throw new UnauthorizedError()
    }

    if (user.passwordHash === null) {
      throw new UnauthorizedError()
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash)
    if (!passwordOk) {
      throw new UnauthorizedError()
    }

    if (!user.emailVerified) {
      throw new ConflictError('Email not verified')
    }

    await this.userSessionRepository.deleteExpired()

    const refreshToken = generateRefreshToken()
    const tokenHash = hashToken(refreshToken)
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
    )

    const session = await this.userSessionRepository.create({
      userId: user.id,
      tokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    })

    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        sessionId: session.id,
      } satisfies AccessTokenPayload,
      env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
    )

    void auditService.createLog({
      action: 'user.login',
      entityType: 'users',
      entityId: user.id,
      actorId: user.id,
      beforeState: null,
      afterState: { ip_address: ipAddress, user_agent: userAgent },
      ipAddress,
    })

    return {
      accessToken,
      accessExpiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        avatar_url: user.avatarUrl,
        role: user.role,
        locale: user.locale,
        currency: user.currency,
      },
    }
  }

  logout = async (refreshToken: string): Promise<{ message: string }> => {
    const tokenHash = hashToken(refreshToken)
    const session = await this.userSessionRepository.findByTokenHash(tokenHash)
    if (!session) {
      return { message: 'Logged out' }
    }

    await this.userSessionRepository.deleteById(session.id)
    logger.info('Session deleted', {
      userId: session.userId,
      sessionId: session.id,
    })
    return { message: 'Logged out' }
  }

  refresh = async (
    refreshToken: string,
    lane: 'customer' | 'staff'
  ): Promise<AccessTokenResponse> => {
    const tokenHash = hashToken(refreshToken)
    await this.userSessionRepository.deleteExpired()

    const session = await this.userSessionRepository.findByTokenHash(tokenHash)
    if (!session) {
      throw new UnauthorizedError()
    }

    const user = await this.userRepository.findById(session.userId)
    if (!user) {
      throw new UnauthorizedError()
    }

    const isStaff = user.role === 'manager' || user.role === 'admin'
    if (lane === 'customer' && isStaff) {
      throw new UnauthorizedError()
    }
    if (lane === 'staff' && !isStaff) {
      throw new UnauthorizedError()
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        sessionId: session.id,
      } satisfies AccessTokenPayload,
      env.JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
    )

    return { accessToken, accessExpiresInSeconds: ACCESS_TOKEN_TTL_SECONDS }
  }

  forgotPassword = async (
    dto: ForgotPasswordDto
  ): Promise<{ message: string }> => {
    const user = await this.userRepository.findByEmail(dto.email)
    if (!user || user.role === 'customer') {
      throw new NotFoundError('Account')
    }

    const resetNonce = crypto.randomBytes(RESET_NONCE_BYTES).toString('hex')
    const resetTokenTtlSeconds = 15 * 60
    const resetTokenHash = hashToken(resetNonce)
    const resetTokenExpiresAt = new Date(
      Date.now() + resetTokenTtlSeconds * 1000
    )
    await this.userRepository.updateById(user.id, {
      inviteTokenHash: resetTokenHash,
      inviteTokenExpiresAt: resetTokenExpiresAt,
    })
    const resetToken = generateToken(
      { userId: user.id, purpose: 'reset_password', resetNonce },
      resetTokenTtlSeconds
    )

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(resetToken)}`

    await sendEmail({
      to: user.email,
      templateType: TemplateType.password_reset,
      data: {
        firstName: user.firstName,
        resetUrl,
      },
    })

    logger.info('Password reset email sent', { userId: user.id })
    return { message: 'Password reset email sent' }
  }

  resetPassword = async (
    dto: ResetPasswordDto
  ): Promise<{ message: string }> => {
    const { user, tokenNonce } = await this.verifyResetTokenOrThrow(dto.token)

    if (user.role === 'customer') {
      throw new UnauthorizedError()
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS)
    await this.userRepository.updateById(user.id, {
      passwordHash,
      ...(tokenNonce === undefined
        ? {}
        : { inviteTokenHash: null, inviteTokenExpiresAt: null }),
    })
    if (
      (user.role === 'manager' || user.role === 'admin') &&
      (!user.isActive || !user.emailVerified)
    ) {
      await this.userRepository.updateById(user.id, {
        isActive: true,
        emailVerified: true,
      })
    }

    logger.info('Password updated', { userId: user.id })
    return { message: 'Password updated' }
  }

  verifyResetToken = async (token: string): Promise<boolean> => {
    try {
      await this.verifyResetTokenOrThrow(token)
      return true
    } catch {
      return false
    }
  }

  private verifyResetTokenOrThrow = async (
    token: string
  ): Promise<{ user: User; tokenNonce: string | undefined }> => {
    let result: string | JwtPayload
    try {
      result = jwt.verify(token, env.JWT_SECRET)
    } catch {
      throw new UnauthorizedError()
    }

    if (typeof result === 'string') {
      throw new UnauthorizedError()
    }

    const userIdValue: unknown = result.userId
    const purposeValue: unknown = result.purpose
    const inviteNonceValue: unknown = result.inviteNonce
    const resetNonceValue: unknown = result.resetNonce

    if (typeof userIdValue !== 'number' || purposeValue !== 'reset_password') {
      throw new UnauthorizedError()
    }

    const user = await this.userRepository.findById(userIdValue)
    if (!user) {
      throw new NotFoundError('User')
    }

    const tokenNonceValue: unknown = inviteNonceValue ?? resetNonceValue
    if (tokenNonceValue === undefined) {
      return { user, tokenNonce: undefined }
    }

    if (typeof tokenNonceValue !== 'string') {
      throw new UnauthorizedError()
    }

    if (
      user.inviteTokenHash === null ||
      user.inviteTokenExpiresAt === null ||
      user.inviteTokenExpiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedError()
    }

    if (hashToken(tokenNonceValue) !== user.inviteTokenHash) {
      throw new UnauthorizedError()
    }

    return { user, tokenNonce: tokenNonceValue }
  }
}

export const authService = new AuthService()

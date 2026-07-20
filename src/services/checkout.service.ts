import { NotFoundError } from '../common/errors'
import { UserRepository } from '../repositories/user.repository'
import { cartService, type CartResponse } from './cart.service'
import { authService, type LoginUserResponse } from './auth.service'

import type { CheckoutIdentifyDto } from '../dto/checkout.dto'

export type CheckoutIdentifyResponse = {
  cart: CartResponse
  access_token: string
  expires_in: number
  user: LoginUserResponse
}

export class CheckoutService {
  private readonly userRepository: UserRepository

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository
  }

  identify = async (
    dto: CheckoutIdentifyDto,
    guestToken: string | null,
    ipAddress: string,
    userAgent: string,
    existingUserId?: number
  ): Promise<CheckoutIdentifyResponse & { refreshToken: string }> => {
    const normalizedEmail = dto.email.toLowerCase()
    let user = await this.userRepository.findByEmail(normalizedEmail)

    if (user && user.role !== 'customer') {
      throw new NotFoundError('User')
    }

    if (!user) {
      user = await this.userRepository.createOtpCustomer({
        email: normalizedEmail,
        firstName: dto.first_name,
        lastName: dto.last_name,
        phone: dto.phone ?? null,
        locale: dto.locale,
        currency: dto.currency,
      })
    } else {
      await this.userRepository.updateCustomerProfile(user.id, {
        firstName: dto.first_name,
        lastName: dto.last_name,
        phone: dto.phone ?? null,
      })
      user = await this.userRepository.findById(user.id)
      if (!user) {
        throw new NotFoundError('User')
      }
    }

    if (existingUserId !== undefined && existingUserId !== user.id) {
      throw new NotFoundError('User')
    }

    let cart: CartResponse = await cartService.getActiveCart(user.id)
    if (guestToken !== null) {
      cart = await cartService.mergeGuestCartToUser(guestToken, user.id)
    }

    const session = await authService.createCustomerSession(
      user,
      ipAddress,
      userAgent
    )

    return {
      cart,
      access_token: session.accessToken,
      expires_in: session.accessExpiresInSeconds,
      refreshToken: session.refreshToken,
      user: session.user,
    }
  }
}

export const checkoutService = new CheckoutService()

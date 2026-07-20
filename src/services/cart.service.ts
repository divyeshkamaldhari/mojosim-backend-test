import { sequelize } from '../config/db'
import { NotFoundError } from '../common/errors'
import { CartRepository } from '../repositories/cart.repository'
import { generateGuestCartToken } from '../utils/guest-auth.util'

import type { UpsertCartItemDto } from '../dto/cart.dto'
import type { Cart } from '../models/cart'
import type { CartItem } from '../models/cart-item'
import type { Plan } from '../models/plan'

type PlanDestinationSummary = {
  countryCode: string
  countryName: string
  countryFlagUrl: string | null
}

type PlanSummary = Plan & {
  destinations?: PlanDestinationSummary[]
}

type CartItemWithPlan = CartItem & { plan?: PlanSummary }
type CartWithItems = Cart & { items?: CartItemWithPlan[] }

export type CartDestinationResponse = {
  country_code: string
  country_name: string
  flag_url: string | null
}

export type CartItemResponse = {
  id: number
  plan_id: number
  plan_name: string
  plan_type: string
  region_name: string | null
  flag_url: string | null
  data_mb: number
  data_label: string | null
  validity_days: number
  quantity: number
  unit_price: string
  currency: string
  destinations: CartDestinationResponse[]
}

export type CartSummaryResponse = {
  subtotal: string
  tax: string
  total: string
  currency: string
}

export type CartResponse = {
  id: number | null
  status: 'active' | 'converted' | 'abandoned' | 'empty'
  expires_at: Date | null
  items: CartItemResponse[]
  summary: CartSummaryResponse
}

const CART_TTL_HOURS = 0.5

const DEFAULT_CART_CURRENCY = 'USD'

const formatMoney = (amount: number): string => amount.toFixed(2)

const resolveCartItemQuantity = (dto: UpsertCartItemDto): number =>
  dto.quantity ?? 1

const getCartSummary = (cart: CartWithItems): CartSummaryResponse => {
  const items = cart.items ?? []
  const subtotalValue = items.reduce((sum, item) => {
    return sum + Number.parseFloat(item.unitPrice) * item.quantity
  }, 0)
  const currency = items[0]?.currency ?? DEFAULT_CART_CURRENCY

  return {
    subtotal: formatMoney(subtotalValue),
    tax: '0.00',
    total: formatMoney(subtotalValue),
    currency,
  }
}

const getEmptyCart = (): CartResponse => ({
  id: null,
  status: 'empty',
  expires_at: null,
  items: [],
  summary: {
    subtotal: '0.00',
    tax: '0.00',
    total: '0.00',
    currency: DEFAULT_CART_CURRENCY,
  },
})

const mapCart = (cart: CartWithItems): CartResponse => ({
  id: cart.id,
  status: cart.status,
  expires_at: cart.expiresAt,
  items: (cart.items ?? []).map((item) => ({
    id: item.id,
    plan_id: item.planId,
    plan_name: item.plan?.name ?? '',
    plan_type: item.plan?.planType ?? 'local',
    region_name: item.plan?.regionName ?? null,
    flag_url: item.plan?.flagUrl ?? null,
    data_mb: item.plan?.dataMb ?? 0,
    data_label: item.plan?.dataLabel ?? null,
    validity_days: item.plan?.validityDays ?? 0,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    currency: item.currency,
    destinations: (item.plan?.destinations ?? []).map((destination) => ({
      country_code: destination.countryCode,
      country_name: destination.countryName,
      flag_url: destination.countryFlagUrl,
    })),
  })),
  summary: getCartSummary(cart),
})

export class CartService {
  private readonly cartRepository: CartRepository

  constructor(cartRepository: CartRepository = new CartRepository()) {
    this.cartRepository = cartRepository
  }

  createOrGetActiveCart = async (
    userId: number,
    dto: UpsertCartItemDto
  ): Promise<CartResponse> => {
    const existing = await this.cartRepository.findActiveCartByUserId(userId)
    if (existing) {
      return mapCart(existing)
    }

    const plan = await this.cartRepository.findActivePlanById(dto.plan_id)
    if (!plan) {
      throw new NotFoundError('Plan')
    }

    const expiresAt = new Date(Date.now() + CART_TTL_HOURS * 60 * 60 * 1000)

    await sequelize.transaction(async (transaction) => {
      const cart = await this.cartRepository.createCart(
        userId,
        expiresAt,
        transaction
      )
      await this.cartRepository.createCartItem(
        cart.id,
        plan,
        resolveCartItemQuantity(dto),
        transaction
      )
    })

    const cart = await this.cartRepository.findActiveCartByUserId(userId)
    if (!cart) {
      throw new NotFoundError('Cart')
    }
    return mapCart(cart)
  }

  getActiveCart = async (userId: number): Promise<CartResponse> => {
    const cart = await this.cartRepository.findActiveCartByUserId(userId)
    if (!cart) {
      return getEmptyCart()
    }
    return mapCart(cart)
  }

  replaceCartItem = async (
    userId: number,
    dto: UpsertCartItemDto
  ): Promise<CartResponse> => {
    const cart = await this.cartRepository.findActiveCartByUserId(userId)
    if (!cart) {
      throw new NotFoundError('Cart')
    }

    const plan = await this.cartRepository.findActivePlanById(dto.plan_id)
    if (!plan) {
      throw new NotFoundError('Plan')
    }

    await sequelize.transaction(async (transaction) => {
      await this.cartRepository.deleteItemsByCartId(cart.id, transaction)
      await this.cartRepository.createCartItem(
        cart.id,
        plan,
        resolveCartItemQuantity(dto),
        transaction
      )
    })

    const updated = await this.cartRepository.findActiveCartByUserId(userId)
    if (!updated) {
      throw new NotFoundError('Cart')
    }
    return mapCart(updated)
  }

  abandonActiveCart = async (userId: number): Promise<{ message: string }> => {
    const cart = await this.cartRepository.findActiveCartByUserId(userId)
    if (!cart) {
      throw new NotFoundError('Cart')
    }

    await this.cartRepository.updateCartStatus(cart.id, 'abandoned')
    return { message: 'Cart abandoned' }
  }

  createOrGetGuestCart = async (
    guestToken: string,
    dto: UpsertCartItemDto
  ): Promise<{
    cart: CartResponse
    guestToken: string
    isNewToken: boolean
  }> => {
    let token = guestToken
    let isNewToken = false

    const active = await this.cartRepository.findActiveCartByGuestToken(token)
    if (active) {
      return {
        cart: mapCart(active),
        guestToken: token,
        isNewToken: false,
      }
    }

    const plan = await this.cartRepository.findActivePlanById(dto.plan_id)
    if (!plan) {
      throw new NotFoundError('Plan')
    }

    const expiresAt = new Date(Date.now() + CART_TTL_HOURS * 60 * 60 * 1000)
    const existing = await this.cartRepository.findCartByGuestToken(token)

    if (existing?.status === 'converted') {
      token = generateGuestCartToken()
      isNewToken = true
    } else if (existing) {
      await sequelize.transaction(async (transaction) => {
        await this.cartRepository.reactivateGuestCart(
          existing.id,
          expiresAt,
          transaction
        )
        await this.cartRepository.deleteItemsByCartId(existing.id, transaction)
        await this.cartRepository.createCartItem(
          existing.id,
          plan,
          resolveCartItemQuantity(dto),
          transaction
        )
      })

      const cart = await this.cartRepository.findActiveCartByGuestToken(token)
      if (!cart) {
        throw new NotFoundError('Cart')
      }

      return {
        cart: mapCart(cart),
        guestToken: token,
        isNewToken: false,
      }
    }

    await sequelize.transaction(async (transaction) => {
      const cart = await this.cartRepository.createGuestCart(
        token,
        expiresAt,
        transaction
      )
      await this.cartRepository.createCartItem(
        cart.id,
        plan,
        resolveCartItemQuantity(dto),
        transaction
      )
    })

    const cart = await this.cartRepository.findActiveCartByGuestToken(token)
    if (!cart) {
      throw new NotFoundError('Cart')
    }

    return {
      cart: mapCart(cart),
      guestToken: token,
      isNewToken,
    }
  }

  getGuestCart = async (guestToken: string): Promise<CartResponse> => {
    const cart =
      await this.cartRepository.findActiveCartByGuestToken(guestToken)
    if (!cart) {
      return getEmptyCart()
    }
    return mapCart(cart)
  }

  replaceGuestCartItem = async (
    guestToken: string,
    dto: UpsertCartItemDto
  ): Promise<CartResponse> => {
    const cart =
      await this.cartRepository.findActiveCartByGuestToken(guestToken)
    if (!cart) {
      throw new NotFoundError('Cart')
    }

    const plan = await this.cartRepository.findActivePlanById(dto.plan_id)
    if (!plan) {
      throw new NotFoundError('Plan')
    }

    await sequelize.transaction(async (transaction) => {
      await this.cartRepository.deleteItemsByCartId(cart.id, transaction)
      await this.cartRepository.createCartItem(
        cart.id,
        plan,
        resolveCartItemQuantity(dto),
        transaction
      )
    })

    const updated =
      await this.cartRepository.findActiveCartByGuestToken(guestToken)
    if (!updated) {
      throw new NotFoundError('Cart')
    }
    return mapCart(updated)
  }

  abandonGuestCart = async (
    guestToken: string
  ): Promise<{ message: string }> => {
    const cart =
      await this.cartRepository.findActiveCartByGuestToken(guestToken)
    if (!cart) {
      throw new NotFoundError('Cart')
    }

    await this.cartRepository.updateCartStatus(cart.id, 'abandoned')
    return { message: 'Cart abandoned' }
  }

  mergeGuestCartToUser = async (
    guestToken: string,
    userId: number
  ): Promise<CartResponse> => {
    const guestCart =
      await this.cartRepository.findActiveCartByGuestToken(guestToken)
    const userCart = await this.cartRepository.findActiveCartByUserId(userId)

    if (!guestCart) {
      if (!userCart) {
        return getEmptyCart()
      }
      return mapCart(userCart)
    }

    const guestItems = (guestCart as CartWithItems).items ?? []
    if (guestItems.length === 0) {
      await this.cartRepository.updateCartStatus(guestCart.id, 'abandoned')
      if (!userCart) {
        return getEmptyCart()
      }
      return mapCart(userCart)
    }

    await sequelize.transaction(async (transaction) => {
      if (!userCart) {
        await this.cartRepository.assignCartToUser(
          guestCart.id,
          userId,
          transaction
        )
        return
      }

      const userItems = (userCart as CartWithItems).items ?? []
      if (userItems.length === 0) {
        await this.cartRepository.deleteItemsByCartId(userCart.id, transaction)
        await this.cartRepository.transferCartItems(
          guestCart.id,
          userCart.id,
          transaction
        )
        await this.cartRepository.updateCartStatus(guestCart.id, 'abandoned')
        return
      }

      await this.cartRepository.deleteItemsByCartId(userCart.id, transaction)
      await this.cartRepository.transferCartItems(
        guestCart.id,
        userCart.id,
        transaction
      )
      await this.cartRepository.updateCartStatus(guestCart.id, 'abandoned')
    })

    const merged = await this.cartRepository.findActiveCartByUserId(userId)
    if (!merged) {
      return getEmptyCart()
    }
    return mapCart(merged)
  }
}

export const cartService = new CartService()

import { Op, type Transaction } from 'sequelize'

import { Cart } from '../models/cart'
import { CartItem } from '../models/cart-item'
import { Plan } from '../models/plan'
import { PlanDestination } from '../models/plan-destination'

const cartItemsInclude = [
  {
    model: CartItem,
    as: 'items',
    required: false,
    include: [
      {
        model: Plan,
        as: 'plan',
        attributes: [
          'id',
          'name',
          'dataMb',
          'dataLabel',
          'validityDays',
          'currency',
          'sellingPrice',
          'price',
          'planType',
          'flagUrl',
          'regionName',
        ],
        include: [
          {
            model: PlanDestination,
            as: 'destinations',
            required: false,
            attributes: ['countryCode', 'countryName', 'countryFlagUrl'],
          },
        ],
      },
    ],
  },
]

export class CartRepository {
  findActiveCartByUserId = async (userId: number): Promise<Cart | null> => {
    const now = new Date()
    return Cart.findOne({
      where: {
        userId,
        status: 'active',
        expiresAt: { [Op.gt]: now },
      },
      include: [...cartItemsInclude],
      order: [[{ model: CartItem, as: 'items' }, 'id', 'ASC']],
    })
  }

  findActiveCartByGuestToken = async (
    guestToken: string
  ): Promise<Cart | null> => {
    const now = new Date()
    return Cart.findOne({
      where: {
        guestToken,
        userId: null,
        status: 'active',
        expiresAt: { [Op.gt]: now },
      },
      include: [...cartItemsInclude],
      order: [[{ model: CartItem, as: 'items' }, 'id', 'ASC']],
    })
  }

  findCartByGuestToken = async (guestToken: string): Promise<Cart | null> => {
    return Cart.findOne({
      where: {
        guestToken,
        userId: null,
      },
      include: [...cartItemsInclude],
      order: [[{ model: CartItem, as: 'items' }, 'id', 'ASC']],
    })
  }

  findById = async (cartId: number): Promise<Cart | null> => {
    return Cart.findOne({
      where: { id: cartId },
      include: [...cartItemsInclude],
      order: [[{ model: CartItem, as: 'items' }, 'id', 'ASC']],
    })
  }

  findActivePlanById = async (planId: number): Promise<Plan | null> => {
    return Plan.findOne({ where: { id: planId, isActive: true } })
  }

  findByIdAndUserId = async (
    cartId: number,
    userId: number
  ): Promise<Cart | null> => {
    return Cart.findOne({ where: { id: cartId, userId } })
  }

  createCart = async (
    userId: number,
    expiresAt: Date,
    transaction: Transaction
  ): Promise<Cart> => {
    return Cart.create({ userId, status: 'active', expiresAt }, { transaction })
  }

  createGuestCart = async (
    guestToken: string,
    expiresAt: Date,
    transaction: Transaction
  ): Promise<Cart> => {
    return Cart.create(
      {
        userId: null,
        guestToken,
        status: 'active',
        expiresAt,
      },
      { transaction }
    )
  }

  assignCartToUser = async (
    cartId: number,
    userId: number,
    transaction: Transaction
  ): Promise<void> => {
    await Cart.update(
      { userId, guestToken: null },
      { where: { id: cartId }, transaction }
    )
  }

  transferCartItems = async (
    fromCartId: number,
    toCartId: number,
    transaction: Transaction
  ): Promise<void> => {
    await CartItem.update(
      { cartId: toCartId },
      { where: { cartId: fromCartId }, transaction }
    )
  }

  createCartItem = async (
    cartId: number,
    plan: Plan,
    quantity: number,
    transaction: Transaction
  ): Promise<CartItem> => {
    return CartItem.create(
      {
        cartId,
        planId: plan.id,
        quantity,
        unitPrice: plan.sellingPrice ?? plan.price,
        currency: plan.currency,
      },
      { transaction }
    )
  }

  deleteItemsByCartId = async (
    cartId: number,
    transaction: Transaction
  ): Promise<void> => {
    await CartItem.destroy({ where: { cartId }, transaction })
  }

  updateCartStatus = async (
    cartId: number,
    status: 'active' | 'converted' | 'abandoned'
  ): Promise<void> => {
    await Cart.update({ status }, { where: { id: cartId } })
  }

  reactivateGuestCart = async (
    cartId: number,
    expiresAt: Date,
    transaction: Transaction
  ): Promise<void> => {
    await Cart.update(
      { status: 'active', expiresAt },
      { where: { id: cartId }, transaction }
    )
  }
}

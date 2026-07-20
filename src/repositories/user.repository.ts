/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { col, Op, type WhereOptions } from 'sequelize'

import { EsimProfile } from '../models/esim-profile'
import { Order } from '../models/order'
import { User } from '../models/user'

export type AdminUserFilters = {
  role?: Array<'customer' | 'manager' | 'admin'>
  isActive?: boolean
  emailVerified?: boolean
  search?: string
}

export type CreateUserData = {
  email: string
  passwordHash: string | null
  firstName: string
  lastName: string
  locale?: string
  currency?: string
  phone: string | null
  authMethod?: 'password' | 'otp'
  emailVerified?: boolean
}

export type UpdateUserData = Partial<{
  isActive: boolean
  emailVerified: boolean
  passwordHash: string | null
  authMethod: 'password' | 'otp'
  firstName: string
  lastName: string
  phone: string | null
  inviteTokenHash: string | null
  inviteTokenExpiresAt: Date | null
  stripeCustomerId: string | null
}>

export type UpdateProfileData = Partial<{
  firstName: string
  lastName: string
  phone: string | null
  locale: string
  avatarUrl: string | null
}>

export type AdminUpdateUserData = {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  locale: string
  currency: string
}

export type CreateAdminUserData = {
  email: string
  passwordHash: string
  firstName: string
  lastName: string
  role: 'manager' | 'admin'
  locale: string
  currency: string
  inviteTokenHash?: string
  inviteTokenExpiresAt?: Date
}

export type UserWithAdminStats = {
  user: User
  orderCount: number
  esimCount: number
}

const userAdminListAttributes: {
  exclude: string[]
} = {
  exclude: ['passwordHash', 'stripeCustomerId'],
}

export class UserRepository {
  findByRoles = async (
    roles: Array<'customer' | 'manager' | 'admin'>
  ): Promise<User[]> => {
    if (roles.length === 0) {
      return []
    }
    return User.findAll({
      where: { role: { [Op.in]: roles }, isActive: true },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role'],
      order: [['id', 'ASC']],
    })
  }

  findById = async (id: number): Promise<User | null> => {
    return User.findOne({ where: { id } })
  }

  findByIdExcludingPasswordHash = async (id: number): Promise<User | null> => {
    return User.findOne({
      where: { id },
      attributes: { exclude: ['passwordHash'] },
    })
  }

  findByIdForInvoice = async (
    id: number
  ): Promise<Pick<User, 'id' | 'email' | 'firstName' | 'lastName'> | null> => {
    return User.findOne({
      where: { id },
      attributes: ['id', 'email', 'firstName', 'lastName'],
    })
  }

  findByEmail = async (email: string): Promise<User | null> => {
    return User.findOne({ where: { email: email.toLowerCase() } })
  }

  findByStripeCustomerId = async (
    stripeCustomerId: string
  ): Promise<User | null> => {
    return User.findOne({ where: { stripeCustomerId } })
  }

  create = async (data: CreateUserData): Promise<User> => {
    return User.create({
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      authMethod: data.authMethod ?? 'password',
      ...(data.locale === undefined ? {} : { locale: data.locale }),
      ...(data.currency === undefined ? {} : { currency: data.currency }),
      role: 'customer',
      isActive: true,
      emailVerified: data.emailVerified ?? false,
    })
  }

  createOtpCustomer = async (data: {
    email: string
    firstName: string
    lastName: string
    phone: string | null
    locale?: string
    currency?: string
  }): Promise<User> => {
    return this.create({
      email: data.email,
      passwordHash: null,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      authMethod: 'otp',
      emailVerified: true,
      locale: data.locale,
      currency: data.currency,
    })
  }

  updateCustomerProfile = async (
    id: number,
    data: {
      firstName: string
      lastName: string
      phone: string | null
    }
  ): Promise<void> => {
    await User.update(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        authMethod: 'otp',
        emailVerified: true,
      },
      { where: { id } }
    )
  }

  updateById = async (id: number, data: UpdateUserData): Promise<void> => {
    await User.update(data, { where: { id } })
  }

  updateProfileById = async (
    id: number,
    data: UpdateProfileData
  ): Promise<void> => {
    await User.update(data, { where: { id } })
  }

  updateAdminUserById = async (
    id: number,
    data: AdminUpdateUserData
  ): Promise<void> => {
    await User.update(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        phone: data.phone,
        locale: data.locale,
        currency: data.currency,
      },
      { where: { id } }
    )
  }

  findAllAdmin = async (
    filters: AdminUserFilters,
    page: number,
    limit: number
  ): Promise<{ rows: User[]; count: number }> => {
    const offset = (page - 1) * limit
    const andParts: WhereOptions[] = []

    if (filters.role !== undefined) {
      andParts.push({ role: { [Op.in]: filters.role } })
    }
    if (filters.isActive !== undefined) {
      andParts.push({ isActive: filters.isActive })
    }
    if (filters.emailVerified !== undefined) {
      andParts.push({ emailVerified: filters.emailVerified })
    }
    if (filters.search !== undefined && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`
      andParts.push({
        [Op.or]: [
          { firstName: { [Op.iLike]: term } },
          { lastName: { [Op.iLike]: term } },
          { email: { [Op.iLike]: term } },
          {
            [Op.and]: [
              User.sequelize?.where(
                User.sequelize.fn(
                  'concat',
                  User.sequelize.col('first_name'),
                  ' ',
                  User.sequelize.col('last_name')
                ),
                { [Op.iLike]: term }
              ) as WhereOptions,
            ],
          },
        ],
      })
    }

    let where: WhereOptions = {}
    if (andParts.length === 1) {
      where = andParts[0] as WhereOptions
    } else if (andParts.length > 1) {
      where = { [Op.and]: andParts }
    }

    return User.findAndCountAll({
      where,
      attributes: userAdminListAttributes,
      limit,
      offset,
      order: [[col('created_at'), 'DESC']],
    })
  }

  findByIdWithStats = async (
    id: number
  ): Promise<UserWithAdminStats | null> => {
    const user = await User.findOne({
      where: { id },
      attributes: userAdminListAttributes,
    })
    if (!user) {
      return null
    }

    const [orderCount, esimCount] = await Promise.all([
      Order.count({ where: { userId: id } }),
      EsimProfile.count({
        include: [
          {
            model: Order,
            as: 'order',
            attributes: [],
            where: { userId: id },
            required: true,
          },
        ],
      }),
    ])

    return { user, orderCount, esimCount }
  }

  updateRole = async (
    id: number,
    role: 'customer' | 'manager' | 'admin'
  ): Promise<void> => {
    await User.update({ role }, { where: { id } })
  }

  toggleActive = async (id: number, isActive: boolean): Promise<void> => {
    await User.update({ isActive }, { where: { id } })
  }

  createAdminUser = async (data: CreateAdminUserData): Promise<User> => {
    return User.create({
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: null,
      locale: data.locale,
      currency: data.currency,
      role: data.role,
      isActive: false,
      emailVerified: false,
      ...(data.inviteTokenHash === undefined
        ? {}
        : { inviteTokenHash: data.inviteTokenHash }),
      ...(data.inviteTokenExpiresAt === undefined
        ? {}
        : { inviteTokenExpiresAt: data.inviteTokenExpiresAt }),
    })
  }
}

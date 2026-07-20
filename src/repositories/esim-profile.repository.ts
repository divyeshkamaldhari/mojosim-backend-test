import {
  Op,
  fn,
  col,
  literal,
  type Includeable,
  type Transaction,
  type WhereOptions,
} from 'sequelize'

import { EsimProfile } from '../models/esim-profile'
import { Order } from '../models/order'
import { Plan } from '../models/plan'
import { ProfileStatusHistory } from '../models/profile-status-history'
import { Provider } from '../models/provider'
import { UsageRecord } from '../models/usage-record'
import { User } from '../models/user'

export type CreateEsimProfileData = {
  orderId: number
  providerId: number
  iccid: string | null
  ean: string | null
  qrPayloadEnc: string | null
  installInstructions: string | null
  directAppleInstallationUrl: string | null
  lifecycleState: 'created' | 'assigned'
  activatedAt: Date | null
  expiresAt: Date | null
  lastSyncedAt: Date | null
  dataAllowanceMb: number | null
}

export type EsimProfileUpdateData = Partial<{
  lifecycleState: EsimProfile['lifecycleState']
  activatedAt: Date | null
  expiresAt: Date | null
  lastSyncedAt: Date | null
  dataAllowanceMb: number | null
  installInstructions: string | null
  directAppleInstallationUrl: string | null
  qrPayloadEnc: string | null
  iccid: string | null
}>

export type AdminEsimListFilters = {
  esimId?: number
  userId?: number
  orderId?: number
  lifecycleState?: EsimProfile['lifecycleState']
  iccid?: string
}

export type CustomerEsimListFilters = {
  lifecycleState?: EsimProfile['lifecycleState']
  search?: string
}

export type EsimLifecycleCounts = {
  all: number
  created: number
  assigned: number
  activated: number
  suspended: number
  expired: number
  deactivated: number
}

export class EsimProfileRepository {
  findById = async (id: number): Promise<EsimProfile | null> => {
    return EsimProfile.findByPk(id)
  }

  findByIdWithOrderPlan = async (id: number): Promise<EsimProfile | null> => {
    return EsimProfile.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          required: true,
          attributes: ['id', 'userId', 'createdAt'],
          include: [
            {
              model: Plan,
              as: 'plan',
              required: false,
              attributes: ['id', 'name', 'validityDays'],
            },
          ],
        },
      ],
    })
  }

  findSyncCandidates = async (
    limit: number,
    minIntervalMinutes: number = 0
  ): Promise<EsimProfile[]> => {
    const threshold =
      minIntervalMinutes > 0
        ? new Date(Date.now() - minIntervalMinutes * 60 * 1000)
        : null
    return EsimProfile.findAll({
      where: {
        lifecycleState: {
          [Op.in]: ['assigned', 'activated', 'suspended'],
        },
        ...(threshold
          ? {
              [Op.or]: [
                { lastSyncedAt: { [Op.is]: null } },
                { lastSyncedAt: { [Op.lte]: threshold } },
              ],
            }
          : {}),
      },
      order: [
        // NULLs first, then oldest sync first.
        [literal(`"last_synced_at" IS NULL`), 'DESC'],
        ['lastSyncedAt', 'ASC'],
        ['id', 'ASC'],
      ],
      limit,
    })
  }

  findByIccid = async (iccid: string): Promise<EsimProfile | null> => {
    return EsimProfile.findOne({ where: { iccid } })
  }

  findByIccidWithOrder = async (iccid: string): Promise<EsimProfile | null> => {
    return EsimProfile.findOne({
      where: { iccid },
      include: [
        {
          model: Order,
          as: 'order',
          required: true,
          attributes: ['id', 'userId'],
        },
      ],
    })
  }

  findByUserId = async (userId: number): Promise<EsimProfile[]> => {
    const result = await this.findByUserIdFiltered(userId, {}, 1, 1000)
    return result.rows
  }

  countLifecycleStatesByUserId = async (
    userId: number
  ): Promise<EsimLifecycleCounts> => {
    const rows = (await EsimProfile.findAll({
      attributes: [
        'lifecycleState',
        [fn('COUNT', col('EsimProfile.id')), 'count'],
      ],
      include: [
        {
          model: Order,
          as: 'order',
          where: { userId },
          required: true,
          attributes: [],
        },
      ],
      group: ['EsimProfile.lifecycle_state'],
      raw: true,
    })) as unknown as Array<{
      lifecycleState: EsimProfile['lifecycleState']
      count: string
    }>

    const counts: EsimLifecycleCounts = {
      all: 0,
      created: 0,
      assigned: 0,
      activated: 0,
      suspended: 0,
      expired: 0,
      deactivated: 0,
    }

    for (const row of rows) {
      const value = Number.parseInt(row.count, 10)
      if (!Number.isFinite(value)) {
        continue
      }
      counts[row.lifecycleState] = value
      counts.all += value
    }

    return counts
  }

  findByUserIdFiltered = async (
    userId: number,
    filters: CustomerEsimListFilters,
    page: number,
    limit: number
  ): Promise<{ rows: EsimProfile[]; count: number }> => {
    const where: WhereOptions<EsimProfile> = {}

    if (filters.lifecycleState !== undefined) {
      where.lifecycleState = filters.lifecycleState
    }

    if (filters.search !== undefined && filters.search.length > 0) {
      const term = `%${filters.search}%`
      Object.assign(where, {
        [Op.or]: [
          { iccid: { [Op.iLike]: term } },
          { '$order.plan.name$': { [Op.iLike]: term } },
        ],
      })
    }

    const listInclude: Includeable[] = [
      {
        model: Order,
        as: 'order',
        where: { userId },
        required: true,
        attributes: ['id', 'userId'],
        include: [
          {
            model: Plan,
            as: 'plan',
            attributes: [
              'id',
              'name',
              'planType',
              'flagUrl',
              'regionName',
              'dataMb',
              'dataLabel',
              'validityDays',
              'currency',
              'providerId',
            ],
            required: false,
          },
        ],
      },
      {
        model: UsageRecord,
        as: 'usageRecords',
        separate: true,
        limit: 1,
        order: [['recorded_at', 'DESC']],
      },
    ]

    const [rows, count] = await Promise.all([
      EsimProfile.findAll({
        where,
        include: listInclude,
        order: [['id', 'DESC']],
        offset: (page - 1) * limit,
        limit,
        subQuery: false,
      }),
      EsimProfile.count({
        where,
        include: [
          {
            model: Order,
            as: 'order',
            where: { userId },
            required: true,
            attributes: [],
            include: [
              {
                model: Plan,
                as: 'plan',
                attributes: [],
                required: false,
              },
            ],
          },
        ],
      }),
    ])

    return { rows, count }
  }

  findByIdAndUserId = async (
    id: number,
    userId: number
  ): Promise<EsimProfile | null> => {
    return EsimProfile.findOne({
      where: { id },
      include: [
        {
          model: Order,
          as: 'order',
          where: { userId },
          required: true,
          attributes: ['id', 'userId'],
          include: [
            {
              model: Plan,
              as: 'plan',
              attributes: [
                'id',
                'name',
                'planType',
                'flagUrl',
                'regionName',
                'dataMb',
                'dataLabel',
                'validityDays',
                'currency',
                'providerId',
              ],
            },
          ],
        },
        {
          model: UsageRecord,
          as: 'usageRecords',
          separate: true,
          limit: 1,
          order: [['recorded_at', 'DESC']],
        },
      ],
    })
  }

  findByOrderId = async (orderId: number): Promise<EsimProfile | null> => {
    return EsimProfile.findOne({ where: { orderId } })
  }

  findAllByOrderId = async (
    orderId: number,
    options?: { transaction?: Transaction }
  ): Promise<EsimProfile[]> => {
    return EsimProfile.findAll({
      where: { orderId },
      order: [['id', 'ASC']],
      transaction: options?.transaction,
    })
  }

  findByOrderIdAndIccid = async (
    orderId: number,
    iccid: string,
    options?: { transaction?: Transaction }
  ): Promise<EsimProfile | null> => {
    return EsimProfile.findOne({
      where: { orderId, iccid },
      transaction: options?.transaction,
    })
  }

  findByIdForAdmin = async (id: number): Promise<EsimProfile | null> => {
    return EsimProfile.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          required: true,
          attributes: [
            'id',
            'userId',
            'status',
            'orderType',
            'amount',
            'currency',
            'paymentStatus',
            'createdAt',
          ],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'firstName', 'lastName'],
              required: false,
            },
            {
              model: Plan,
              as: 'plan',
              attributes: [
                'id',
                'name',
                'providerSku',
                'dataMb',
                'dataLabel',
                'validityDays',
                'currency',
                'flagUrl',
                'regionName',
                'planType',
              ],
              required: false,
            },
          ],
        },
        {
          model: Provider,
          as: 'provider',
          attributes: ['id', 'name', 'slug'],
          required: false,
        },
        {
          model: ProfileStatusHistory,
          as: 'statusHistory',
          separate: true,
          limit: 100,
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: User,
              as: 'actor',
              attributes: ['id', 'email'],
              required: false,
            },
          ],
        },
        {
          model: UsageRecord,
          as: 'usageRecords',
          separate: true,
          limit: 1,
          order: [['recorded_at', 'DESC']],
        },
      ],
    })
  }

  listForAdmin = async (
    filters: AdminEsimListFilters,
    page: number,
    limit: number
  ): Promise<{ rows: EsimProfile[]; count: number }> => {
    const where: WhereOptions<EsimProfile> = {}
    if (filters.esimId !== undefined) {
      where.id = filters.esimId
    }
    if (filters.lifecycleState !== undefined) {
      where.lifecycleState = filters.lifecycleState
    }
    if (filters.iccid !== undefined && filters.iccid.length > 0) {
      const safe = filters.iccid.replaceAll(/[^0-9a-zA-Z-]/g, '')
      if (safe.length > 0) {
        where.iccid = { [Op.iLike]: `%${safe}%` }
      }
    }

    const orderWhere: WhereOptions<Order> = {}
    if (filters.userId !== undefined) {
      orderWhere.userId = filters.userId
    }
    if (filters.orderId !== undefined) {
      orderWhere.id = filters.orderId
    }

    const listInclude = [
      {
        model: Order,
        as: 'order',
        required: true,
        ...(Object.keys(orderWhere).length > 0 ? { where: orderWhere } : {}),
        attributes: [
          'id',
          'userId',
          'status',
          'orderType',
          'amount',
          'currency',
          'createdAt',
        ],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName'],
            required: false,
          },
          {
            model: Plan,
            as: 'plan',
            attributes: ['id', 'name', 'flagUrl', 'regionName', 'planType'],
            required: false,
          },
        ],
      },
    ]

    const [rows, count] = await Promise.all([
      EsimProfile.findAll({
        where,
        include: listInclude,
        order: [['id', 'DESC']],
        offset: (page - 1) * limit,
        limit,
        subQuery: false,
      }),
      EsimProfile.count({
        where,
        include: [
          {
            model: Order,
            as: 'order',
            required: true,
            ...(Object.keys(orderWhere).length > 0
              ? { where: orderWhere }
              : {}),
            attributes: [],
          },
        ],
      }),
    ])

    return { rows, count }
  }

  /**
   * Profiles with expiry in (now, now + horizonDays], active-ish lifecycle, for reminder emails.
   */
  findExpiringWithinHorizon = async (
    horizonDays: number,
    limit: number
  ): Promise<EsimProfile[]> => {
    const now = new Date()
    const horizonEnd = new Date(
      now.getTime() + horizonDays * 24 * 60 * 60 * 1000
    )
    return EsimProfile.findAll({
      where: {
        [Op.and]: [
          { expiresAt: { [Op.gt]: now } },
          { expiresAt: { [Op.lte]: horizonEnd } },
        ],
        lifecycleState: {
          [Op.in]: ['assigned', 'activated', 'suspended'],
        },
      },
      include: [
        {
          model: Order,
          as: 'order',
          required: true,
          attributes: ['id', 'userId'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName'],
              required: false,
            },
          ],
        },
      ],
      order: [['expiresAt', 'ASC']],
      limit,
    })
  }

  create = async (
    data: CreateEsimProfileData,
    options?: { transaction?: Transaction }
  ): Promise<EsimProfile> => {
    return EsimProfile.create(
      {
        orderId: data.orderId,
        providerId: data.providerId,
        iccid: data.iccid,
        ean: data.ean,
        qrPayloadEnc: data.qrPayloadEnc,
        installInstructions: data.installInstructions,
        directAppleInstallationUrl: data.directAppleInstallationUrl,
        lifecycleState: data.lifecycleState,
        activatedAt: data.activatedAt,
        expiresAt: data.expiresAt,
        lastSyncedAt: data.lastSyncedAt,
        dataAllowanceMb: data.dataAllowanceMb,
      },
      { transaction: options?.transaction }
    )
  }

  updateById = async (
    id: number,
    data: EsimProfileUpdateData,
    options?: { transaction?: Transaction }
  ): Promise<void> => {
    await EsimProfile.update(data, {
      where: { id },
      transaction: options?.transaction,
    })
  }
}

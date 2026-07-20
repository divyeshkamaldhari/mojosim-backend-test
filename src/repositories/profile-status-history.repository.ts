import { Op, type Transaction } from 'sequelize'

import { ProfileStatusHistory } from '../models/profile-status-history'
import { User } from '../models/user'

export type CreateProfileStatusHistoryData = {
  esimProfileId: number
  fromState:
    | 'created'
    | 'assigned'
    | 'activated'
    | 'suspended'
    | 'expired'
    | 'deactivated'
    | null
  toState:
    | 'created'
    | 'assigned'
    | 'activated'
    | 'suspended'
    | 'expired'
    | 'deactivated'
  source: string
  reason: string
  actorId: number | null
}

export class ProfileStatusHistoryRepository {
  findByEsimProfileIdPaginated = async (
    esimProfileId: number,
    page: number,
    limit: number
  ): Promise<{ rows: ProfileStatusHistory[]; count: number }> => {
    return ProfileStatusHistory.findAndCountAll({
      where: { esimProfileId },
      order: [['createdAt', 'ASC']],
      offset: (page - 1) * limit,
      limit,
      include: [
        {
          model: User,
          as: 'actor',
          attributes: ['id', 'email'],
          required: false,
        },
      ],
    })
  }

  findByEsimProfileIds = async (
    esimProfileIds: number[]
  ): Promise<ProfileStatusHistory[]> => {
    if (esimProfileIds.length === 0) {
      return []
    }

    return ProfileStatusHistory.findAll({
      where: { esimProfileId: { [Op.in]: esimProfileIds } },
      order: [['createdAt', 'ASC']],
      attributes: [
        'id',
        'esimProfileId',
        'fromState',
        'toState',
        'source',
        'reason',
        'createdAt',
      ],
    })
  }

  create = async (
    data: CreateProfileStatusHistoryData,
    options?: { transaction?: Transaction }
  ): Promise<ProfileStatusHistory> => {
    return ProfileStatusHistory.create(
      {
        esimProfileId: data.esimProfileId,
        fromState: data.fromState,
        toState: data.toState,
        source: data.source,
        reason: data.reason,
        actorId: data.actorId,
      },
      { transaction: options?.transaction }
    )
  }
}

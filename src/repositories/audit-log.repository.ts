import { Op } from 'sequelize'

import { AuditLog } from '../models/audit-log'

export type CreateAuditLogData = {
  actorId: number | null
  action: string
  entityType: string
  entityId: number
  beforeState: Record<string, unknown> | null
  afterState: Record<string, unknown> | null
  ipAddress: string | null
}

export type AuditLogListFilters = {
  actorId?: number
  action?: string
  entityType?: string
  entityId?: number
  createdFrom?: Date
  createdTo?: Date
}

export class AuditLogRepository {
  create = async (data: CreateAuditLogData): Promise<AuditLog> => {
    return AuditLog.create({
      actorId: data.actorId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      beforeState: data.beforeState,
      afterState: data.afterState,
      ipAddress: data.ipAddress,
    })
  }

  findAll = async (
    filters: AuditLogListFilters,
    page: number,
    limit: number
  ): Promise<{ rows: AuditLog[]; count: number }> => {
    const where: Record<string, unknown> = {}
    if (filters.actorId !== undefined) {
      where.actorId = filters.actorId
    }
    if (filters.action !== undefined) {
      where.action = { [Op.iLike]: `%${filters.action}%` }
    }
    if (filters.entityType !== undefined) {
      where.entityType = filters.entityType
    }
    if (filters.entityId !== undefined) {
      where.entityId = filters.entityId
    }
    if (filters.createdFrom !== undefined || filters.createdTo !== undefined) {
      const createdAt: { [Op.gte]?: Date; [Op.lte]?: Date } = {}
      if (filters.createdFrom !== undefined) {
        createdAt[Op.gte] = filters.createdFrom
      }
      if (filters.createdTo !== undefined) {
        createdAt[Op.lte] = filters.createdTo
      }
      where.createdAt = createdAt
    }

    return AuditLog.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * limit,
      limit,
      attributes: [
        'id',
        'actorId',
        'action',
        'entityType',
        'entityId',
        'beforeState',
        'afterState',
        'ipAddress',
        'createdAt',
        'updatedAt',
      ],
    })
  }

  findByEntity = async (
    entityType: string,
    entityId: number
  ): Promise<AuditLog[]> => {
    return AuditLog.findAll({
      where: { entityType, entityId },
      order: [['id', 'ASC']],
      attributes: [
        'id',
        'actorId',
        'action',
        'entityType',
        'entityId',
        'beforeState',
        'afterState',
        'ipAddress',
        'createdAt',
        'updatedAt',
      ],
    })
  }
}

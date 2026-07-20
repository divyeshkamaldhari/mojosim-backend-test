import { Op, type Transaction, type WhereOptions } from 'sequelize'

import { CompatibleDevice } from '../models/compatible-device'

export type CompatibleDeviceUpsertRow = {
  providerId: number
  os: string
  brand: string
  name: string
  isActive: boolean
  syncedAt: Date
}

export type CompatibleDeviceListFilters = {
  search?: string
}

export class CompatibleDeviceRepository {
  bulkUpsert = async (
    rows: CompatibleDeviceUpsertRow[],
    transaction?: Transaction
  ): Promise<void> => {
    if (rows.length === 0) {
      return
    }
    const dedupedRows = new Map<string, CompatibleDeviceUpsertRow>()
    for (const row of rows) {
      const key = `${row.providerId}|${row.os}|${row.brand}|${row.name}`
      dedupedRows.set(key, row)
    }
    await CompatibleDevice.bulkCreate([...dedupedRows.values()], {
      transaction,
      conflictAttributes: ['providerId', 'os', 'brand', 'name'],
      updateOnDuplicate: ['is_active', 'synced_at', 'updated_at'],
    })
  }

  findActiveByProvider = async (
    providerId: number,
    transaction?: Transaction
  ): Promise<CompatibleDevice[]> => {
    return CompatibleDevice.findAll({
      where: { providerId, isActive: true },
      transaction,
    })
  }

  deactivateByIds = async (
    ids: number[],
    transaction?: Transaction
  ): Promise<number> => {
    if (ids.length === 0) {
      return 0
    }
    const [affected] = await CompatibleDevice.update(
      { isActive: false },
      { where: { id: { [Op.in]: ids } }, transaction }
    )
    return affected
  }

  listActiveByProvider = async (
    providerId: number,
    filters: CompatibleDeviceListFilters,
    page: number,
    limit: number
  ): Promise<{ rows: CompatibleDevice[]; count: number }> => {
    const offset = (page - 1) * limit
    const where: WhereOptions = { providerId, isActive: true }
    if (filters.search !== undefined) {
      const q = filters.search.trim()
      Object.assign(where, {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { brand: { [Op.iLike]: `%${q}%` } },
          { os: { [Op.iLike]: `%${q}%` } },
        ],
      })
    }

    const { rows, count } = await CompatibleDevice.findAndCountAll({
      where,
      order: [
        ['brand', 'ASC'],
        ['name', 'ASC'],
      ],
      limit,
      offset,
    })
    return { rows, count }
  }
}

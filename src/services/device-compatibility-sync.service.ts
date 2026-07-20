import { sequelize } from '../config/db'
import { AppError } from '../common/errors'
import { logger } from '../common/logger'
import type { ListCompatibleDevicesQuery } from '../dto/compatibility.dto'
import { AiraloAdapter } from '../modules/providers/airalo/airalo.adapter'
import type { ProviderCompatibleDevice } from '../modules/providers/provider.interface'
import { CompatibleDeviceRepository } from '../repositories/compatible-device.repository'
import { ProviderRepository } from '../repositories/provider.repository'
import { decryptApiCredentials } from './provider.service'

export type DeviceCompatibilitySyncResult = {
  total: number
  inserted: number
  updated: number
  deactivated: number
  errors: number
  providerName: string
  syncedAt: Date
}

export type CompatibleDeviceListItem = {
  id: number
  provider_id: number
  os: string
  brand: string
  name: string
  synced_at: string
}

const normalizeDevice = (
  row: ProviderCompatibleDevice
): ProviderCompatibleDevice | null => {
  const os = row.os.trim().toLowerCase()
  const brand = row.brand.trim()
  const name = row.name.trim()
  if (!os || !brand || !name) {
    return null
  }
  return {
    os: os.slice(0, 50),
    brand: brand.slice(0, 100),
    name: name.slice(0, 255),
  }
}

export class DeviceCompatibilitySyncService {
  private readonly providerRepository: ProviderRepository
  private readonly compatibleDeviceRepository: CompatibleDeviceRepository

  constructor(
    providerRepository: ProviderRepository = new ProviderRepository(),
    compatibleDeviceRepository: CompatibleDeviceRepository = new CompatibleDeviceRepository()
  ) {
    this.providerRepository = providerRepository
    this.compatibleDeviceRepository = compatibleDeviceRepository
  }

  syncCompatibleDevices = async (
    providerIdInput?: number
  ): Promise<DeviceCompatibilitySyncResult> => {
    const resolvedId =
      providerIdInput ??
      (await this.providerRepository.findFirstActiveProvider())?.id ??
      null

    if (resolvedId === null) {
      throw new AppError('No active provider found', 400, 'NO_ACTIVE_PROVIDER')
    }

    const provider =
      await this.providerRepository.findByIdWithCredentials(resolvedId)
    if (!provider) {
      throw new AppError('Provider not found', 404, 'NOT_FOUND')
    }
    if (!provider.isActive) {
      throw new AppError('Provider is not active', 400, 'PROVIDER_INACTIVE')
    }
    if (provider.slug !== 'airalo') {
      throw new AppError(
        'Only Airalo compatibility sync is supported',
        400,
        'UNSUPPORTED_PROVIDER'
      )
    }

    const credentials = decryptApiCredentials(provider.apiCredentialsEnc)
    const adapter = new AiraloAdapter(provider.apiBaseUrl, {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
    })

    const rawRows = await adapter.getCompatibleDevicesLite()
    const syncedAt = new Date()
    const normalizedRows: ProviderCompatibleDevice[] = []
    const seen = new Set<string>()
    let parseErrors = 0

    for (const row of rawRows) {
      const normalized = normalizeDevice(row)
      if (!normalized) {
        parseErrors += 1
        continue
      }
      const key = `${normalized.os}|${normalized.brand.toLowerCase()}|${normalized.name.toLowerCase()}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      normalizedRows.push(normalized)
    }

    const existing = await this.compatibleDeviceRepository.findActiveByProvider(
      provider.id
    )
    const existingMap = new Map(
      existing.map((d) => [
        `${d.os}|${d.brand.toLowerCase()}|${d.name.toLowerCase()}`,
        d,
      ])
    )

    let inserted = 0
    let updated = 0
    for (const row of normalizedRows) {
      const key = `${row.os}|${row.brand.toLowerCase()}|${row.name.toLowerCase()}`
      if (existingMap.has(key)) {
        updated += 1
      } else {
        inserted += 1
      }
    }

    const latestKeys = new Set(
      normalizedRows.map(
        (r) => `${r.os}|${r.brand.toLowerCase()}|${r.name.toLowerCase()}`
      )
    )
    const toDeactivateIds = existing
      .filter(
        (d) =>
          !latestKeys.has(
            `${d.os}|${d.brand.toLowerCase()}|${d.name.toLowerCase()}`
          )
      )
      .map((d) => d.id)

    let deactivated = 0
    await sequelize.transaction(async (transaction) => {
      await this.compatibleDeviceRepository.bulkUpsert(
        normalizedRows.map((r) => ({
          providerId: provider.id,
          os: r.os,
          brand: r.brand,
          name: r.name,
          isActive: true,
          syncedAt,
        })),
        transaction
      )
      deactivated = await this.compatibleDeviceRepository.deactivateByIds(
        toDeactivateIds,
        transaction
      )
      await this.providerRepository.touchUpdatedAt(provider.id, transaction)
    })

    logger.info('Compatible device sync completed', {
      provider: provider.name,
      total: normalizedRows.length,
      inserted,
      updated,
      deactivated,
      errors: parseErrors,
    })

    return {
      total: normalizedRows.length,
      inserted,
      updated,
      deactivated,
      errors: parseErrors,
      providerName: provider.name,
      syncedAt,
    }
  }

  listCompatibleDevices = async (
    query: ListCompatibleDevicesQuery
  ): Promise<{
    items: CompatibleDeviceListItem[]
    meta: { page: number; limit: number; total: number; provider_id: number }
  }> => {
    const resolvedProviderId =
      query.provider_id ??
      (await this.providerRepository.findFirstActiveProvider())?.id ??
      null

    if (resolvedProviderId === null) {
      throw new AppError('No active provider found', 400, 'NO_ACTIVE_PROVIDER')
    }

    const provider = await this.providerRepository.findById(resolvedProviderId)
    if (provider === null) {
      throw new AppError('Provider not found', 404, 'NOT_FOUND')
    }

    const { rows, count } =
      await this.compatibleDeviceRepository.listActiveByProvider(
        resolvedProviderId,
        {
          search: query.search,
        },
        query.page,
        query.limit
      )

    return {
      items: rows.map((row) => ({
        id: row.id,
        provider_id: row.providerId,
        os: row.os,
        brand: row.brand,
        name: row.name,
        synced_at: row.syncedAt.toISOString(),
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total: count,
        provider_id: resolvedProviderId,
      },
    }
  }
}

export const deviceCompatibilitySyncService =
  new DeviceCompatibilitySyncService()

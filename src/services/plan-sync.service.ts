import type { Transaction } from 'sequelize'

import { sequelize } from '../config/db'
import { AppError } from '../common/errors'
import { logger } from '../common/logger'
import type { ProviderPackage } from '../modules/providers/provider.interface'
import { AiraloAdapter } from '../modules/providers/airalo/airalo.adapter'
import {
  PlanRepository,
  type PlanSyncRowData,
} from '../repositories/plan.repository'
import { ProviderRepository } from '../repositories/provider.repository'
import { normalizeProviderCountryCode } from '../utils/normalize-provider-country-code'
import { decryptApiCredentials } from './provider.service'
import { calculateSellingPrice } from '../utils/margin.util'

export type SyncResult = {
  total: number
  inserted: number
  updated: number
  deactivated: number
  errors: number
  providerName: string
  syncedAt: Date
}

const formatMoney = (n: number): string => n.toFixed(2)

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : value.slice(0, max)
const toNumber = (value: string): number => Number.parseFloat(value)

const normalizeDestinationRows = (
  planId: number,
  pkg: ProviderPackage
): Array<{
  planId: number
  countryCode: string
  countryName: string
  countryFlagUrl: string | null
}> => {
  const out: Array<{
    planId: number
    countryCode: string
    countryName: string
    countryFlagUrl: string | null
  }> = []
  const seen = new Set<string>()
  for (const d of pkg.destinations) {
    const code = normalizeProviderCountryCode(d.country_code)
    if (code === null || seen.has(code)) {
      continue
    }
    seen.add(code)
    out.push({
      planId,
      countryCode: code,
      countryName: d.country_name.trim().slice(0, 255) || code,
      countryFlagUrl:
        d.country_flag_url && d.country_flag_url.trim().length > 0
          ? d.country_flag_url.trim().slice(0, 500)
          : null,
    })
  }
  return out
}

export class PlanSyncService {
  private readonly providerRepository: ProviderRepository

  private readonly planRepository: PlanRepository

  constructor(
    providerRepository: ProviderRepository = new ProviderRepository(),
    planRepository: PlanRepository = new PlanRepository()
  ) {
    this.providerRepository = providerRepository
    this.planRepository = planRepository
  }

  syncPlans = async (providerIdInput?: number): Promise<SyncResult> => {
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
        'Only Airalo provider sync is supported',
        400,
        'UNSUPPORTED_PROVIDER'
      )
    }

    const credentials = decryptApiCredentials(provider.apiCredentialsEnc)
    const adapter = new AiraloAdapter(provider.apiBaseUrl, {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
    })

    const { packages, skipped } = await adapter.getPackagesWithMetrics()
    const providerMarginPercent = toNumber(provider.marginPercent)
    const syncedAt = new Date()
    const skuList: string[] = []
    let inserted = 0
    let updated = 0
    let errors = skipped
    let dbErrors = 0
    let deactivated = 0

    for (const pkg of packages) {
      try {
        const outcome = await sequelize.transaction(async (transaction) =>
          this.upsertOnePlan(
            provider.id,
            providerMarginPercent,
            pkg,
            syncedAt,
            transaction
          )
        )
        if (outcome === 'inserted') {
          inserted += 1
        } else {
          updated += 1
        }
        skuList.push(truncate(pkg.provider_sku, 255))
      } catch (err) {
        dbErrors += 1
        const parentMsg =
          err !== null &&
          typeof err === 'object' &&
          'parent' in err &&
          (err as { parent?: { message?: string } }).parent?.message
        logger.error('Plan sync row failed', {
          providerId: provider.id,
          providerSku: pkg.provider_sku,
          err:
            err instanceof Error
              ? { name: err.name, message: err.message, detail: parentMsg }
              : { message: String(err) },
        })
      }
    }

    await sequelize.transaction(async (transaction) => {
      deactivated = await this.planRepository.deactivatePlansNotInSync(
        provider.id,
        skuList,
        transaction
      )
      await this.providerRepository.touchUpdatedAt(provider.id, transaction)
    })

    errors += dbErrors

    const total = packages.length + skipped

    logger.info('Plan sync completed', {
      provider: provider.name,
      total,
      inserted,
      updated,
      deactivated,
      errors,
    })

    return {
      total,
      inserted,
      updated,
      deactivated,
      errors,
      providerName: provider.name,
      syncedAt,
    }
  }

  private readonly upsertOnePlan = async (
    providerId: number,
    providerMarginPercent: number,
    pkg: ProviderPackage,
    syncedAt: Date,
    transaction: Transaction
  ): Promise<'inserted' | 'updated'> => {
    const providerSku = truncate(pkg.provider_sku, 255)
    const existing = await this.planRepository.findByProviderAndSku(
      providerId,
      providerSku,
      transaction
    )
    const customMarginPercent =
      existing?.customMarginPercent === null ||
      existing?.customMarginPercent === undefined
        ? null
        : toNumber(existing.customMarginPercent)
    const sellingPrice = calculateSellingPrice(
      pkg.net_price,
      providerMarginPercent,
      customMarginPercent
    )
    const row: Omit<
      PlanSyncRowData,
      'providerId' | 'providerSku' | 'isFeatured'
    > = {
      name: truncate(pkg.name, 255),
      description: pkg.description,
      dataMb: pkg.data_mb,
      dataLabel: pkg.data_label === null ? null : truncate(pkg.data_label, 255),
      validityDays: pkg.validity_days,
      currency: truncate(pkg.currency, 255),
      price: formatMoney(pkg.price),
      netPrice: formatMoney(pkg.net_price),
      customMarginPercent:
        customMarginPercent === null ? null : formatMoney(customMarginPercent),
      sellingPrice: formatMoney(sellingPrice),
      planType: pkg.plan_type,
      flagUrl: pkg.flag_url ? truncate(pkg.flag_url, 500) : null,
      regionName:
        pkg.region_name !== null && pkg.region_name !== undefined
          ? truncate(pkg.region_name, 255)
          : null,
      airaloPackageType: truncate(pkg.airalo_package_type, 20),
      metadata: pkg.metadata,
      coverage: pkg.coverage,
      syncedAt,
      isActive: true,
    }

    if (existing) {
      await this.planRepository.updatePlanSyncRow(existing.id, row, transaction)
      await this.planRepository.deleteDestinationsByPlanId(
        existing.id,
        transaction
      )
      await this.planRepository.bulkCreateDestinations(
        normalizeDestinationRows(existing.id, pkg),
        transaction
      )
      return 'updated'
    }

    const created = await this.planRepository.createPlanSyncRow(
      {
        providerId,
        providerSku,
        ...row,
        isFeatured: true,
      },
      transaction
    )
    await this.planRepository.bulkCreateDestinations(
      normalizeDestinationRows(created.id, pkg),
      transaction
    )
    return 'inserted'
  }
}

export const planSyncService = new PlanSyncService()

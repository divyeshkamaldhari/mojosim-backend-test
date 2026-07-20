import type { ListPlansQuery } from '../dto/plan.dto'
import type { PlanListFilters } from '../repositories/plan.repository'
import {
  AvailableDestinationRow,
  LocalDestinationItem,
  PlanDetail,
  PlanListItem,
  PlanWithRelations,
  RegionDestinationItem,
} from '.././types/plan.types'

export const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

export const asStringOrNull = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

export const asNumberOrNull = (value: unknown): number | null => {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export const asBooleanOrNull = (value: unknown): boolean | null => {
  return typeof value === 'boolean' ? value : null
}

export const normalizeSearchTerm = (
  value: string | undefined
): string | null => {
  if (value === undefined) {
    return null
  }
  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

export const matchesLocalSearch = (
  searchTerm: string | null,
  countryCode: string,
  countryName: string
): boolean => {
  if (searchTerm === null) {
    return true
  }
  return (
    countryCode.toLowerCase().includes(searchTerm) ||
    countryName.toLowerCase().includes(searchTerm)
  )
}

export const matchesRegionSearch = (
  searchTerm: string | null,
  regionName: string | null
): boolean => {
  if (searchTerm === null) {
    return true
  }
  return (regionName ?? '').toLowerCase().includes(searchTerm)
}

export const appendAvailableDestinationRow = (
  row: AvailableDestinationRow,
  searchTerm: string | null,
  local: LocalDestinationItem[],
  regional: RegionDestinationItem[],
  global: RegionDestinationItem[],
  regionalSeen: Set<string>,
  globalSeen: Set<string>
): void => {
  if (row.planType === 'local') {
    if (!matchesLocalSearch(searchTerm, row.countryCode, row.countryName)) {
      return
    }
    local.push({
      country_code: row.countryCode,
      country_name: row.countryName,
      flag_url: row.flagUrl,
    })
    return
  }

  if (!matchesRegionSearch(searchTerm, row.regionName)) {
    return
  }

  const key = `${row.regionName ?? ''}|${row.flagUrl ?? ''}`
  if (row.planType === 'regional') {
    if (regionalSeen.has(key)) {
      return
    }
    regionalSeen.add(key)
    regional.push({
      flag_url: row.flagUrl,
      region_name: row.regionName,
    })
    return
  }

  if (globalSeen.has(key)) {
    return
  }
  globalSeen.add(key)
  global.push({
    flag_url: row.flagUrl,
    region_name: row.regionName,
  })
}

export const mapPlanToListItem = (plan: PlanWithRelations): PlanListItem => ({
  id: plan.id,
  name: plan.name,
  description: plan.description,
  data_mb: plan.dataMb,
  data_label: plan.dataLabel,
  validity_days: plan.validityDays,
  price: plan.sellingPrice ?? plan.price,
  currency: plan.currency,
  plan_type: plan.planType,
  flag_url: plan.flagUrl,
  region_name: plan.regionName,
  airalo_package_type: plan.airaloPackageType,
  is_featured: plan.isFeatured,
  provider_name: plan.provider?.name ?? '',
})

export const mapPlanToDetail = (plan: PlanWithRelations): PlanDetail => ({
  ...mapPlanToListItem(plan),
  provider_id: plan.providerId,
  provider_sku: plan.providerSku,
  metadata: plan.metadata,
  synced_at: plan.syncedAt ? plan.syncedAt.toISOString() : null,
  created_at: plan.createdAt,
  updated_at: plan.updatedAt,
})

export const toFilters = (query: ListPlansQuery): PlanListFilters => {
  return {
    countryCode: query.country_code,
    region: query.region,
    planType: query.plan_type,
    airaloPackageType: query.airalo_package_type,
    isFeatured: query.is_featured === true ? true : undefined,
    providerId: query.provider_id,
    dataLabelNormalized: query.data,
    validityDays: query.validity_days,
  }
}

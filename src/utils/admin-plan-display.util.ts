import type { Plan } from '../models/plan'

export type AdminPlanDisplay = {
  id: number
  name: string
  flag_url: string | null
  region_name: string | null
  plan_type: string
  destination_label: string | null
}

export const resolvePlanDestinationLabel = (
  plan: Pick<Plan, 'planType' | 'regionName'>,
  countryName?: string | null
): string | null => {
  const region = plan.regionName?.trim()
  if (region) {
    return region
  }

  const country = countryName?.trim()
  if (plan.planType === 'local' && country) {
    return country
  }
  if (plan.planType === 'global') {
    return 'Global'
  }
  if (plan.planType === 'regional') {
    return 'Regional'
  }

  return null
}

export const mapAdminPlanDisplay = (
  plan: Pick<Plan, 'id' | 'name' | 'flagUrl' | 'regionName' | 'planType'>,
  countryName?: string | null
): AdminPlanDisplay => ({
  id: plan.id,
  name: plan.name,
  flag_url: plan.flagUrl,
  region_name: plan.regionName,
  plan_type: plan.planType,
  destination_label: resolvePlanDestinationLabel(plan, countryName),
})

export const formatAdminPlanTitle = (
  name: string,
  destinationLabel?: string | null
): string => {
  const trimmedName = name.trim()
  const trimmedLabel = destinationLabel?.trim()
  if (trimmedLabel && trimmedName) {
    return `${trimmedLabel} · ${trimmedName}`
  }
  return trimmedName || trimmedLabel || ''
}

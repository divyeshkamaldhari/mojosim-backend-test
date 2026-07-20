import type { Plan } from '../models/plan'

export type AvailableDestinationRow = {
  planType: 'local' | 'regional' | 'global'
  regionName: string | null
  countryCode: string
  countryName: string
  flagUrl: string | null
}

export type LocalDestinationItem = {
  country_code: string
  country_name: string
  flag_url: string | null
}

export type RegionDestinationItem = {
  flag_url: string | null
  region_name: string | null
}

export type PlanListItem = {
  id: number
  name: string
  description: string
  data_mb: number
  data_label: string | null
  validity_days: number
  price: string
  currency: string
  plan_type: string
  flag_url: string | null
  region_name: string | null
  airalo_package_type: string
  is_featured: boolean
  provider_name: string
}

export type PlanDetail = PlanListItem & {
  provider_id: number
  provider_sku: string
  metadata: unknown
  synced_at: string | null
  created_at: Date
  updated_at: Date
}

export type PlanPackageDetails = {
  provider_activation_policy: {
    activation_policy: string | null
    install_window_days: number | null
    description: string
  }
  validity_policy: {
    activation_policy: string | null
    validity_days: number
    description: string
  }
  ip_routing: {
    is_roaming: boolean | null
    note: string | null
    description: string
  }
  top_up_option: {
    rechargeability: boolean | null
    topup_grace_window_days: number | null
    description: string
  }
}

export type PlanWithRelations = Plan & {
  provider?: { name: string }
}

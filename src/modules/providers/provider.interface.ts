export interface ProviderOrder {
  provider_order_id: string
  iccid: string
  qr_payload: string
  install_instructions: string
  direct_apple_url: string | null
}

export interface ProviderEsim {
  iccid: string
  status: string
  qr_payload: string
  data_used_mb?: number | null
  data_remaining_mb?: number | null
}

export interface ProviderEsimUsage {
  status: string
  data_used_mb: number | null
  data_remaining_mb: number | null
  expired_at: Date | null
  is_unlimited: boolean
}

export interface ProviderCompatibleDevice {
  os: string
  brand: string
  name: string
}

export interface ProviderCoverageNetwork {
  name: string
  types: string[]
}

export interface ProviderCoverage {
  name: string
  code: string
  networks: ProviderCoverageNetwork[]
}

export interface IProviderAdapter {
  getAccessToken(): Promise<string>
  getPackages(): Promise<ProviderPackage[]>
  getPackageById(packageId: string): Promise<ProviderPackage>
  submitOrder(
    packageId: string,
    quantity: number,
    description?: string,
    iccid?: string
  ): Promise<ProviderOrder>
  getEsim(iccid: string): Promise<ProviderEsim>
  getEsimUsage(iccid: string): Promise<ProviderEsimUsage>
  getTopupPackages(iccid: string): Promise<ProviderTopupPackage[]>
  getCompatibleDevicesLite(): Promise<ProviderCompatibleDevice[]>
  submitTopupOrder(
    iccid: string,
    packageId: string,
    description?: string
  ): Promise<ProviderTopupOrder>
}

export interface ProviderPackage {
  provider_sku: string
  name: string
  description: string
  data_mb: number
  /** Airalo `data` field, e.g. "5 GB" */
  data_label: string | null
  validity_days: number
  price: number
  net_price: number
  currency: string
  plan_type: 'local' | 'regional' | 'global'
  flag_url: string | null
  region_name: string | null
  airalo_package_type: string
  metadata: Record<string, unknown>
  destinations: ProviderDestination[]
  coverage: ProviderCoverage[]
}

export interface ProviderDestination {
  country_code: string
  country_name: string
  country_flag_url?: string | null
}

export interface ProviderTopupPackage {
  id: string
  type: string
  price: number
  net_price: number
  amount_mb: number
  day: number
  title: string
  data_label: string
  is_unlimited: boolean
  voice: number | null
  text: number | null
  short_info: string | null
}

export interface ProviderTopupOrder {
  id: number
  code: string
  package_id: string
  currency: string
  quantity: number
  type: string
  package_name: string
  data: string
  price: number
  net_price: number
  validity: number
  voice: number | null
  text: number | null
  created_at: string
}

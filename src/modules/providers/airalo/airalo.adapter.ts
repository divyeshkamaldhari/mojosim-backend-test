/* eslint-disable sonarjs/cognitive-complexity, sonarjs/no-duplicate-string, @typescript-eslint/no-base-to-string */
import { env } from '../../../config/env'
import {
  AppError,
  NotFoundError,
  ProviderRateLimitError,
} from '../../../common/errors'
import { logWarn } from '../../../common/logger'
import { acquireAiraloRequestSlot } from './airalo-request-limiter'
import { normalizeProviderCountryCode } from '../../../utils/normalize-provider-country-code'
import type {
  IProviderAdapter,
  ProviderCompatibleDevice,
  ProviderCoverage,
  ProviderDestination,
  ProviderEsim,
  ProviderEsimUsage,
  ProviderOrder,
  ProviderPackage,
  ProviderTopupOrder,
  ProviderTopupPackage,
} from '../provider.interface'

type AiraloCredentials = {
  client_id: string
  client_secret: string
}

const normalizeBaseUrl = (baseUrl: string): string => {
  let end = baseUrl.length
  while (end > 0 && baseUrl.codePointAt(end - 1) === 47) {
    end -= 1
  }
  return baseUrl.slice(0, end)
}

const PACKAGES_SYNC_LIST_QUERY = new URLSearchParams({
  limit: '100',
  language: 'en',
  page: '1',
}).toString()

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }
  if (typeof value === 'string') {
    const n = Number.parseFloat(value)
    return Number.isNaN(n) ? fallback : n
  }
  return fallback
}

const parseAiraloDateTime = (value: unknown): Date | null => {
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }
  const isoLike = trimmed.includes('T')
    ? trimmed
    : `${trimmed.replace(' ', 'T')}Z`
  const ms = Date.parse(isoLike)
  return Number.isFinite(ms) ? new Date(ms) : null
}

const toInt = (value: unknown, fallback = 0): number => {
  const n = toNumber(value, Number.NaN)
  if (Number.isNaN(n)) {
    return fallback
  }
  return Math.trunc(n)
}

const parseTokenPayload = (
  json: unknown
): { access_token: string; expires_in: number } => {
  if (!json || typeof json !== 'object') {
    throw new AppError('Invalid Airalo token response', 502, 'PROVIDER_ERROR')
  }
  const root = json as Record<string, unknown>
  const inner =
    root.data !== undefined &&
    typeof root.data === 'object' &&
    root.data !== null
      ? (root.data as Record<string, unknown>)
      : root
  const access_token = inner.access_token
  const expires_in = inner.expires_in
  if (typeof access_token !== 'string' || access_token.length === 0) {
    throw new AppError('Invalid Airalo token response', 502, 'PROVIDER_ERROR')
  }
  let exp: number
  if (typeof expires_in === 'number') {
    exp = expires_in
  } else if (typeof expires_in === 'string') {
    exp = Number.parseInt(expires_in, 10)
  } else {
    exp = 3600
  }
  if (!Number.isFinite(exp) || exp <= 0) {
    return { access_token, expires_in: 3600 }
  }
  return { access_token, expires_in: exp }
}

const extractPackagesArray = (json: unknown): unknown[] => {
  if (Array.isArray(json)) {
    return json
  }
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>
    if (Array.isArray(o.data)) {
      return o.data
    }
    if (
      o.data &&
      typeof o.data === 'object' &&
      Array.isArray((o.data as { data?: unknown }).data)
    ) {
      return (o.data as { data: unknown[] }).data
    }
  }
  return []
}

const extractNextListPath = (json: unknown, baseUrl: string): string | null => {
  if (!json || typeof json !== 'object') {
    return null
  }
  const links = (json as Record<string, unknown>).links
  if (!links || typeof links !== 'object') {
    return null
  }
  const next = (links as Record<string, unknown>).next
  if (typeof next !== 'string' || next.length === 0) {
    return null
  }
  try {
    const base = new URL(baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl)
    const n = new URL(next)
    if (n.origin !== base.origin) {
      return null
    }
    const rest = n.pathname.slice(base.pathname.length) + n.search
    if (rest.length === 0 || rest === '/') {
      return null
    }
    return rest.startsWith('/') ? rest : `/${rest}`
  } catch {
    return null
  }
}

type PlanType = 'local' | 'regional' | 'global'

type SimPackageTriple = {
  dataRow: Record<string, unknown>
  operator: Record<string, unknown>
  pkg: Record<string, unknown>
}

function determinePlanType(countryCode: string, slug: string): PlanType {
  if (countryCode.length > 0) {
    return 'local'
  }
  if (slug.trim().toLowerCase() === 'world') {
    return 'global'
  }
  return 'regional'
}

function extractImageUrl(dataRow: Record<string, unknown>): string | null {
  const img = dataRow.image
  if (img && typeof img === 'object' && img !== null) {
    const url = (img as Record<string, unknown>).url
    if (typeof url === 'string' && url.length > 0) {
      return url
    }
  }
  return null
}

function buildCountriesFlagLookup(countries: unknown): Map<string, string> {
  const out = new Map<string, string>()
  if (!Array.isArray(countries)) {
    return out
  }
  for (const country of countries) {
    if (!country || typeof country !== 'object') {
      continue
    }
    const c = country as Record<string, unknown>
    const codeRaw = c.code ?? c.country_code ?? c.iso_code
    const code = normalizeProviderCountryCode(
      typeof codeRaw === 'string' ? codeRaw : null
    )
    if (code === null) {
      continue
    }

    const img = c.image
    if (img && typeof img === 'object' && img !== null) {
      const url = (img as Record<string, unknown>).url
      if (typeof url === 'string' && url.length > 0) {
        out.set(code, url)
      }
    }
  }
  return out
}

function mapCoverageToDestination(
  c: Record<string, unknown>
): ProviderDestination | null {
  const codeRaw = c.code ?? c.country_code ?? c.iso_code
  const nameRaw = c.name ?? c.title ?? c.country_name
  const country_code = normalizeProviderCountryCode(
    typeof codeRaw === 'string' ? codeRaw : null
  )
  if (country_code === null) {
    return null
  }
  const country_name =
    typeof nameRaw === 'string' && nameRaw.length > 0 ? nameRaw : country_code
  return { country_code, country_name }
}

function resolveCountryNameFromCode(code: string): string {
  try {
    const displayNames = new Intl.DisplayNames(['en'], { type: 'region' })
    const name = displayNames.of(code)
    return typeof name === 'string' && name.length > 0 ? name : code
  } catch {
    return code
  }
}

function buildCountriesNameLookup(countries: unknown): Map<string, string> {
  const out = new Map<string, string>()
  if (!Array.isArray(countries)) {
    return out
  }
  for (const country of countries) {
    if (!country || typeof country !== 'object') {
      continue
    }
    const c = country as Record<string, unknown>
    const codeRaw = c.code ?? c.country_code ?? c.iso_code
    const code = normalizeProviderCountryCode(
      typeof codeRaw === 'string' ? codeRaw : null
    )
    if (code === null) {
      continue
    }
    const nameRaw = c.name ?? c.title ?? c.country_name
    if (typeof nameRaw === 'string' && nameRaw.length > 0) {
      out.set(code, nameRaw)
    }
  }
  return out
}

function buildDestinations(
  planType: PlanType,
  dataRow: Record<string, unknown>,
  operator: Record<string, unknown>
): ProviderDestination[] {
  const countriesLookup = buildCountriesNameLookup(operator.countries)
  const countriesFlagLookup = buildCountriesFlagLookup(operator.countries)
  const coverages = operator.coverages
  const seenCoverageCodes = new Set<string>()
  const out: ProviderDestination[] = []

  if (Array.isArray(coverages)) {
    for (const cov of coverages) {
      if (!cov || typeof cov !== 'object') {
        continue
      }
      const dest = mapCoverageToDestination(cov as Record<string, unknown>)
      if (!dest || seenCoverageCodes.has(dest.country_code)) {
        continue
      }
      seenCoverageCodes.add(dest.country_code)
      const lookupName = countriesLookup.get(dest.country_code)
      const flagUrl = countriesFlagLookup.get(dest.country_code) ?? null
      const country_name =
        lookupName && lookupName.length > 0
          ? lookupName
          : resolveCountryNameFromCode(dest.country_code)
      out.push({
        country_code: dest.country_code,
        country_name,
        country_flag_url: flagUrl,
      })
    }
  }

  // Local plans can occasionally ship without coverages; keep a safe fallback.
  if (out.length === 0 && planType === 'local') {
    const ccRaw = dataRow.country_code
    const cc = normalizeProviderCountryCode(
      typeof ccRaw === 'string' ? ccRaw : null
    )
    if (cc !== null) {
      out.push({
        country_code: cc,
        country_name: countriesLookup.get(cc) ?? resolveCountryNameFromCode(cc),
        country_flag_url: countriesFlagLookup.get(cc) ?? null,
      })
    }
  }

  if (countriesLookup.size > 0 && seenCoverageCodes.size > 0) {
    for (const code of seenCoverageCodes) {
      if (!countriesLookup.has(code)) {
        logWarn(
          'Airalo destinations mismatch: coverage code missing in countries',
          {
            countryCode: code,
            planType,
          }
        )
      }
    }
    for (const code of countriesLookup.keys()) {
      if (!seenCoverageCodes.has(code)) {
        logWarn(
          'Airalo destinations mismatch: countries code missing in coverage',
          {
            countryCode: code,
            planType,
          }
        )
      }
    }
  }

  return out
}

function mapCoverageArray(
  operator: Record<string, unknown>
): ProviderCoverage[] {
  const rawCoverages = operator.coverages
  if (!Array.isArray(rawCoverages)) {
    return []
  }
  const out: ProviderCoverage[] = []
  const seen = new Set<string>()
  for (const rawCoverage of rawCoverages) {
    if (!rawCoverage || typeof rawCoverage !== 'object') {
      continue
    }
    const coverage = rawCoverage as Record<string, unknown>
    const codeRaw = coverage.code
    const nameRaw = coverage.name
    if (typeof codeRaw !== 'string' || typeof nameRaw !== 'string') {
      continue
    }
    const code = normalizeProviderCountryCode(codeRaw)
    const name = nameRaw.trim().slice(0, 255)
    if (code === null || !name) {
      continue
    }
    if (seen.has(code)) {
      continue
    }
    const rawNetworks = coverage.networks
    const networks: ProviderCoverage['networks'] = []
    if (Array.isArray(rawNetworks)) {
      for (const rawNetwork of rawNetworks) {
        if (!rawNetwork || typeof rawNetwork !== 'object') {
          continue
        }
        const network = rawNetwork as Record<string, unknown>
        const networkNameRaw = network.name
        if (typeof networkNameRaw !== 'string') {
          continue
        }
        const networkName = networkNameRaw.trim().slice(0, 255)
        if (!networkName) {
          continue
        }
        const rawTypes = network.types
        const types: string[] = []
        if (Array.isArray(rawTypes)) {
          for (const rawType of rawTypes) {
            if (typeof rawType !== 'string') {
              continue
            }
            const type = rawType.trim().slice(0, 50)
            if (type.length > 0) {
              types.push(type)
            }
          }
        }
        networks.push({ name: networkName, types })
      }
    }
    out.push({ name, code, networks })
    seen.add(code)
  }
  return out
}

const expandDataRowToImportPackages = (row: unknown): SimPackageTriple[] => {
  if (!row || typeof row !== 'object') {
    return []
  }
  const dataRow = row as Record<string, unknown>
  const ops = dataRow.operators
  if (!Array.isArray(ops)) {
    return []
  }
  const out: SimPackageTriple[] = []
  for (const op of ops) {
    if (!op || typeof op !== 'object') {
      continue
    }
    const operator = op as Record<string, unknown>
    const pkgs = operator.packages
    if (!Array.isArray(pkgs)) {
      continue
    }
    for (const pkg of pkgs) {
      if (!pkg || typeof pkg !== 'object') {
        continue
      }
      const p = pkg as Record<string, unknown>
      const t = p.type
      if (t !== 'sim') {
        continue
      }
      out.push({ dataRow, operator, pkg: p })
    }
  }
  return out
}

const extractSinglePackage = (
  json: unknown
): Record<string, unknown> | null => {
  if (!json || typeof json !== 'object') {
    return null
  }
  const o = json as Record<string, unknown>
  if (o.data !== undefined && typeof o.data === 'object' && o.data !== null) {
    return o.data as Record<string, unknown>
  }
  return o
}

const extractTopupPackagesArray = (json: unknown): unknown[] => {
  if (Array.isArray(json)) {
    return json
  }
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>
    const data = o.data
    if (Array.isArray(data)) {
      return data
    }
    if (data && typeof data === 'object' && data !== null) {
      const inner = data as Record<string, unknown>
      if (Array.isArray(inner.packages)) {
        return inner.packages
      }
      if (Array.isArray(inner.data)) {
        return inner.data
      }
    }
    if (Array.isArray(o.packages)) {
      return o.packages
    }
  }
  return []
}

const parseTopupPackageRecord = (row: unknown): ProviderTopupPackage | null => {
  if (!row || typeof row !== 'object') {
    return null
  }
  const p = row as Record<string, unknown>
  const idRaw = p.id ?? p.slug ?? p.package_id
  if (idRaw === undefined || idRaw === null) {
    return null
  }
  const id = String(idRaw)
  const type = typeof p.type === 'string' ? p.type : 'topup'
  const title = typeof p.title === 'string' && p.title.length > 0 ? p.title : id
  const dataLabel =
    typeof p.data === 'string' && p.data.length > 0 ? p.data : title
  return {
    id,
    type,
    price: toNumber(p.price, 0),
    net_price: toNumber(p.net_price, 0),
    amount_mb: toInt(p.amount, 0),
    day: toInt(p.day, 0),
    title,
    data_label: dataLabel,
    is_unlimited: Boolean(p.is_unlimited ?? p.unlimited),
    voice: p.voice === null || p.voice === undefined ? null : toInt(p.voice, 0),
    text: p.text === null || p.text === undefined ? null : toInt(p.text, 0),
    short_info:
      typeof p.short_info === 'string' && p.short_info.length > 0
        ? p.short_info
        : null,
  }
}

const parseTopupOrderResponse = (json: unknown): ProviderTopupOrder => {
  const data = extractSinglePackage(json)
  if (!data) {
    throw new AppError('Invalid Airalo topup response', 502, 'PROVIDER_ERROR')
  }
  const idRaw = data.id ?? data.order_id
  let id: number
  if (typeof idRaw === 'number' && Number.isFinite(idRaw)) {
    id = idRaw
  } else if (typeof idRaw === 'string') {
    id = Number.parseInt(idRaw, 10)
  } else {
    id = Number.NaN
  }
  if (!Number.isFinite(id)) {
    throw new AppError('Invalid Airalo topup response', 502, 'PROVIDER_ERROR')
  }
  const code =
    typeof data.code === 'string' && data.code.length > 0
      ? data.code
      : String(id)
  const packageRaw = data.package_id ?? data.packageId
  let package_id = ''
  if (typeof packageRaw === 'string') {
    package_id = packageRaw
  } else if (packageRaw !== undefined && packageRaw !== null) {
    package_id = String(packageRaw)
  }
  if (package_id.length === 0) {
    throw new AppError('Invalid Airalo topup response', 502, 'PROVIDER_ERROR')
  }
  const currency =
    typeof data.currency === 'string' && data.currency.length > 0
      ? data.currency
      : 'USD'
  let pkgName = package_id
  if (typeof data.package === 'string') {
    pkgName = data.package
  } else if (typeof data.package_name === 'string') {
    pkgName = data.package_name
  }
  let dataStr = ''
  if (typeof data.data === 'string') {
    dataStr = data.data
  } else if (typeof data.data_label === 'string') {
    dataStr = data.data_label
  }
  const createdRaw = data.created_at ?? data.createdAt
  const created_at =
    typeof createdRaw === 'string' && createdRaw.length > 0
      ? createdRaw
      : new Date().toISOString()
  return {
    id,
    code,
    package_id,
    currency,
    quantity: toInt(data.quantity, 1),
    type:
      typeof data.type === 'string' && data.type.length > 0
        ? data.type
        : 'topup',
    package_name: pkgName,
    data: dataStr,
    price: toNumber(data.price, 0),
    net_price: toNumber(data.net_price, 0),
    validity: toInt(data.validity ?? data.day, 0),
    voice:
      data.voice === null || data.voice === undefined
        ? null
        : toInt(data.voice, 0),
    text:
      data.text === null || data.text === undefined
        ? null
        : toInt(data.text, 0),
    created_at,
  }
}

const normalizeAiraloPackageType = (pkg: Record<string, unknown>): string => {
  const t = pkg.type
  if (typeof t !== 'string' || t.trim().length === 0) {
    return 'other'
  }
  return t.trim().toLowerCase().slice(0, 20)
}

const mapAiraloSimPackage = (
  dataRow: Record<string, unknown>,
  operator: Record<string, unknown>,
  pkg: Record<string, unknown>
): ProviderPackage => {
  const id = pkg.id ?? pkg.slug
  if (
    id === undefined ||
    id === null ||
    (typeof id !== 'string' && typeof id !== 'number')
  ) {
    throw new AppError('Invalid Airalo package item', 502, 'PROVIDER_ERROR')
  }
  const provider_sku = String(id)
  const title = pkg.title
  const short_info = pkg.short_info
  const name =
    typeof title === 'string' && title.length > 0 ? title : provider_sku
  const description =
    typeof short_info === 'string' && short_info.length > 0 ? short_info : name

  const data_mb = toInt(pkg.amount, 0)
  const dataHumanRaw = pkg.data
  const data_label =
    typeof dataHumanRaw === 'string' && dataHumanRaw.trim().length > 0
      ? dataHumanRaw.trim().slice(0, 255)
      : null
  const validity_days = toInt(pkg.day, 0)
  const price = toNumber(pkg.price, 0)
  const net_price = toNumber(pkg.net_price, 0)
  const currencyRaw = pkg.currency
  const currency =
    typeof currencyRaw === 'string' && currencyRaw.length > 0
      ? currencyRaw
      : 'USD'

  const airalo_package_type = normalizeAiraloPackageType(pkg)

  const ccRaw = dataRow.country_code
  const countryCode =
    normalizeProviderCountryCode(typeof ccRaw === 'string' ? ccRaw : null) ?? ''
  const dataTitle =
    typeof dataRow.title === 'string' ? dataRow.title.trim() : ''
  const slugRaw = dataRow.slug
  const slug = typeof slugRaw === 'string' ? slugRaw.trim() : ''

  const plan_type = determinePlanType(countryCode, slug)
  const destinations = buildDestinations(plan_type, dataRow, operator)
  const coverage = mapCoverageArray(operator)
  const flag_url = extractImageUrl(dataRow)

  let region_name: string | null = null
  if (plan_type === 'global') {
    region_name = 'Global'
  } else if (plan_type === 'regional' && dataTitle.length > 0) {
    region_name = dataTitle
  }

  const metadata: Record<string, unknown> = {
    operators: Array.isArray(dataRow.operators) ? dataRow.operators : [],
    operator,
    ...(typeof dataRow.slug === 'string' ? { country_slug: dataRow.slug } : {}),
    ...(dataTitle.length > 0 ? { country_title: dataTitle } : {}),
    ...(countryCode.length > 0 ? { country_code: countryCode } : {}),
  }

  return {
    provider_sku,
    name,
    description,
    data_mb,
    data_label,
    validity_days,
    price,
    net_price,
    currency,
    plan_type,
    flag_url,
    region_name,
    airalo_package_type,
    metadata,
    destinations,
    coverage,
  }
}

const parseCompatibleDevice = (
  row: unknown
): ProviderCompatibleDevice | null => {
  if (!row || typeof row !== 'object') {
    return null
  }
  const raw = row as Record<string, unknown>
  const os = typeof raw.os === 'string' ? raw.os.trim().toLowerCase() : ''
  const brand = typeof raw.brand === 'string' ? raw.brand.trim() : ''
  const name = typeof raw.name === 'string' ? raw.name.trim() : ''
  if (!os || !brand || !name) {
    return null
  }
  return {
    os: os.slice(0, 50),
    brand: brand.slice(0, 100),
    name: name.slice(0, 255),
  }
}

const extractCompatibleDeviceRows = (json: unknown): unknown[] => {
  if (!json || typeof json !== 'object') {
    return []
  }
  const root = json as Record<string, unknown>
  const data = root.data
  return Array.isArray(data) ? data : []
}

export type AiraloOrderLookupResult =
  | { kind: 'exact'; order: ProviderOrder; orders: ProviderOrder[] }
  | { kind: 'none' }
  | { kind: 'description_mismatch'; foundPackageIds: string[] }

const MIN_RATE_LIMIT_RETRY_MS = 1_000

const parseRetryAfterMs = (res: Response): number => {
  const header = res.headers.get('Retry-After')
  if (header === null) {
    return env.AIRALO_RATE_LIMIT_RETRY_MS
  }
  const seconds = Number.parseInt(header, 10)
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.max(MIN_RATE_LIMIT_RETRY_MS, seconds * 1000)
  }
  const dateMs = Date.parse(header)
  if (Number.isFinite(dateMs)) {
    return Math.max(MIN_RATE_LIMIT_RETRY_MS, dateMs - Date.now())
  }
  return env.AIRALO_RATE_LIMIT_RETRY_MS
}

const extractAiraloMessage = (json: unknown): string | null => {
  if (!json || typeof json !== 'object') {
    return null
  }
  const message = (json as { message?: unknown }).message
  return typeof message === 'string' && message.length > 0 ? message : null
}

const assertAiraloResponse = (
  res: Response,
  context: string,
  json: unknown,
  options?: { notFoundResource?: string }
): void => {
  if (res.status === 429) {
    const msg = extractAiraloMessage(json) ?? 'Too Many Attempts'
    throw new ProviderRateLimitError(msg, parseRetryAfterMs(res), 429)
  }
  if (res.status === 404 && options?.notFoundResource !== undefined) {
    throw new NotFoundError(options.notFoundResource)
  }
  if (!res.ok) {
    const msg =
      extractAiraloMessage(json) ?? `${context} failed (${res.status})`
    throw new AppError(msg, 502, 'PROVIDER_ERROR')
  }
}

export class AiraloAdapter implements IProviderAdapter {
  private readonly baseUrl: string

  private readonly clientId: string

  private readonly clientSecret: string

  private accessToken: string | null = null

  private accessTokenExpiresAt: Date | null = null

  constructor(apiBaseUrl: string, credentials: AiraloCredentials) {
    this.baseUrl = normalizeBaseUrl(apiBaseUrl)
    this.clientId = credentials.client_id
    this.clientSecret = credentials.client_secret
  }

  private async fetchWithAuth(
    path: string,
    init: RequestInit,
    retryOn401: boolean
  ): Promise<Response> {
    await acquireAiraloRequestSlot()
    const token = await this.getAccessToken()
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${token}`)
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    })
    if (res.status === 401 && retryOn401) {
      this.accessToken = null
      this.accessTokenExpiresAt = null
      await acquireAiraloRequestSlot()
      const token2 = await this.getAccessToken()
      const headers2 = new Headers(init.headers)
      headers2.set('Authorization', `Bearer ${token2}`)
      return fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers: headers2,
      })
    }
    return res
  }

  async getAccessToken(): Promise<string> {
    const now = new Date()
    if (
      this.accessToken &&
      this.accessTokenExpiresAt &&
      now.getTime() < this.accessTokenExpiresAt.getTime()
    ) {
      return this.accessToken
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials',
    })

    await acquireAiraloRequestSlot()
    const res = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: body.toString(),
    })

    const json: unknown = await res.json().catch(() => null)
    assertAiraloResponse(res, 'Airalo token request', json)
    const { access_token, expires_in } = parseTokenPayload(json)
    const bufferMs = 60_000
    this.accessToken = access_token
    this.accessTokenExpiresAt = new Date(
      Date.now() + expires_in * 1000 - bufferMs
    )
    return access_token
  }

  async getPackages(): Promise<ProviderPackage[]> {
    const { packages } = await this.getPackagesWithMetrics()
    return packages
  }

  async getPackagesWithMetrics(): Promise<{
    packages: ProviderPackage[]
    skipped: number
  }> {
    const packages: ProviderPackage[] = []
    let skipped = 0
    let nextPath: string | null = `/packages?${PACKAGES_SYNC_LIST_QUERY}`
    const seenPaths = new Set<string>()
    while (nextPath) {
      if (seenPaths.has(nextPath)) {
        break
      }
      seenPaths.add(nextPath)
      const res = await this.fetchWithAuth(
        nextPath,
        { method: 'GET', headers: { Accept: 'application/json' } },
        true
      )
      const json: unknown = await res.json().catch(() => null)
      assertAiraloResponse(res, 'Airalo packages request', json)
      const rows = extractPackagesArray(json)
      for (const row of rows) {
        const triples = expandDataRowToImportPackages(row)
        for (const { dataRow, operator, pkg } of triples) {
          try {
            packages.push(mapAiraloSimPackage(dataRow, operator, pkg))
          } catch {
            skipped += 1
          }
        }
      }
      nextPath = extractNextListPath(json, this.baseUrl)
      if (nextPath !== null) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, 150)
        })
      }
    }
    return { packages, skipped }
  }

  async getCompatibleDevicesLite(): Promise<ProviderCompatibleDevice[]> {
    const res = await this.fetchWithAuth(
      '/compatible-devices-lite',
      { method: 'GET', headers: { Accept: 'application/json' } },
      true
    )
    const json: unknown = await res.json().catch(() => null)
    assertAiraloResponse(res, 'Airalo compatible devices request', json)
    const rows = extractCompatibleDeviceRows(json)
    const out: ProviderCompatibleDevice[] = []
    const seen = new Set<string>()
    for (const row of rows) {
      const parsed = parseCompatibleDevice(row)
      if (!parsed) {
        continue
      }
      const key = `${parsed.os}|${parsed.brand.toLowerCase()}|${parsed.name.toLowerCase()}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      out.push(parsed)
    }
    return out
  }

  async getPackageById(packageId: string): Promise<ProviderPackage> {
    const path = `/packages/${encodeURIComponent(packageId)}`
    const res = await this.fetchWithAuth(
      path,
      { method: 'GET', headers: { Accept: 'application/json' } },
      true
    )
    const json: unknown = await res.json().catch(() => null)
    assertAiraloResponse(res, 'Airalo package request', json, {
      notFoundResource: 'Airalo package',
    })
    const raw = extractSinglePackage(json)
    if (!raw) {
      throw new AppError(
        'Invalid Airalo package response',
        502,
        'PROVIDER_ERROR'
      )
    }
    const triples = expandDataRowToImportPackages(raw)
    for (const { dataRow, operator, pkg } of triples) {
      const pid = pkg.id ?? pkg.slug
      if (pid !== undefined && pid !== null && String(pid) === packageId) {
        return mapAiraloSimPackage(dataRow, operator, pkg)
      }
    }
    throw new NotFoundError('Airalo package')
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return typeof value === 'object' && value !== null
      ? (value as Record<string, unknown>)
      : null
  }

  private pickStr(record: Record<string, unknown>, ...keys: string[]): string {
    for (const key of keys) {
      const v = record[key]
      if (typeof v === 'string' && v.length > 0) {
        return v
      }
    }
    return ''
  }

  private isValidLpaPayload(value: string): boolean {
    return value.startsWith('LPA:')
  }

  private pickQrPayload(sim: Record<string, unknown>): string {
    for (const key of ['qrcode', 'qr_code', 'lpa'] as const) {
      const v = sim[key]
      if (typeof v === 'string' && v.length > 0 && this.isValidLpaPayload(v)) {
        return v
      }
    }
    return ''
  }

  private pickStrNull(
    record: Record<string, unknown>,
    ...keys: string[]
  ): string | null {
    for (const key of keys) {
      const v = record[key]
      if (typeof v === 'string' && v.length > 0) {
        return v
      }
      if (v === null) {
        return null
      }
    }
    return null
  }

  private mapSimToProviderOrder(
    orderRoot: Record<string, unknown>,
    sim: Record<string, unknown>
  ): ProviderOrder {
    const orderIdRaw = orderRoot.id ?? orderRoot.code
    let providerOrderId = ''
    if (typeof orderIdRaw === 'number') {
      providerOrderId = String(orderIdRaw)
    } else if (typeof orderIdRaw === 'string') {
      providerOrderId = orderIdRaw
    }
    const iccid = this.pickStr(sim, 'iccid')
    const qrPayload = this.pickQrPayload(sim)
    const manual = this.pickStr(orderRoot, 'manual_installation')
    const qrHtml = this.pickStr(
      orderRoot,
      'qrcode_installation',
      'qr_installation'
    )
    const installParts = [manual, qrHtml].filter((s) => s.length > 0)
    const install_instructions =
      installParts.length > 0 ? installParts.join('\n\n') : ''
    const directApple = this.pickStrNull(
      sim,
      'direct_apple_installation_url',
      'direct_apple_url'
    )
    if (!providerOrderId || !iccid || !qrPayload) {
      throw new AppError('Invalid Airalo order response', 502, 'PROVIDER_ERROR')
    }
    return {
      provider_order_id: providerOrderId,
      iccid,
      qr_payload: qrPayload,
      install_instructions,
      direct_apple_url: directApple,
    }
  }

  private parseSubmitOrderSims(json: unknown): ProviderOrder[] {
    const root = this.asRecord(json)
    const data = root ? (this.asRecord(root.data) ?? root) : null
    if (!data) {
      throw new AppError('Invalid Airalo order response', 502, 'PROVIDER_ERROR')
    }
    const simsRaw = data.sims
    if (!Array.isArray(simsRaw) || simsRaw.length === 0) {
      throw new AppError('Invalid Airalo order response', 502, 'PROVIDER_ERROR')
    }
    const orders: ProviderOrder[] = []
    for (const simEntry of simsRaw) {
      const sim = this.asRecord(simEntry)
      if (!sim) {
        throw new AppError(
          'Invalid Airalo order response',
          502,
          'PROVIDER_ERROR'
        )
      }
      orders.push(this.mapSimToProviderOrder(data, sim))
    }
    return orders
  }

  private parseEsimUsageJson(json: unknown): ProviderEsimUsage {
    const root = this.asRecord(json)
    const data = root ? (this.asRecord(root.data) ?? root) : null
    if (!data) {
      throw new AppError(
        'Invalid Airalo eSIM usage response',
        502,
        'PROVIDER_ERROR'
      )
    }
    const statusRaw = this.pickStr(data, 'status')
    const status = statusRaw.length > 0 ? statusRaw : 'UNKNOWN'
    const isUnlimited = data.is_unlimited === true
    const expiredAt = parseAiraloDateTime(data.expired_at)

    if (isUnlimited) {
      return {
        status,
        data_used_mb: null,
        data_remaining_mb: null,
        expired_at: expiredAt,
        is_unlimited: true,
      }
    }

    const remaining = toInt(data.remaining, -1)
    const total = toInt(data.total, -1)
    const hasUsage =
      remaining >= 0 &&
      total >= 0 &&
      Number.isFinite(remaining) &&
      Number.isFinite(total)

    return {
      status,
      data_used_mb: hasUsage ? Math.max(0, total - remaining) : null,
      data_remaining_mb: hasUsage ? remaining : null,
      expired_at: expiredAt,
      is_unlimited: false,
    }
  }

  private parseEsimJson(json: unknown): ProviderEsim {
    const root = this.asRecord(json)
    const data = root ? (this.asRecord(root.data) ?? root) : null
    if (!data) {
      throw new AppError('Invalid Airalo eSIM response', 502, 'PROVIDER_ERROR')
    }
    const iccid = this.pickStr(data, 'iccid')
    const status = this.pickStr(data, 'status')
    const qr_payload = this.pickQrPayload(data)
    const usedRaw = data.data_used_mb ?? data.data_used ?? data.used_mb ?? null
    const remainingRaw =
      data.data_remaining_mb ?? data.data_remaining ?? data.remaining_mb ?? null
    if (!iccid || !qr_payload) {
      throw new AppError('Invalid Airalo eSIM response', 502, 'PROVIDER_ERROR')
    }
    return {
      iccid,
      status: status.length > 0 ? status : 'unknown',
      qr_payload,
      data_used_mb: usedRaw === null ? null : toInt(usedRaw, 0),
      data_remaining_mb: remainingRaw === null ? null : toInt(remainingRaw, 0),
    }
  }

  private responseToRecord(json: unknown): Record<string, unknown> {
    if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
      return json as Record<string, unknown>
    }
    return { value: String(json) }
  }

  private extractOrderListRows(json: unknown): Record<string, unknown>[] {
    if (!json || typeof json !== 'object') {
      return []
    }
    const root = json as Record<string, unknown>
    const data = root.data
    if (!Array.isArray(data)) {
      return []
    }
    const rows: Record<string, unknown>[] = []
    for (const row of data) {
      if (row && typeof row === 'object' && !Array.isArray(row)) {
        rows.push(row as Record<string, unknown>)
      }
    }
    return rows
  }

  private parseOrderListRowToProviderOrders(
    row: Record<string, unknown>
  ): ProviderOrder[] {
    const sims = row.sims
    if (!Array.isArray(sims) || sims.length === 0) {
      return []
    }
    const orders: ProviderOrder[] = []
    for (const simEntry of sims) {
      const sim = this.asRecord(simEntry)
      if (!sim) {
        continue
      }
      try {
        orders.push(this.mapSimToProviderOrder(row, sim))
      } catch {
        continue
      }
    }
    return orders
  }

  async submitOrderWithRaw(
    packageId: string,
    quantity: number,
    description?: string,
    iccid?: string
  ): Promise<{
    order: ProviderOrder
    orders: ProviderOrder[]
    raw: Record<string, unknown>
  }> {
    const body: Record<string, unknown> = {
      package_id: packageId,
      quantity,
    }
    if (description !== undefined && description.length > 0) {
      body.description = description
    }
    if (iccid !== undefined && iccid.length > 0) {
      body.iccid = iccid
    }
    const res = await this.fetchWithAuth(
      '/orders',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      true
    )
    const json: unknown = await res.json().catch(() => null)
    assertAiraloResponse(res, 'Airalo order submit', json)
    const orders = this.parseSubmitOrderSims(json)
    return { order: orders[0], orders, raw: this.responseToRecord(json) }
  }

  async findOrderMatchResult(
    description: string,
    packageId: string
  ): Promise<AiraloOrderLookupResult> {
    const normalizedPackageId = String(packageId)
    const query = new URLSearchParams({
      include: 'sims,status',
      limit: '50',
      'filter[description]': description,
    })
    const res = await this.fetchWithAuth(
      `/orders?${query.toString()}`,
      { method: 'GET', headers: { Accept: 'application/json' } },
      true
    )
    const json: unknown = await res.json().catch(() => null)
    assertAiraloResponse(res, 'Airalo order list request', json)

    const rows = this.extractOrderListRows(json)
    const foundPackageIds: string[] = []

    for (const row of rows) {
      const rowDescription =
        typeof row.description === 'string' ? row.description : null
      const rowPackageId =
        row.package_id != null ? String(row.package_id) : null
      const rowType = typeof row.type === 'string' ? row.type : null

      if (rowDescription !== description) {
        continue
      }

      if (rowPackageId === normalizedPackageId && rowType === 'sim') {
        const providerOrders = this.parseOrderListRowToProviderOrders(row)
        if (providerOrders.length > 0) {
          return {
            kind: 'exact',
            order: providerOrders[0],
            orders: providerOrders,
          }
        }
        logWarn('Airalo order row matched filters but failed to parse', {
          description,
          packageId: normalizedPackageId,
        })
        continue
      }

      if (rowPackageId !== null && !foundPackageIds.includes(rowPackageId)) {
        foundPackageIds.push(rowPackageId)
      }
    }

    if (foundPackageIds.length > 0) {
      return { kind: 'description_mismatch', foundPackageIds }
    }

    return { kind: 'none' }
  }

  async findSubmittedOrderByDescription(
    description: string,
    packageId: string
  ): Promise<ProviderOrder | null> {
    const result = await this.findSubmittedOrdersByDescription(
      description,
      packageId
    )
    return result[0] ?? null
  }

  async findSubmittedOrdersByDescription(
    description: string,
    packageId: string
  ): Promise<ProviderOrder[]> {
    const result = await this.findOrderMatchResult(description, packageId)
    if (result.kind === 'exact') {
      return result.orders
    }
    return []
  }

  async submitOrder(
    packageId: string,
    quantity: number,
    description?: string,
    iccid?: string
  ): Promise<ProviderOrder> {
    const { order } = await this.submitOrderWithRaw(
      packageId,
      quantity,
      description,
      iccid
    )
    return order
  }

  async getEsim(iccid: string): Promise<ProviderEsim> {
    const path = `/sims/${encodeURIComponent(iccid)}`
    const res = await this.fetchWithAuth(
      path,
      { method: 'GET', headers: { Accept: 'application/json' } },
      true
    )
    const json: unknown = await res.json().catch(() => null)
    assertAiraloResponse(res, 'Airalo eSIM request', json, {
      notFoundResource: 'Airalo eSIM',
    })
    return this.parseEsimJson(json)
  }

  async getEsimUsage(iccid: string): Promise<ProviderEsimUsage> {
    const path = `/sims/${encodeURIComponent(iccid)}/usage`
    const res = await this.fetchWithAuth(
      path,
      { method: 'GET', headers: { Accept: 'application/json' } },
      true
    )
    const json: unknown = await res.json().catch(() => null)
    assertAiraloResponse(res, 'Airalo eSIM usage request', json, {
      notFoundResource: 'Airalo eSIM usage',
    })
    return this.parseEsimUsageJson(json)
  }

  async getTopupPackages(iccid: string): Promise<ProviderTopupPackage[]> {
    const path = `/sims/${encodeURIComponent(iccid)}/topups`
    const res = await this.fetchWithAuth(
      path,
      { method: 'GET', headers: { Accept: 'application/json' } },
      true
    )
    const json: unknown = await res.json().catch(() => null)
    assertAiraloResponse(res, 'Airalo topup list request', json, {
      notFoundResource: 'Airalo top-up packages',
    })
    const rows = extractTopupPackagesArray(json)
    const out: ProviderTopupPackage[] = []
    for (const row of rows) {
      const pkg = parseTopupPackageRecord(row)
      if (pkg !== null) {
        out.push(pkg)
      }
    }
    return out
  }

  async submitTopupOrder(
    iccid: string,
    packageId: string,
    description?: string
  ): Promise<ProviderTopupOrder> {
    const body = new URLSearchParams()
    body.set('package_id', packageId)
    body.set('iccid', iccid)
    if (description !== undefined && description.length > 0) {
      body.set('description', description)
    }
    const res = await this.fetchWithAuth(
      '/orders/topups',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      },
      true
    )
    const json: unknown = await res.json().catch(() => null)
    assertAiraloResponse(res, 'Airalo topup order submit', json)
    return parseTopupOrderResponse(json)
  }

  async requestRefund(input: {
    iccids: string[]
    reason: string
    notes?: string | null
    email?: string | null
  }): Promise<{ refundId: string; createdAt: string }> {
    const form = new FormData()
    for (const iccid of input.iccids) {
      form.append('iccids[]', iccid)
    }
    form.append('reason', input.reason)
    const notes =
      input.notes === null || input.notes === undefined
        ? ''
        : input.notes.trim()
    if (notes.length > 0) {
      form.append('notes', notes)
    }
    const email =
      input.email === null || input.email === undefined
        ? ''
        : input.email.trim()
    if (email.length > 0) {
      form.append('email', email)
    }

    const res = await this.fetchWithAuth(
      '/refund',
      {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: form,
      },
      true
    )
    const json: unknown = await res.json().catch(() => null)
    if (res.status === 429) {
      const msg = extractAiraloMessage(json) ?? 'Too Many Attempts'
      throw new ProviderRateLimitError(msg, parseRetryAfterMs(res), 429)
    }
    if (res.status !== 202 && !res.ok) {
      const msg =
        extractAiraloMessage(json) ??
        `Airalo refund request failed (${res.status})`
      throw new AppError(msg, 502, 'PROVIDER_ERROR')
    }

    if (!json || typeof json !== 'object') {
      throw new AppError(
        'Invalid Airalo refund response',
        502,
        'PROVIDER_ERROR'
      )
    }
    const root = json as Record<string, unknown>
    const data =
      root.data !== undefined &&
      typeof root.data === 'object' &&
      root.data !== null
        ? (root.data as Record<string, unknown>)
        : null
    if (data === null) {
      const metaMessage =
        root.meta !== undefined &&
        typeof root.meta === 'object' &&
        root.meta !== null &&
        typeof (root.meta as Record<string, unknown>).message === 'string'
          ? String((root.meta as Record<string, unknown>).message)
          : 'Airalo refund request was not accepted'
      throw new AppError(metaMessage, 422, 'PROVIDER_ERROR')
    }
    const refundIdRaw = data.refund_id
    const refundId =
      typeof refundIdRaw === 'string'
        ? refundIdRaw
        : typeof refundIdRaw === 'number'
          ? String(refundIdRaw)
          : ''
    if (refundId.length === 0) {
      throw new AppError(
        'Invalid Airalo refund response',
        502,
        'PROVIDER_ERROR'
      )
    }
    const createdAtRaw = data.created_at
    const createdAt =
      typeof createdAtRaw === 'string' ? createdAtRaw : new Date().toISOString()
    return { refundId, createdAt }
  }
}

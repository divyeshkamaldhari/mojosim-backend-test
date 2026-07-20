import { env } from '../config/env'
import {
  getTrustpilotBusinessUnitSummary,
  type TrustpilotBusinessUnitSummary,
} from '../modules/trustpilot'

type CacheEntry = {
  expiresAt: number
  value: TrustpilotBusinessUnitSummary | null
}

let summaryCache: CacheEntry | null = null

const getCacheTtlMs = (): number => env.TRUSTPILOT_CACHE_TTL_MINUTES * 60 * 1000

export class TrustpilotSummaryService {
  async getPublicSummary(): Promise<TrustpilotBusinessUnitSummary | null> {
    const now = Date.now()

    if (summaryCache && summaryCache.expiresAt > now) {
      return summaryCache.value
    }

    const summary = await getTrustpilotBusinessUnitSummary(
      env.TRUSTPILOT_DOMAIN
    )

    summaryCache = {
      value: summary,
      expiresAt: now + getCacheTtlMs(),
    }

    return summary
  }
}

export const trustpilotSummaryService = new TrustpilotSummaryService()

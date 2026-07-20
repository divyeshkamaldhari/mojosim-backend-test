import { env } from '../../config/env'
import { logError } from '../../common/logger'
import type { TrustpilotBusinessUnitResponse } from './trustpilot.types'

const TRUSTPILOT_API_BASE = 'https://api.trustpilot.com/v1'

export const findTrustpilotBusinessUnit = async (
  domain: string
): Promise<TrustpilotBusinessUnitResponse | null> => {
  if (!env.TRUSTPILOT_API_KEY) {
    return null
  }

  const url = new URL(`${TRUSTPILOT_API_BASE}/business-units/find`)
  url.searchParams.set('name', domain)

  try {
    const response = await fetch(url.toString(), {
      headers: {
        apikey: env.TRUSTPILOT_API_KEY,
      },
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      logError('Trustpilot API request failed', {
        status: response.status,
        domain,
      })
      return null
    }

    return (await response.json()) as TrustpilotBusinessUnitResponse
  } catch (error) {
    logError('Trustpilot API request error', {
      domain,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return null
  }
}

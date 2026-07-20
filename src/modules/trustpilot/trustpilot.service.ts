import { findTrustpilotBusinessUnit } from './trustpilot.client'
import type { TrustpilotBusinessUnitSummary } from './trustpilot.types'

const mapBusinessUnit = (
  data: NonNullable<Awaited<ReturnType<typeof findTrustpilotBusinessUnit>>>,
  domain: string
): TrustpilotBusinessUnitSummary => ({
  businessUnitId: data.id,
  displayName: data.displayName,
  trustScore: data.score.trustScore,
  stars: data.score.stars,
  totalReviews: data.numberOfReviews.total,
  profileUrl: `https://www.trustpilot.com/review/${domain}`,
})

export const getTrustpilotBusinessUnitSummary = async (
  domain: string
): Promise<TrustpilotBusinessUnitSummary | null> => {
  const data = await findTrustpilotBusinessUnit(domain)
  if (!data) {
    return null
  }

  return mapBusinessUnit(data, domain)
}

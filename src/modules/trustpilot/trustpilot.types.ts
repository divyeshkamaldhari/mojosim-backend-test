export type TrustpilotBusinessUnitResponse = {
  id: string
  displayName: string
  websiteUrl: string
  numberOfReviews: {
    total: number
  }
  score: {
    trustScore: number
    stars: number
  }
}

export type TrustpilotBusinessUnitSummary = {
  businessUnitId: string
  displayName: string
  trustScore: number
  stars: number
  totalReviews: number
  profileUrl: string
}

import { resolvePlanDestinationLabel } from './admin-plan-display.util'
import { lineDescriptionFromBillingSnapshot } from './generate-invoice-pdf'

export type InvoicePdfLineItem = {
  planName: string
  destinationLabel: string | null
  flagUrl: string | null
}

type InvoicePlanContext = {
  planType: 'local' | 'regional' | 'global'
  regionName: string | null
  flagUrl: string | null
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const readString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed === '' ? null : trimmed
}

const readPlanType = (value: unknown): 'local' | 'regional' | 'global' => {
  if (value === 'regional' || value === 'global') {
    return value
  }

  return 'local'
}

export const resolveInvoicePdfLineItem = (input: {
  billingSnapshot: unknown
  plan?: InvoicePlanContext | null
  countryName?: string | null
}): InvoicePdfLineItem => {
  const planName = lineDescriptionFromBillingSnapshot(input.billingSnapshot)
  const snapshot = isRecord(input.billingSnapshot)
    ? input.billingSnapshot
    : null

  const flagUrl =
    (snapshot ? readString(snapshot.flag_url) : null) ??
    input.plan?.flagUrl ??
    null

  const planType = input.plan?.planType ?? readPlanType(snapshot?.plan_type)
  const regionName =
    input.plan?.regionName ??
    (snapshot ? readString(snapshot.region_name) : null)

  const destinationLabel = resolvePlanDestinationLabel(
    { planType, regionName },
    input.countryName ?? null
  )

  return {
    planName,
    destinationLabel,
    flagUrl,
  }
}

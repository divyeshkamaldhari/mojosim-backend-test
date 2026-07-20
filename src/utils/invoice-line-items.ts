import { getBillingSnapshotDiscountAmount } from './billing-snapshot.util'
import {
  resolveInvoicePdfLineItem,
  type InvoicePdfLineItem,
} from './invoice-line-item-display'

export type AdminLineItem = {
  name: string
  amount: string
  currency: string
  flag_url?: string | null
  destination_label?: string | null
}

type BuildAdminLineItemsContext = {
  plan?: {
    planType: 'local' | 'regional' | 'global'
    regionName: string | null
    flagUrl: string | null
  } | null
  countryName?: string | null
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

const readQuantity = (billingSnapshot: Record<string, unknown>): number => {
  const raw = billingSnapshot.quantity
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return 1
  }
  const quantity = Math.trunc(raw)
  return quantity >= 1 ? quantity : 1
}

export const buildAdminLineItems = (
  billingSnapshot: unknown,
  fallback: {
    amount: string
    currency: string
    planName?: string | null
  },
  context?: BuildAdminLineItemsContext
): AdminLineItem[] => {
  const unitPrice = isRecord(billingSnapshot)
    ? readString(billingSnapshot.unit_price)
    : null
  const quantity = isRecord(billingSnapshot) ? readQuantity(billingSnapshot) : 1
  const amount =
    unitPrice !== null
      ? (Number.parseFloat(unitPrice) * quantity).toFixed(2)
      : fallback.amount
  const currency =
    (isRecord(billingSnapshot) ? readString(billingSnapshot.currency) : null) ??
    fallback.currency

  let display: InvoicePdfLineItem = resolveInvoicePdfLineItem({
    billingSnapshot,
    plan: context?.plan ?? null,
    countryName: context?.countryName ?? null,
  })

  if (display.planName === 'eSIM plan' && isRecord(billingSnapshot)) {
    const fallbackName =
      readString(billingSnapshot.title) ??
      readString(billingSnapshot.plan_name) ??
      fallback.planName ??
      display.planName
    display = { ...display, planName: fallbackName }
  } else if (display.planName === 'eSIM plan' && fallback.planName) {
    display = { ...display, planName: fallback.planName }
  }

  let name = display.planName

  if (quantity > 1) {
    name = `${name} (${quantity} eSIMs)`
  }

  const items: AdminLineItem[] = [
    {
      name,
      amount,
      currency,
      flag_url: display.flagUrl,
      destination_label: display.destinationLabel,
    },
  ]

  const discountAmount = isRecord(billingSnapshot)
    ? getBillingSnapshotDiscountAmount(billingSnapshot)
    : null
  if (discountAmount !== null && Number.parseFloat(discountAmount) > 0) {
    items.push({
      name: 'Newsletter discount',
      amount: `-${discountAmount}`,
      currency,
    })
  }

  return items
}

import type { Order } from '../models/order'
import type { Plan } from '../models/plan'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const resolveProvisioningPackageId = (
  order: Order,
  plan: Plan
): string => {
  if (isRecord(order.billingSnapshot)) {
    const sku = order.billingSnapshot.provider_sku
    if (typeof sku === 'string' && sku.length > 0) {
      return sku
    }
  }
  return plan.providerSku
}

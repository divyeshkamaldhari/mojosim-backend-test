import type { Order } from '../models/order'
import type { ProvisioningJob } from '../models/provisioning-job'

const STALE_PROCESSING_MINUTES = 15

type OrderRefundStatus = Pick<Order, 'status' | 'paymentStatus'>

const isStaleProcessingJob = (updatedAt: Date): boolean =>
  Date.now() - updatedAt.getTime() >= STALE_PROCESSING_MINUTES * 60 * 1000

export const isOrderRefunded = (order: OrderRefundStatus): boolean =>
  order.status === 'refunded' || order.paymentStatus === 'refunded'

export const isOrderClosedForProvisioning = (
  order: OrderRefundStatus
): boolean => isOrderRefunded(order) || order.status === 'cancelled'

export const isProvisioningJobInFlight = (job: ProvisioningJob): boolean => {
  if (job.status === 'queued') {
    return true
  }
  if (job.status === 'processing' && !isStaleProcessingJob(job.updatedAt)) {
    return true
  }
  return false
}

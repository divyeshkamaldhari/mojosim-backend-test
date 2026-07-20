import cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'

import { logger } from '../common/logger'
import { OrderRepository } from '../repositories/order.repository'
import { orderService } from '../services/order.service'

const orderRepository = new OrderRepository()

const STALE_MINUTES = 15
const BATCH_SIZE = 50

export const registerPaymentReconciliationScheduler = (): ScheduledTask => {
  return cron.schedule(
    '*/5 * * * *',
    () => {
      void (async () => {
        try {
          const staleBefore = new Date(Date.now() - STALE_MINUTES * 60 * 1000)
          const orders =
            await orderRepository.findPendingForPaymentReconciliation(
              staleBefore,
              BATCH_SIZE
            )
          if (orders.length === 0) {
            return
          }

          logger.info('Payment reconciliation scan started', {
            count: orders.length,
          })

          for (const o of orders) {
            try {
              await orderService.reconcilePaymentForOrder(o)
            } catch (error) {
              logger.warn('Payment reconciliation order attempt failed', {
                orderId: o.id,
                error: error instanceof Error ? error.message : String(error),
              })
            }
          }
        } catch (error) {
          logger.error('Payment reconciliation cron failed', {
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })()
    },
    { timezone: 'UTC' }
  )
}

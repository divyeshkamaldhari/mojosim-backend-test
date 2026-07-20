import cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'

import { logger } from '../common/logger'
import { env } from '../config/env'
import { redisConnection } from '../modules/redis'
import { usageSyncQueue } from '../queues/usage-sync.queue'
import { schedulerOperationsAlertService } from '../services/scheduler-operations-alert.service'

export const registerUsageSyncScheduler = (): ScheduledTask => {
  return cron.schedule(
    '0 * * * *',
    () => {
      void (async () => {
        try {
          if (redisConnection.status !== 'ready') {
            logger.warn('Usage sync cron skipped — Redis is not ready', {
              redisStatus: redisConnection.status,
            })
            await schedulerOperationsAlertService.reportIssue({
              scheduler: 'usage_sync',
              issue: 'skipped',
              reason: 'Redis is not ready',
              retryEndpoint: 'POST /api/v1/esims/{id}/refresh-usage',
              context: { redisStatus: redisConnection.status },
            })
            return
          }
          logger.info('Scheduling usage sync job', {})
          await usageSyncQueue.add(
            'sync-usage',
            {
              limit: env.USAGE_SYNC_BATCH_LIMIT,
              minIntervalMinutes: env.USAGE_SYNC_MIN_INTERVAL_MINUTES,
            },
            {
              jobId: 'usage-sync-bulk',
              removeOnComplete: true,
              removeOnFail: false,
            }
          )
        } catch (error) {
          logger.error('Failed to enqueue usage sync job', {
            error: error instanceof Error ? error.message : String(error),
          })
          await schedulerOperationsAlertService.reportIssue({
            scheduler: 'usage_sync',
            issue: 'enqueue_failed',
            reason: error instanceof Error ? error.message : String(error),
            retryEndpoint: 'POST /api/v1/esims/{id}/refresh-usage',
            context: {},
          })
        }
      })()
    },
    { timezone: 'UTC' }
  )
}

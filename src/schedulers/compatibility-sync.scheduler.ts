import cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'

import { logger } from '../common/logger'
import { redisConnection } from '../modules/redis'
import { compatibilitySyncQueue } from '../queues/compatibility-sync.queue'
import { ProviderRepository } from '../repositories/provider.repository'
import { schedulerOperationsAlertService } from '../services/scheduler-operations-alert.service'

const providerRepository = new ProviderRepository()

const COMPATIBILITY_SYNC_RETRY_ENDPOINT =
  'POST /api/v1/admin/compatibility/sync'

export const registerCompatibilitySyncScheduler = (): ScheduledTask => {
  return cron.schedule(
    '30 */6 * * *',
    () => {
      void (async () => {
        try {
          if (redisConnection.status !== 'ready') {
            logger.warn(
              'Compatibility sync cron skipped — Redis is not ready',
              {
                redisStatus: redisConnection.status,
              }
            )
            await schedulerOperationsAlertService.reportIssue({
              scheduler: 'compatibility_sync',
              issue: 'skipped',
              reason: 'Redis is not ready',
              retryEndpoint: COMPATIBILITY_SYNC_RETRY_ENDPOINT,
              context: { redisStatus: redisConnection.status },
            })
            return
          }
          const provider = await providerRepository.findFirstActiveProvider()
          if (!provider) {
            logger.warn(
              'Compatibility sync cron skipped — no active provider',
              {}
            )
            await schedulerOperationsAlertService.reportIssue({
              scheduler: 'compatibility_sync',
              issue: 'skipped',
              reason: 'No active provider',
              retryEndpoint: COMPATIBILITY_SYNC_RETRY_ENDPOINT,
              context: {},
            })
            return
          }
          logger.info('Scheduling compatibility sync job', {
            providerId: provider.id,
          })
          await compatibilitySyncQueue.add(
            'sync-compatibility',
            { provider_id: provider.id },
            { removeOnComplete: true, removeOnFail: false }
          )
        } catch (error) {
          logger.error('Failed to enqueue compatibility sync job', {
            error: error instanceof Error ? error.message : String(error),
          })
          await schedulerOperationsAlertService.reportIssue({
            scheduler: 'compatibility_sync',
            issue: 'enqueue_failed',
            reason: error instanceof Error ? error.message : String(error),
            retryEndpoint: COMPATIBILITY_SYNC_RETRY_ENDPOINT,
            context: {},
          })
        }
      })()
    },
    { timezone: 'UTC' }
  )
}

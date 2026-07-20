import cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'

import { env } from '../config/env'
import { logger } from '../common/logger'
import { redisConnection } from '../modules/redis'
import { planSyncQueue } from '../queues/plan-sync.queue'
import { provisioningQueue } from '../queues/provisioning.queue'
import { ProviderRepository } from '../repositories/provider.repository'
import { schedulerOperationsAlertService } from '../services/scheduler-operations-alert.service'

const providerRepository = new ProviderRepository()

const PLAN_SYNC_RETRY_ENDPOINT = 'POST /api/v1/admin/plans/sync'

export const registerPlanSyncScheduler = (): ScheduledTask => {
  return cron.schedule(
    '0 */6 * * *',
    () => {
      void (async () => {
        try {
          if (redisConnection.status !== 'ready') {
            logger.warn('Plan sync cron skipped — Redis is not ready', {
              redisStatus: redisConnection.status,
            })
            await schedulerOperationsAlertService.reportIssue({
              scheduler: 'plan_sync',
              issue: 'skipped',
              reason: 'Redis is not ready',
              retryEndpoint: PLAN_SYNC_RETRY_ENDPOINT,
              context: { redisStatus: redisConnection.status },
            })
            return
          }
          const provisioningCounts = await provisioningQueue.getJobCounts(
            'active',
            'waiting',
            'delayed'
          )
          const provisioningLoad =
            provisioningCounts.active +
            provisioningCounts.waiting +
            provisioningCounts.delayed
          if (provisioningLoad >= env.PLAN_SYNC_PROVISIONING_QUEUE_THRESHOLD) {
            logger.warn('Plan sync cron skipped — provisioning queue busy', {
              provisioningLoad,
              threshold: env.PLAN_SYNC_PROVISIONING_QUEUE_THRESHOLD,
            })
            await schedulerOperationsAlertService.reportIssue({
              scheduler: 'plan_sync',
              issue: 'skipped',
              reason: 'Provisioning queue busy',
              retryEndpoint: PLAN_SYNC_RETRY_ENDPOINT,
              context: { provisioningLoad },
            })
            return
          }

          const provider = await providerRepository.findFirstActiveProvider()
          if (!provider) {
            logger.warn('Plan sync cron skipped — no active provider', {})
            await schedulerOperationsAlertService.reportIssue({
              scheduler: 'plan_sync',
              issue: 'skipped',
              reason: 'No active provider',
              retryEndpoint: PLAN_SYNC_RETRY_ENDPOINT,
              context: {},
            })
            return
          }
          logger.info('Scheduling plan sync job', { providerId: provider.id })
          await planSyncQueue.add(
            'sync-plans',
            { provider_id: provider.id },
            { removeOnComplete: true, removeOnFail: false }
          )
        } catch (error) {
          logger.error('Failed to enqueue plan sync job', {
            error: error instanceof Error ? error.message : String(error),
          })
          await schedulerOperationsAlertService.reportIssue({
            scheduler: 'plan_sync',
            issue: 'enqueue_failed',
            reason: error instanceof Error ? error.message : String(error),
            retryEndpoint: PLAN_SYNC_RETRY_ENDPOINT,
            context: {},
          })
        }
      })()
    },
    { timezone: 'UTC' }
  )
}

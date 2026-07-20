import cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'

import { logger } from '../common/logger'
import { redisConnection } from '../modules/redis'
import { provisioningQueue } from '../queues/provisioning.queue'
import { getProvisioningQueueJobOptions } from '../queues/provisioning-queue-options'
import { ProvisioningJobRepository } from '../repositories/provisioning-job.repository'
import { OrderRepository } from '../repositories/order.repository'
import { schedulerOperationsAlertService } from '../services/scheduler-operations-alert.service'
import { isOrderClosedForProvisioning } from '../utils/order-refund-guards'

import type { ProvisioningJob } from '../models/provisioning-job'

const provisioningJobRepository = new ProvisioningJobRepository()
const orderRepository = new OrderRepository()
const RETRY_BATCH_SIZE = 50

const isRateLimitCooldownActive = (
  lastError: string | null,
  nextRetryAt: Date | null
): boolean => {
  if (lastError === null || nextRetryAt === null) {
    return false
  }
  if (!lastError.includes('PROVIDER_RATE_LIMITED')) {
    return false
  }
  return nextRetryAt.getTime() > Date.now()
}

const shouldSkipRetryJob = async (job: ProvisioningJob): Promise<boolean> => {
  if (isRateLimitCooldownActive(job.lastError, job.nextRetryAt)) {
    return true
  }
  const order = await orderRepository.findById(job.orderId)
  return order !== null && isOrderClosedForProvisioning(order)
}

const enqueueProvisioningRetry = async (
  job: ProvisioningJob,
  queueOptions: ReturnType<typeof getProvisioningQueueJobOptions>
): Promise<void> => {
  await provisioningJobRepository.updateById(job.id, {
    status: 'queued',
  })

  try {
    await provisioningQueue.add(
      'provision-esim',
      { jobId: job.id },
      {
        jobId: `provision-retry-${job.id}-${Date.now()}`,
        ...queueOptions,
      }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown queue error'
    logger.warn('Failed to enqueue provisioning retry job', {
      provisioningJobId: job.id,
      orderId: job.orderId,
      error: message,
    })
  }
}

const runProvisioningRetryBatch = async (): Promise<void> => {
  if (redisConnection.status !== 'ready') {
    logger.warn('Provisioning retry cron skipped — Redis is not ready', {
      redisStatus: redisConnection.status,
    })
    return
  }

  const dueJobs =
    await provisioningJobRepository.findDueForRetry(RETRY_BATCH_SIZE)
  if (dueJobs.length === 0) {
    return
  }

  const queueOptions = getProvisioningQueueJobOptions()

  for (const job of dueJobs) {
    if (await shouldSkipRetryJob(job)) {
      continue
    }
    await enqueueProvisioningRetry(job, queueOptions)
  }
}

export const registerProvisioningRetryScheduler = (): ScheduledTask => {
  return cron.schedule(
    '*/2 * * * *',
    () => {
      void (async () => {
        try {
          await runProvisioningRetryBatch()
        } catch (error) {
          logger.error('Provisioning retry cron execution failed', {
            error: error instanceof Error ? error.message : String(error),
          })
          await schedulerOperationsAlertService.reportIssue({
            scheduler: 'provisioning_retry',
            issue: 'enqueue_failed',
            reason: error instanceof Error ? error.message : String(error),
            retryEndpoint: 'POST /api/v1/admin/provisioning-jobs/{id}/retry',
            context: {},
          })
        }
      })()
    },
    { timezone: 'UTC' }
  )
}

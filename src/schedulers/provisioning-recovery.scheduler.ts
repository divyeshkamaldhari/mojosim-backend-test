import cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'

import { logger } from '../common/logger'
import { redisConnection } from '../modules/redis'
import type { ProvisioningJob } from '../models/provisioning-job'
import { provisioningQueue } from '../queues/provisioning.queue'
import { getProvisioningQueueJobOptions } from '../queues/provisioning-queue-options'
import { ProvisioningJobRepository } from '../repositories/provisioning-job.repository'
import { OrderRepository } from '../repositories/order.repository'
import { provisioningTerminalFailureService } from '../services/provisioning-terminal-failure.service'
import { schedulerOperationsAlertService } from '../services/scheduler-operations-alert.service'
import { isOrderClosedForProvisioning } from '../utils/order-refund-guards'

const provisioningJobRepository = new ProvisioningJobRepository()
const orderRepository = new OrderRepository()

const STALE_PROCESSING_MINUTES = 15
const RECOVERY_BATCH_SIZE = 100

const buildStaleBeforeDate = (): Date =>
  new Date(Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000)

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

const markStaleJobDead = async (job: ProvisioningJob): Promise<void> => {
  await provisioningJobRepository.updateById(job.id, {
    status: 'dead',
    lastError:
      'Provisioning marked dead after stale processing and max attempts reached',
    nextRetryAt: null,
  })
  await provisioningTerminalFailureService.handleTerminalFailure({
    provisioningJobId: job.id,
    reason: 'recovery_stale',
  })
}

const enqueueRecoveredJob = async (job: ProvisioningJob): Promise<void> => {
  await provisioningJobRepository.updateById(job.id, {
    status: 'queued',
    lastError: 'Recovered from stale processing state',
    nextRetryAt: null,
  })

  const queueOptions = getProvisioningQueueJobOptions()
  try {
    await provisioningQueue.add(
      'provision-esim',
      { jobId: job.id },
      {
        jobId: `provision-recovered-${job.id}-${Date.now()}`,
        ...queueOptions,
      }
    )
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown queue error'
    logger.warn('Failed to enqueue recovered provisioning job', {
      provisioningJobId: job.id,
      orderId: job.orderId,
      error: message,
    })
  }
}

const recoverStaleJob = async (job: ProvisioningJob): Promise<void> => {
  const order = await orderRepository.findById(job.orderId)
  if (order !== null && isOrderClosedForProvisioning(order)) {
    return
  }

  if (isRateLimitCooldownActive(job.lastError, job.nextRetryAt)) {
    return
  }
  if (job.attemptCount >= job.maxAttempts) {
    await markStaleJobDead(job)
    return
  }
  await enqueueRecoveredJob(job)
}

const runProvisioningRecoveryCron = async (): Promise<void> => {
  if (redisConnection.status !== 'ready') {
    logger.warn('Provisioning recovery cron skipped — Redis is not ready', {
      redisStatus: redisConnection.status,
    })
    await schedulerOperationsAlertService.reportIssue({
      scheduler: 'provisioning_recovery',
      issue: 'skipped',
      reason: 'Redis is not ready',
      retryEndpoint: 'POST /api/v1/admin/provisioning-jobs/{id}/retry',
      context: { redisStatus: redisConnection.status },
    })
    return
  }

  const staleBefore = buildStaleBeforeDate()
  const staleJobs =
    await provisioningJobRepository.findStaleProcessingWithoutEsimProfile(
      staleBefore,
      RECOVERY_BATCH_SIZE
    )
  if (staleJobs.length === 0) {
    return
  }

  logger.warn('Recovering stale provisioning jobs', {
    count: staleJobs.length,
    staleBefore: staleBefore.toISOString(),
  })

  for (const job of staleJobs) {
    await recoverStaleJob(job)
  }
}

export const registerProvisioningRecoveryScheduler = (): ScheduledTask => {
  return cron.schedule(
    '*/5 * * * *',
    () => {
      void runProvisioningRecoveryCron().catch(async (error) => {
        logger.error('Provisioning recovery cron execution failed', {
          error: error instanceof Error ? error.message : String(error),
        })
        await schedulerOperationsAlertService.reportIssue({
          scheduler: 'provisioning_recovery',
          issue: 'enqueue_failed',
          reason: error instanceof Error ? error.message : String(error),
          retryEndpoint: 'POST /api/v1/admin/provisioning-jobs/{id}/retry',
          context: {},
        })
      })
    },
    { timezone: 'UTC' }
  )
}

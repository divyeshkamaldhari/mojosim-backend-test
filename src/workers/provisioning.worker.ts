import { DelayedError } from 'bullmq'

import { ProviderRateLimitError } from '../common/errors'
import { env } from '../config/env'
import { createWorker } from '../modules/bullmq'
import { provisioningService } from '../services/provisioning.service'
import { provisioningTerminalFailureService } from '../services/provisioning-terminal-failure.service'

type ProvisioningQueuePayload = {
  jobId: number
}

export const provisioningWorker = createWorker<ProvisioningQueuePayload, void>(
  'provisioning',
  async (job) => {
    const { jobId } = job.data
    try {
      await provisioningService.processProvisioningJob(jobId)
    } catch (error) {
      if (error instanceof ProviderRateLimitError) {
        const delayMs = Math.max(error.retryAfterMs, 1_000)
        throw new DelayedError(`Airalo rate limited — retry after ${delayMs}ms`)
      }
      throw error
    }
  },
  {
    concurrency: env.PROVISIONING_WORKER_CONCURRENCY,
    jobTimeoutMs: 180_000,
    onExhaustedRetries: async ({ job: j, err }) => {
      const provisioningJobId = j.data?.jobId
      if (provisioningJobId === undefined) {
        return
      }
      await provisioningTerminalFailureService.handleTerminalFailure({
        provisioningJobId,
        reason: 'bullmq_exhausted',
        lastErrorFromWorker: err.message,
      })
    },
  }
)

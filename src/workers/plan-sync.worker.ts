import { createWorker } from '../modules/bullmq'
import { logger } from '../common/logger'
import { handlePlanSyncQueueExhausted } from '../services/queue-exhausted-side-effects.service'
import { planSyncService } from '../services/plan-sync.service'

type PlanSyncJobData = {
  provider_id?: number
}

export const planSyncWorker = createWorker<PlanSyncJobData, unknown>(
  'plan-sync',
  async (job) => {
    const providerId = job.data.provider_id
    const result = await planSyncService.syncPlans(providerId)
    logger.info('Plan sync job completed', {
      total: result.total,
      inserted: result.inserted,
      updated: result.updated,
      deactivated: result.deactivated,
      errors: result.errors,
    })
    return result
  },
  {
    concurrency: 1,
    jobTimeoutMs: 300_000,
    onExhaustedRetries: async ({ job: j, err }) => {
      await handlePlanSyncQueueExhausted(j, err)
    },
  }
)

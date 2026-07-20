import { createWorker } from '../modules/bullmq'
import { logger } from '../common/logger'
import { deviceCompatibilitySyncService } from '../services/device-compatibility-sync.service'
import { handleCompatibilitySyncQueueExhausted } from '../services/queue-exhausted-side-effects.service'

type CompatibilitySyncJobData = {
  provider_id?: number
}

export const compatibilitySyncWorker = createWorker<
  CompatibilitySyncJobData,
  unknown
>(
  'compatibility-sync',
  async (job) => {
    const providerId = job.data.provider_id
    const result =
      await deviceCompatibilitySyncService.syncCompatibleDevices(providerId)
    logger.info('Compatibility sync job completed', {
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
      await handleCompatibilitySyncQueueExhausted(j, err)
    },
  }
)

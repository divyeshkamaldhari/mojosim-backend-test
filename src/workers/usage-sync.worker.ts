import { createWorker } from '../modules/bullmq'
import {
  usageSyncService,
  type UsageSyncQueuePayload,
} from '../services/usage-sync.service'

export const usageSyncWorker = createWorker<UsageSyncQueuePayload, void>(
  'usage-sync',
  async (job) => {
    await usageSyncService.syncUsage(job.data)
  },
  { concurrency: 2, jobTimeoutMs: 120_000 }
)

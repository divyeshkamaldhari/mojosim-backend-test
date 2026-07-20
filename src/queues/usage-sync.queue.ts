import { createQueue } from '../modules/bullmq'

export const usageSyncQueue = createQueue('usage-sync', {
  defaultJobOptions: {
    attempts: 4,
    backoff: { type: 'exponential', delay: 15_000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

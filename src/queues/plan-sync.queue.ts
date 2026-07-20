import { createQueue } from '../modules/bullmq'

export const planSyncQueue = createQueue('plan-sync', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60_000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

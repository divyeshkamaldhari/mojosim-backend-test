import { createQueue } from '../modules/bullmq'

export const compatibilitySyncQueue = createQueue('compatibility-sync', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 60_000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

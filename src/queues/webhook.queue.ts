import { createQueue } from '../modules/bullmq'

export const webhookQueue = createQueue('webhook', {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 10_000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

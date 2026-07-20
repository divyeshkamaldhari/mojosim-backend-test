import { createQueue } from '../modules/bullmq'

export const emailQueue = createQueue('email', {
  defaultJobOptions: {
    attempts: 4,
    backoff: { type: 'exponential', delay: 5_000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

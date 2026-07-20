import { createQueue } from '../modules/bullmq'

export const invoiceQueue = createQueue('invoice', {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 15_000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

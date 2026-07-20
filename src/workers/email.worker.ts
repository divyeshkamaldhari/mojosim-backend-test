import { createWorker } from '../modules/bullmq'
import {
  emailJobService,
  type EmailQueuePayload,
} from '../services/email-job.service'
import { handleEmailQueueExhausted } from '../services/queue-exhausted-side-effects.service'

export const emailWorker = createWorker<EmailQueuePayload, void>(
  'email',
  async (job) => {
    await emailJobService.processEmailJob(job.data)
  },
  {
    concurrency: 5,
    jobTimeoutMs: 30_000,
    onExhaustedRetries: async ({ job: j, err }) => {
      await handleEmailQueueExhausted(j, err)
    },
  }
)

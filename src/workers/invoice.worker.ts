import { createWorker } from '../modules/bullmq'
import {
  invoiceJobService,
  type InvoiceQueuePayload,
} from '../services/invoice-job.service'
import { handleInvoiceQueueExhausted } from '../services/queue-exhausted-side-effects.service'

export const invoiceWorker = createWorker<InvoiceQueuePayload, void>(
  'invoice',
  async (job) => {
    await invoiceJobService.processInvoiceJob(job.data)
  },
  {
    concurrency: 2,
    jobTimeoutMs: 120_000,
    onExhaustedRetries: async ({ job: j, err }) => {
      await handleInvoiceQueueExhausted(j, err)
    },
  }
)

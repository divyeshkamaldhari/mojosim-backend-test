import { logger } from '../common/logger'
import { createWorker } from '../modules/bullmq'
import { WebhookEventRepository } from '../repositories/webhook-event.repository'
import { airaloWebhookService } from '../services/airalo-webhook.service'
import { handleWebhookQueueExhausted } from '../services/queue-exhausted-side-effects.service'
import { stripeWebhookService } from '../services/stripe-webhook.service'

type WebhookQueuePayload = {
  webhookEventId: number
}

const webhookEventRepository = new WebhookEventRepository()

export const webhookWorker = createWorker<WebhookQueuePayload, void>(
  'webhook',
  async (job) => {
    const event = await webhookEventRepository.findById(job.data.webhookEventId)
    if (event === null) {
      logger.warn('Webhook event not found for worker job', {
        webhookEventId: job.data.webhookEventId,
      })
      return
    }
    if (event.processed) {
      return
    }

    try {
      if (event.source === 'airalo') {
        await airaloWebhookService.processWebhookEvent(event)
      } else if (event.source === 'stripe') {
        await stripeWebhookService.processWebhookEvent(event)
      }
      await webhookEventRepository.updateById(event.id, {
        processed: true,
        processedAt: new Date(),
        processingError: null,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown webhook worker error'
      await webhookEventRepository.updateById(event.id, {
        processed: false,
        processedAt: null,
        processingError: message,
      })
      throw error
    }
  },
  {
    concurrency: 3,
    jobTimeoutMs: 60_000,
    onExhaustedRetries: async ({ job: j, err }) => {
      await handleWebhookQueueExhausted(j, err)
    },
  }
)

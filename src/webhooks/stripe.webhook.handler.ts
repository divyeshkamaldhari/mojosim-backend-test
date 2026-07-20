import { Request, Response } from 'express'

import { webhookQueue } from '../queues/webhook.queue'
import { WebhookEventRepository } from '../repositories/webhook-event.repository'

const webhookEventRepository = new WebhookEventRepository()

export const handleStripeWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const event = req.stripeEvent
  if (!event) {
    res
      .status(400)
      .json({ success: false, error: { message: 'Missing event' } })
    return
  }

  const webhookEvent = await webhookEventRepository.create({
    source: 'stripe',
    eventType: event.type,
    payload: event as unknown as Record<string, unknown>,
  })

  res.status(200).json({ received: true })
  await webhookQueue.add(
    'process-webhook-event',
    { webhookEventId: webhookEvent.id },
    {
      jobId: `webhook-stripe-${webhookEvent.id}`,
      removeOnComplete: true,
      removeOnFail: false,
    }
  )
}

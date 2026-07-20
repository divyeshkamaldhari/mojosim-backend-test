/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Request, Response } from 'express'

import { logger } from '../common/logger'
import { env } from '../config/env'
import {
  detectAiraloWebhookEventType,
  parseAiraloWebhookPayload,
  verifyAiraloSignature,
} from '../modules/providers/airalo/airalo.webhook'
import { webhookQueue } from '../queues/webhook.queue'
import { WebhookEventRepository } from '../repositories/webhook-event.repository'

const webhookEventRepository = new WebhookEventRepository()

const parseSignature = (req: Request): string | null => {
  const header = req.headers['airalo-signature']
  if (typeof header !== 'string') {
    return null
  }
  const trimmed = header.trim()
  return trimmed.length > 0 ? trimmed : null
}

export const validateAiraloWebhookEndpoint = (
  _req: Request,
  res: Response
): void => {
  res.sendStatus(200)
}

export const handleAiraloWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  const signature = parseSignature(req)
  if (signature === null) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Missing airalo-signature header',
      },
    })
    return
  }

  const rawBody = req.body
  if (!Buffer.isBuffer(rawBody)) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid webhook payload body',
      },
    })
    return
  }

  const validSignature = verifyAiraloSignature(
    rawBody,
    signature,
    env.AIRALO_WEBHOOK_SECRET
  )
  if (!validSignature) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_SIGNATURE',
        message: 'Invalid webhook signature',
      },
    })
    return
  }

  const payload = parseAiraloWebhookPayload(rawBody)
  if (payload === null) {
    res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Webhook payload must be valid JSON object',
      },
    })
    return
  }

  const eventType = detectAiraloWebhookEventType(payload)
  const webhookEvent = await webhookEventRepository.create({
    source: 'airalo',
    eventType,
    payload,
  })

  try {
    await webhookQueue.add(
      'process-webhook-event',
      { webhookEventId: webhookEvent.id },
      {
        jobId: `webhook-airalo-${webhookEvent.id}`,
        removeOnComplete: true,
        removeOnFail: false,
      }
    )
  } catch (error) {
    logger.error('Failed to enqueue Airalo webhook event', {
      webhookEventId: webhookEvent.id,
      error: error instanceof Error ? error.message : String(error),
    })
  }

  res.status(200).json({ success: true, received: true })
}

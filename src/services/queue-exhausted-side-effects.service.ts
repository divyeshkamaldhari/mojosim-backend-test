import type { Job } from 'bullmq'

import { logger } from '../common/logger'
import { InvoiceRepository } from '../repositories/invoice.repository'
import { ProviderRepository } from '../repositories/provider.repository'
import { WebhookEventRepository } from '../repositories/webhook-event.repository'
import { sendAdminOperationsAlert } from './admin-operations-alert.service'
import { auditService } from './audit.service'

const webhookEventRepository = new WebhookEventRepository()
const invoiceRepository = new InvoiceRepository()
const providerRepository = new ProviderRepository()

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : value.slice(0, max)

type WebhookJobData = { webhookEventId: number }
type EmailJobData = {
  to: string
  templateType: string
  notificationId: number | null
}
type InvoiceJobData = { invoiceId: number }
type ProviderScopedJobData = { provider_id?: number }

const resolveProviderId = async (
  data: ProviderScopedJobData
): Promise<number | null> => {
  if (typeof data.provider_id === 'number' && data.provider_id > 0) {
    return data.provider_id
  }
  const provider = await providerRepository.findFirstActiveProvider()
  return provider?.id ?? null
}

export const handleWebhookQueueExhausted = async (
  job: Job<WebhookJobData, unknown, string>,
  err: Error
): Promise<void> => {
  const webhookEventId = job.data?.webhookEventId
  if (webhookEventId === undefined) {
    return
  }
  const maxAttempts = job.opts.attempts ?? null
  const attemptsMade = job.attemptsMade ?? null

  const event = await webhookEventRepository.findById(webhookEventId)
  const source = event?.source ?? 'unknown'
  const processingError = event?.processingError ?? truncate(err.message, 2000)

  void auditService.createLog({
    action: 'webhook_event.processing_failed',
    entityType: 'webhook_events',
    entityId: webhookEventId,
    actorId: null,
    beforeState: null,
    afterState: {
      source,
      attempts: attemptsMade,
      max_attempts: maxAttempts,
      error: truncate(processingError, 2000),
    },
    ipAddress: null,
  })

  await sendAdminOperationsAlert({
    title: 'Webhook worker exhausted retries',
    body: `webhookEventId=${webhookEventId} source=${source} attempts=${String(attemptsMade)}/${String(maxAttempts)}\n${truncate(processingError, 4000)}`,
  })
}

export const handleEmailQueueExhausted = async (
  job: Job<EmailJobData, unknown, string>,
  err: Error
): Promise<void> => {
  const maxAttempts = job.opts.attempts ?? null
  const attemptsMade = job.attemptsMade ?? null
  const notificationId = job.data?.notificationId ?? null

  if (notificationId !== null) {
    void auditService.createLog({
      action: 'notification.email_delivery_failed',
      entityType: 'notifications',
      entityId: notificationId,
      actorId: null,
      beforeState: null,
      afterState: {
        template_type: job.data.templateType,
        attempts: attemptsMade,
        max_attempts: maxAttempts,
        error: truncate(err.message, 2000),
      },
      ipAddress: null,
    })
  }

  await sendAdminOperationsAlert({
    title: 'Email worker exhausted retries',
    body: `notificationId=${String(notificationId)} template=${job.data?.templateType ?? ''} attempts=${String(attemptsMade)}/${String(maxAttempts)}\n${truncate(err.message, 4000)}`,
  })
}

export const handleInvoiceQueueExhausted = async (
  job: Job<InvoiceJobData, unknown, string>,
  err: Error
): Promise<void> => {
  const invoiceId = job.data?.invoiceId
  if (invoiceId === undefined) {
    return
  }
  const maxAttempts = job.opts.attempts ?? null
  const attemptsMade = job.attemptsMade ?? null

  const invoice = await invoiceRepository.findById(invoiceId)
  const orderId = invoice?.orderId ?? null

  void auditService.createLog({
    action: 'invoice.pdf_generation_failed',
    entityType: 'invoices',
    entityId: invoiceId,
    actorId: null,
    beforeState: null,
    afterState: {
      order_id: orderId,
      attempts: attemptsMade,
      max_attempts: maxAttempts,
      error: truncate(err.message, 2000),
    },
    ipAddress: null,
  })

  await sendAdminOperationsAlert({
    title: 'Invoice PDF worker exhausted retries',
    body: `invoiceId=${invoiceId} orderId=${String(orderId)} attempts=${String(attemptsMade)}/${String(maxAttempts)}\n${truncate(err.message, 4000)}`,
  })
}

export const handlePlanSyncQueueExhausted = async (
  job: Job<ProviderScopedJobData, unknown, string>,
  err: Error
): Promise<void> => {
  const providerId = await resolveProviderId(job.data ?? {})
  const maxAttempts = job.opts.attempts ?? null
  const attemptsMade = job.attemptsMade ?? null

  if (providerId === null) {
    logger.warn('Plan sync exhausted retries without provider id', {
      attemptsMade,
      maxAttempts,
    })
  } else {
    void auditService.createLog({
      action: 'plans.sync_failed',
      entityType: 'providers',
      entityId: providerId,
      actorId: null,
      beforeState: null,
      afterState: {
        queue: 'plan-sync',
        attempts: attemptsMade,
        max_attempts: maxAttempts,
        error: truncate(err.message, 2000),
      },
      ipAddress: null,
    })
  }

  await sendAdminOperationsAlert({
    title: 'Plan sync worker exhausted retries',
    body: `providerId=${String(providerId)} attempts=${String(attemptsMade)}/${String(maxAttempts)}\n${truncate(err.message, 4000)}`,
  })
}

export const handleCompatibilitySyncQueueExhausted = async (
  job: Job<ProviderScopedJobData, unknown, string>,
  err: Error
): Promise<void> => {
  const providerId = await resolveProviderId(job.data ?? {})
  const maxAttempts = job.opts.attempts ?? null
  const attemptsMade = job.attemptsMade ?? null

  if (providerId === null) {
    logger.warn('Compatibility sync exhausted retries without provider id', {
      attemptsMade,
      maxAttempts,
    })
  } else {
    void auditService.createLog({
      action: 'device_compatibility.sync_failed',
      entityType: 'providers',
      entityId: providerId,
      actorId: null,
      beforeState: null,
      afterState: {
        queue: 'compatibility-sync',
        attempts: attemptsMade,
        max_attempts: maxAttempts,
        error: truncate(err.message, 2000),
      },
      ipAddress: null,
    })
  }

  await sendAdminOperationsAlert({
    title: 'Compatibility sync worker exhausted retries',
    body: `providerId=${String(providerId)} attempts=${String(attemptsMade)}/${String(maxAttempts)}\n${truncate(err.message, 4000)}`,
  })
}

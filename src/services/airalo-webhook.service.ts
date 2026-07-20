import { logger } from '../common/logger'
import { TemplateType } from '../modules/email'
import type { WebhookEvent } from '../models/webhook-event'
import { EsimProfileRepository } from '../repositories/esim-profile.repository'
import { UserRepository } from '../repositories/user.repository'
import { auditService } from './audit.service'
import { notificationService } from './notification.service'

type GenericRecord = Record<string, unknown>

type EsimProfileWithOrder = {
  id: number
  iccid: string
  orderId: number
  lifecycleState:
    | 'created'
    | 'assigned'
    | 'activated'
    | 'suspended'
    | 'expired'
    | 'deactivated'
  order?: {
    id: number
    userId: number
  }
}

const toRecord = (value: unknown): GenericRecord | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as GenericRecord
}

const getNestedPayload = (payload: GenericRecord): GenericRecord => {
  const nested = toRecord(payload.data)
  return nested ?? payload
}

const getString = (payload: GenericRecord, key: string): string | null => {
  const value = payload[key]
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const getNumber = (payload: GenericRecord, key: string): number | null => {
  const value = payload[key]
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

export class AiraloWebhookService {
  private readonly esimProfileRepository: EsimProfileRepository

  private readonly userRepository: UserRepository

  constructor(
    esimProfileRepository: EsimProfileRepository = new EsimProfileRepository(),
    userRepository: UserRepository = new UserRepository()
  ) {
    this.esimProfileRepository = esimProfileRepository
    this.userRepository = userRepository
  }

  processWebhookEvent = async (webhookEvent: WebhookEvent): Promise<void> => {
    const payloadRecord = toRecord(webhookEvent.payload)
    if (payloadRecord === null) {
      logger.warn('Airalo webhook payload is not an object', {
        webhookEventId: webhookEvent.id,
      })
      return
    }

    switch (webhookEvent.eventType) {
      case 'low_data_notification':
        await this.handleLowDataNotification(webhookEvent.id, payloadRecord)
        break
      case 'credit_limit_notification':
        await this.handleCreditLimitNotification(webhookEvent.id, payloadRecord)
        break
      default:
        logger.info('Unhandled Airalo webhook event type', {
          webhookEventId: webhookEvent.id,
          eventType: webhookEvent.eventType,
        })
    }
  }

  private readonly handleLowDataNotification = async (
    webhookEventId: number,
    payloadInput: GenericRecord
  ): Promise<void> => {
    const payload = getNestedPayload(payloadInput)
    const iccid = getString(payload, 'iccid')
    if (iccid === null) {
      logger.warn('Airalo low-data webhook missing ICCID', { webhookEventId })
      return
    }

    const esim = (await this.esimProfileRepository.findByIccidWithOrder(
      iccid
    )) as EsimProfileWithOrder | null
    if (esim?.order === undefined) {
      logger.warn('Airalo low-data webhook ICCID not mapped to customer', {
        webhookEventId,
        iccid,
      })
      return
    }

    const remainingPercentage = getNumber(payload, 'remaining_percentage')
    const level = getString(payload, 'level') ?? 'unknown'
    const packageName = getString(payload, 'package_name') ?? 'Unknown package'

    await this.esimProfileRepository.updateById(esim.id, {
      lastSyncedAt: new Date(),
    })

    const remainingPercentValue =
      remainingPercentage === null ? 'unknown' : String(remainingPercentage)
    const isBelow10 = remainingPercentage !== null && remainingPercentage <= 10
    const isBelow20 = remainingPercentage !== null && remainingPercentage <= 20

    if (isBelow10) {
      await notificationService.sendNotification({
        userId: esim.order.userId,
        channel: 'both',
        type: TemplateType.low_data_warning,
        subject: 'Your Airalo eSIM is running low on data',
        body: `Your eSIM is running low (${level}). Open your portal to review usage and top-up options.`,
        meta: {
          webhook_event_id: webhookEventId,
          iccid,
          level,
          remaining_percentage: remainingPercentage,
        },
        data: {
          firstName: '',
          packageName,
          remainingPercent: remainingPercentValue,
          remainingMb: remainingPercentValue,
        },
      })
    } else if (isBelow20) {
      await notificationService.sendNotification({
        userId: esim.order.userId,
        channel: 'in_app',
        type: TemplateType.data_below_20,
        subject: 'Data below 20%',
        body: 'Your remaining data is below 20%. Consider topping up soon.',
        meta: {
          webhook_event_id: webhookEventId,
          iccid,
          level,
          remaining_percentage: remainingPercentage,
        },
        data: {
          firstName: '',
          packageName,
          remainingPercent: remainingPercentValue,
        },
      })
    }

    void auditService.createLog({
      action: 'airalo.low_data.received',
      entityType: 'esim_profiles',
      entityId: esim.id,
      actorId: null,
      beforeState: null,
      afterState: {
        iccid,
        level,
        remaining_percentage: remainingPercentage,
        webhook_event_id: webhookEventId,
      },
      ipAddress: null,
    })
  }

  private readonly handleCreditLimitNotification = async (
    webhookEventId: number,
    payloadInput: GenericRecord
  ): Promise<void> => {
    const payload = getNestedPayload(payloadInput)
    const message =
      getString(payload, 'message') ?? 'Airalo credit limit threshold reached.'
    const remaining = getNumber(payload, 'remaining')

    const admins = await this.userRepository.findByRoles(['admin', 'manager'])
    for (const user of admins) {
      await notificationService.sendNotification({
        userId: user.id,
        channel: 'in_app',
        type: TemplateType.operations_alert,
        subject: 'Airalo credit limit alert',
        body: message,
        meta: {
          webhook_event_id: webhookEventId,
          remaining,
        },
        data: {},
      })
    }

    void auditService.createLog({
      action: 'airalo.credit_limit.received',
      entityType: 'webhook_events',
      entityId: webhookEventId,
      actorId: null,
      beforeState: null,
      afterState: {
        message,
        remaining,
        webhook_event_id: webhookEventId,
      },
      ipAddress: null,
    })
  }
}

export const airaloWebhookService = new AiraloWebhookService()

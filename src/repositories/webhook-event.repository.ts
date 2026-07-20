import { WebhookEvent } from '../models/webhook-event'
import { Op } from 'sequelize'

export type CreateWebhookEventData = {
  source: string
  eventType: string
  payload: Record<string, unknown>
}

export type UpdateWebhookEventData = Partial<{
  processed: boolean
  processingError: string | null
  processedAt: Date | null
}>

export type WebhookEventFilters = {
  source?: 'stripe' | 'airalo'
  eventType?: string
  processed?: boolean
}

export class WebhookEventRepository {
  findAll = async (
    filters: WebhookEventFilters,
    page: number,
    limit: number
  ): Promise<{ rows: WebhookEvent[]; count: number }> => {
    const where: Record<string, unknown> = {}
    if (filters.source !== undefined) {
      where.source = filters.source
    }
    if (filters.eventType !== undefined) {
      where.eventType = { [Op.iLike]: `%${filters.eventType}%` }
    }
    if (filters.processed !== undefined) {
      where.processed = filters.processed
    }

    return WebhookEvent.findAndCountAll({
      where,
      order: [['id', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })
  }

  findById = async (id: number): Promise<WebhookEvent | null> => {
    return WebhookEvent.findByPk(id)
  }

  create = async (data: CreateWebhookEventData): Promise<WebhookEvent> => {
    return WebhookEvent.create({
      source: data.source,
      eventType: data.eventType,
      payload: data.payload,
      processed: false,
      processingError: null,
      receivedAt: new Date(),
      processedAt: null,
    })
  }

  updateById = async (
    id: number,
    data: UpdateWebhookEventData
  ): Promise<void> => {
    await WebhookEvent.update(data, { where: { id } })
  }
}

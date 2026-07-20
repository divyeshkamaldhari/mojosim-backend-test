/* eslint-disable sonarjs/cognitive-complexity */
import crypto from 'node:crypto'

import { AppError, ConflictError, NotFoundError } from '../common/errors'
import { env } from '../config/env'
import {
  CreateProviderSchema,
  type AiraloWebhookOptInDto,
  type CreateProviderDto,
  type UpdateProviderDto,
} from '../dto/provider.dto'
import { AiraloNotificationsClient } from '../modules/providers/airalo/airalo.notifications'
import type { Provider } from '../models/provider'
import {
  ProviderRepository,
  type CreateProviderData,
  type UpdateProviderData,
} from '../repositories/provider.repository'
import { auditService } from './audit.service'
import { marginService } from './margin.service'

type ProviderResponse = {
  id: number
  name: string
  slug: string
  api_base_url: string
  is_active: boolean
  priority: number
  margin_percent: string
  capabilities: unknown
  api_credentials_configured: boolean
  created_at: Date
  updated_at: Date
}

const isApiCredentialsConfigured = (provider: Provider): boolean => {
  return provider.getDataValue('apiCredentialsConfigured') === true
}

const mapProvider = (provider: Provider): ProviderResponse => ({
  id: provider.id,
  name: provider.name,
  slug: provider.slug,
  api_base_url: provider.apiBaseUrl,
  is_active: provider.isActive,
  priority: provider.priority,
  margin_percent: provider.marginPercent,
  capabilities: provider.capabilities,
  api_credentials_configured: isApiCredentialsConfigured(provider),
  created_at: provider.createdAt,
  updated_at: provider.updatedAt,
})

const trimTrailingSlashes = (value: string): string => {
  let end = value.length
  while (end > 0 && value.codePointAt(end - 1) === 47) {
    end -= 1
  }
  return value.slice(0, end)
}

const getAes256Key = (): Buffer => {
  return crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest()
}

const encryptApiCredentials = (
  credentials: CreateProviderDto['api_credentials']
): string => {
  const iv = crypto.randomBytes(12)
  const key = getAes256Key()
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const plaintext = JSON.stringify(credentials)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export const decryptApiCredentials = (
  encrypted: string
): CreateProviderDto['api_credentials'] => {
  const parts = encrypted.split(':')
  if (parts.length !== 3) {
    throw new AppError('Invalid encrypted credentials', 500, 'INTERNAL_ERROR')
  }
  const iv = Buffer.from(parts[0], 'base64')
  const authTag = Buffer.from(parts[1], 'base64')
  const ciphertext = Buffer.from(parts[2], 'base64')
  const key = getAes256Key()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8')
  const parsed: unknown = JSON.parse(plaintext)
  return CreateProviderSchema.shape.api_credentials.parse(parsed)
}

export class ProviderService {
  private readonly providerRepository: ProviderRepository

  constructor(
    providerRepository: ProviderRepository = new ProviderRepository()
  ) {
    this.providerRepository = providerRepository
  }

  getProviders = async (
    page: number,
    limit: number
  ): Promise<{
    items: ProviderResponse[]
    meta: { page: number; limit: number; total: number }
  }> => {
    const { rows, count } = await this.providerRepository.findAll(page, limit)
    return {
      items: rows.map(mapProvider),
      meta: { page, limit, total: count },
    }
  }

  getProviderById = async (id: number): Promise<ProviderResponse> => {
    const provider = await this.providerRepository.findById(id)
    if (!provider) {
      throw new NotFoundError('Provider')
    }
    return mapProvider(provider)
  }

  createProvider = async (
    dto: CreateProviderDto,
    actorId: number
  ): Promise<ProviderResponse> => {
    const existing = await this.providerRepository.findBySlug(dto.slug)
    if (existing) {
      throw new ConflictError('Provider slug already exists')
    }

    const createData: CreateProviderData = {
      name: dto.name,
      slug: dto.slug,
      apiBaseUrl: dto.api_base_url,
      apiCredentialsEnc: encryptApiCredentials(dto.api_credentials),
      priority: dto.priority,
      capabilities: dto.capabilities,
      marginPercent: dto.margin_percent.toFixed(2),
      isActive: true,
    }

    const created = await this.providerRepository.create(createData)

    void auditService.createLog({
      action: 'provider.created',
      entityType: 'providers',
      entityId: created.id,
      actorId,
      beforeState: null,
      afterState: {
        name: created.name,
        slug: created.slug,
        is_active: created.isActive,
        priority: created.priority,
        margin_percent: created.marginPercent,
      },
      ipAddress: null,
    })

    return mapProvider(created)
  }

  updateProvider = async (
    id: number,
    dto: UpdateProviderDto,
    actorId: number
  ): Promise<ProviderResponse> => {
    const existing = await this.providerRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Provider')
    }

    const nextMarginPercentStr =
      dto.margin_percent === undefined
        ? undefined
        : dto.margin_percent.toFixed(2)
    const marginPercentChanged =
      nextMarginPercentStr !== undefined &&
      nextMarginPercentStr !== existing.marginPercent

    const updateData: UpdateProviderData = {
      ...(dto.name === undefined ? {} : { name: dto.name }),
      ...(dto.api_base_url === undefined
        ? {}
        : { apiBaseUrl: dto.api_base_url }),
      ...(dto.priority === undefined ? {} : { priority: dto.priority }),
      ...(marginPercentChanged ? { marginPercent: nextMarginPercentStr } : {}),
      ...(dto.capabilities === undefined
        ? {}
        : { capabilities: dto.capabilities }),
      ...(dto.api_credentials === undefined
        ? {}
        : { apiCredentialsEnc: encryptApiCredentials(dto.api_credentials) }),
    }

    const hasRowUpdates = Object.keys(updateData).length > 0
    if (hasRowUpdates) {
      await this.providerRepository.updateById(id, updateData)
    }

    let marginRecalcPlansUpdated: number | null = null
    if (marginPercentChanged) {
      const recalc = await marginService.recalculateProviderPlans(id)
      marginRecalcPlansUpdated = recalc.plansUpdated
    }

    const updated = hasRowUpdates
      ? await this.providerRepository.findById(id)
      : existing
    if (!updated) {
      throw new NotFoundError('Provider')
    }

    const afterState: Record<string, unknown> = marginPercentChanged
      ? {
          margin_percent: updated.marginPercent,
          plans_recalculated: marginRecalcPlansUpdated ?? 0,
        }
      : {
          ...(dto.name === undefined ? {} : { name: updated.name }),
          ...(dto.priority === undefined ? {} : { priority: updated.priority }),
          ...(dto.api_base_url === undefined
            ? {}
            : { api_base_url: updated.apiBaseUrl }),
          ...(dto.capabilities === undefined
            ? {}
            : { capabilities: updated.capabilities }),
          ...(dto.api_credentials === undefined
            ? {}
            : { api_credentials_updated: true }),
        }
    const beforeState: Record<string, unknown> = marginPercentChanged
      ? { margin_percent: existing.marginPercent }
      : {
          name: existing.name,
          slug: existing.slug,
          priority: existing.priority,
          margin_percent: existing.marginPercent,
        }

    void auditService.createLog({
      action: marginPercentChanged
        ? 'provider.margin_updated'
        : 'provider.updated',
      entityType: 'providers',
      entityId: updated.id,
      actorId,
      beforeState,
      afterState,
      ipAddress: null,
    })

    return mapProvider(updated)
  }

  toggleProvider = async (
    id: number,
    actorId: number
  ): Promise<{ message: string; is_active: boolean }> => {
    const existing = await this.providerRepository.findById(id)
    if (!existing) {
      throw new NotFoundError('Provider')
    }

    const nextIsActive = !existing.isActive
    await this.providerRepository.updateById(id, { isActive: nextIsActive })

    void auditService.createLog({
      action: nextIsActive ? 'provider.activated' : 'provider.deactivated',
      entityType: 'providers',
      entityId: existing.id,
      actorId,
      beforeState: { is_active: existing.isActive },
      afterState: { is_active: nextIsActive },
      ipAddress: null,
    })

    return {
      message: nextIsActive ? 'Provider activated' : 'Provider deactivated',
      is_active: nextIsActive,
    }
  }

  optInAiraloWebhooks = async (
    id: number,
    dto: AiraloWebhookOptInDto,
    actorId: number
  ): Promise<{
    provider_id: number
    webhook_url: string
    registrations: Array<{ type: string; contact_point: string | null }>
  }> => {
    const provider = await this.providerRepository.findByIdWithCredentials(id)
    if (!provider) {
      throw new NotFoundError('Provider')
    }
    if (provider.slug !== 'airalo') {
      throw new AppError(
        'Webhook opt-in is only supported for Airalo provider',
        400,
        'UNSUPPORTED_PROVIDER'
      )
    }

    const webhookUrl =
      dto.webhook_url ??
      `${trimTrailingSlashes(env.APP_URL)}/api/v1/webhooks/airalo`
    const types = dto.types ?? ['webhook_low_data', 'webhook_credit_limit']

    const credentials = decryptApiCredentials(provider.apiCredentialsEnc)
    const client = new AiraloNotificationsClient(provider.apiBaseUrl, {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
    })

    const registrations: Array<{ type: string; contact_point: string | null }> =
      []
    for (const type of types) {
      const result = await client.optIn(type, webhookUrl)
      registrations.push(result)
    }

    void auditService.createLog({
      action: 'provider.airalo_webhooks_opt_in',
      entityType: 'providers',
      entityId: provider.id,
      actorId,
      beforeState: null,
      afterState: {
        webhook_url: webhookUrl,
        types,
      },
      ipAddress: null,
    })

    return {
      provider_id: provider.id,
      webhook_url: webhookUrl,
      registrations,
    }
  }
}

export const providerService = new ProviderService()

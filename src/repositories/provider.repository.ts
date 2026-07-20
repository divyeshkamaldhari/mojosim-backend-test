import type { FindAttributeOptions, Transaction } from 'sequelize'
import { literal } from 'sequelize'

import { Provider } from '../models/provider'

export type CreateProviderData = {
  name: string
  slug: string
  apiBaseUrl: string
  apiCredentialsEnc: string
  priority: number
  capabilities: unknown
  marginPercent: string
  isActive?: boolean
}

export type UpdateProviderData = Partial<CreateProviderData>

const apiCredentialsConfiguredExpr = literal(
  '(length(trim(both from "api_credentials_enc")) > 0)'
)

const providerReadAttributes: FindAttributeOptions = [
  'id',
  'name',
  'slug',
  'apiBaseUrl',
  'isActive',
  'priority',
  'capabilities',
  'marginPercent',
  'createdAt',
  'updatedAt',
  [apiCredentialsConfiguredExpr, 'apiCredentialsConfigured'],
]

export class ProviderRepository {
  findAll = async (
    page: number,
    limit: number
  ): Promise<{ rows: Provider[]; count: number }> => {
    const offset = (page - 1) * limit
    const { rows, count } = await Provider.findAndCountAll({
      limit,
      offset,
      order: [['id', 'ASC']],
      attributes: providerReadAttributes,
    })
    return { rows, count }
  }

  findById = async (id: number): Promise<Provider | null> => {
    return Provider.findByPk(id, {
      attributes: providerReadAttributes,
    })
  }

  findByIdWithCredentials = async (id: number): Promise<Provider | null> => {
    return Provider.findByPk(id)
  }

  findFirstActiveProvider = async (): Promise<Provider | null> => {
    return Provider.findOne({
      where: { isActive: true },
      order: [
        ['priority', 'ASC'],
        ['id', 'ASC'],
      ],
      attributes: providerReadAttributes,
    })
  }

  findActiveProviders = async (): Promise<Provider[]> => {
    return Provider.findAll({
      where: { isActive: true },
      order: [
        ['priority', 'ASC'],
        ['id', 'ASC'],
      ],
      attributes: providerReadAttributes,
    })
  }

  findBySlug = async (slug: string): Promise<Provider | null> => {
    return Provider.findOne({
      where: { slug },
      attributes: providerReadAttributes,
    })
  }

  create = async (data: CreateProviderData): Promise<Provider> => {
    const created = await Provider.create({
      name: data.name,
      slug: data.slug,
      apiBaseUrl: data.apiBaseUrl,
      apiCredentialsEnc: data.apiCredentialsEnc,
      priority: data.priority,
      capabilities: data.capabilities,
      marginPercent: data.marginPercent,
      isActive: data.isActive ?? true,
    })
    const provider = await this.findById(created.id)
    if (provider === null) {
      throw new Error('Failed to load created provider')
    }
    return provider
  }

  touchUpdatedAt = async (
    id: number,
    transaction?: Transaction
  ): Promise<void> => {
    await Provider.update(
      { updatedAt: new Date() },
      { where: { id }, transaction }
    )
  }

  updateById = async (id: number, data: UpdateProviderData): Promise<void> => {
    const payload: Record<string, unknown> = {
      ...(data.name === undefined ? {} : { name: data.name }),
      ...(data.slug === undefined ? {} : { slug: data.slug }),
      ...(data.apiBaseUrl === undefined ? {} : { apiBaseUrl: data.apiBaseUrl }),
      ...(data.apiCredentialsEnc === undefined
        ? {}
        : { apiCredentialsEnc: data.apiCredentialsEnc }),
      ...(data.priority === undefined ? {} : { priority: data.priority }),
      ...(data.capabilities === undefined
        ? {}
        : { capabilities: data.capabilities }),
      ...(data.marginPercent === undefined
        ? {}
        : { marginPercent: data.marginPercent }),
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
    }

    await Provider.update(payload, { where: { id } })
  }
}

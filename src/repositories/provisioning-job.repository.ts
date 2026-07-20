import { literal, Op, type Transaction, type WhereOptions } from 'sequelize'

import { Order } from '../models/order'
import { ProvisioningJob } from '../models/provisioning-job'
import { User } from '../models/user'
import { getProvisioningMaxAttempts } from '../queues/provisioning-queue-options'

export type ProvisioningJobListFilters = {
  status?: 'queued' | 'processing' | 'success' | 'failed' | 'dead'
  orderId?: number
}

export type CreateProvisioningJobData = {
  orderId: number
  esimProfileId: number | null
  status: 'queued' | 'processing' | 'success' | 'failed' | 'dead'
  providerRequest: Record<string, unknown>
}

export type UpdateProvisioningJobData = Partial<{
  status: 'queued' | 'processing' | 'success' | 'failed' | 'dead'
  attemptCount: number
  maxAttempts: number
  esimProfileId: number | null
  lastError: string | null
  providerRequest: Record<string, unknown>
  providerResponse: Record<string, unknown> | null
  nextRetryAt: Date | null
  completedAt: Date | null
}>

export class ProvisioningJobRepository {
  findById = async (id: number): Promise<ProvisioningJob | null> => {
    return ProvisioningJob.findByPk(id)
  }

  create = async (
    data: CreateProvisioningJobData,
    options?: { transaction?: Transaction }
  ): Promise<ProvisioningJob> => {
    return ProvisioningJob.create(
      {
        orderId: data.orderId,
        esimProfileId: data.esimProfileId,
        status: data.status,
        attemptCount: 0,
        maxAttempts: getProvisioningMaxAttempts(),
        lastError: null,
        providerRequest: data.providerRequest,
        providerResponse: null,
        nextRetryAt: null,
        completedAt: null,
      },
      { transaction: options?.transaction }
    )
  }

  findByOrderId = async (orderId: number): Promise<ProvisioningJob | null> => {
    return ProvisioningJob.findOne({ where: { orderId } })
  }

  findLatestStatusByOrderIds = async (
    orderIds: number[]
  ): Promise<Map<number, ProvisioningJob['status']>> => {
    if (orderIds.length === 0) {
      return new Map()
    }

    const jobs = await ProvisioningJob.findAll({
      where: { orderId: { [Op.in]: orderIds } },
      attributes: ['orderId', 'status'],
      order: [['id', 'DESC']],
    })

    const statusByOrderId = new Map<number, ProvisioningJob['status']>()
    for (const job of jobs) {
      if (!statusByOrderId.has(job.orderId)) {
        statusByOrderId.set(job.orderId, job.status)
      }
    }

    return statusByOrderId
  }

  updateById = async (
    id: number,
    data: UpdateProvisioningJobData,
    options?: { transaction?: Transaction }
  ): Promise<void> => {
    await ProvisioningJob.update(data, {
      where: { id },
      transaction: options?.transaction,
    })
  }

  findFailedWithoutEsimProfile = async (
    limit: number
  ): Promise<ProvisioningJob[]> => {
    return ProvisioningJob.findAll({
      where: {
        status: { [Op.in]: ['failed', 'dead'] },
        esimProfileId: { [Op.is]: null },
      },
      include: [
        {
          model: Order,
          as: 'order',
          required: true,
          where: { status: 'confirmed' },
          attributes: [
            'id',
            'userId',
            'status',
            'orderType',
            'amount',
            'currency',
            'createdAt',
          ],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'firstName', 'lastName'],
              required: false,
            },
          ],
        },
      ],
      order: [['id', 'DESC']],
      limit,
    })
  }

  findStaleProcessingWithoutEsimProfile = async (
    staleBefore: Date,
    limit: number
  ): Promise<ProvisioningJob[]> => {
    return ProvisioningJob.findAll({
      where: {
        status: 'processing',
        esimProfileId: { [Op.is]: null },
        updatedAt: { [Op.lte]: staleBefore },
      },
      order: [['updatedAt', 'ASC']],
      limit,
    })
  }

  findDueForRetry = async (limit: number): Promise<ProvisioningJob[]> => {
    const now = new Date()
    return ProvisioningJob.findAll({
      where: {
        status: { [Op.in]: ['failed', 'queued'] },
        esimProfileId: { [Op.is]: null },
        nextRetryAt: { [Op.lte]: now },
        [Op.and]: literal('attempt_count < max_attempts'),
      },
      order: [['next_retry_at', 'ASC']],
      limit,
    })
  }

  findAll = async (
    filters: ProvisioningJobListFilters,
    page: number,
    limit: number
  ): Promise<{ rows: ProvisioningJob[]; count: number }> => {
    const where: WhereOptions = {}
    if (filters.status !== undefined) {
      where.status = filters.status
    }
    if (filters.orderId !== undefined) {
      where.orderId = filters.orderId
    }

    return ProvisioningJob.findAndCountAll({
      where,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['status', 'paymentStatus'],
          required: false,
        },
      ],
      order: [['id', 'DESC']],
      offset: (page - 1) * limit,
      limit,
    })
  }
}

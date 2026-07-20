import { Op } from 'sequelize'
import { Notification } from '../models/notification'

export type NotificationChannel = 'email' | 'in_app'

export type FindNotificationsFilters = {
  channel?: NotificationChannel
  is_read?: boolean
}

export class NotificationRepository {
  create = async (data: {
    userId: number
    channel: NotificationChannel
    type: string
    subject: string
    body: string
    meta: Record<string, unknown> | null
  }): Promise<Notification> => {
    return Notification.create({
      userId: data.userId,
      channel: data.channel,
      type: data.type,
      subject: data.subject,
      body: data.body,
      isRead: false,
      meta: data.meta,
      sentAt: null,
    })
  }

  findByUserId = async (
    userId: number,
    filters: FindNotificationsFilters,
    pagination: { page: number; limit: number }
  ): Promise<{ rows: Notification[]; count: number }> => {
    const where: {
      userId: number
      channel?: NotificationChannel
      isRead?: boolean
    } = { userId }

    if (filters.channel !== undefined) {
      where.channel = filters.channel
    }
    if (filters.is_read !== undefined) {
      where.isRead = filters.is_read
    }

    const offset = (pagination.page - 1) * pagination.limit
    return Notification.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: pagination.limit,
      offset,
    })
  }

  findUnreadCount = async (userId: number): Promise<number> => {
    return Notification.count({
      where: {
        userId,
        channel: 'in_app',
        isRead: false,
      },
    })
  }

  markAsRead = async (id: number, userId: number): Promise<number> => {
    const [updatedCount] = await Notification.update(
      { isRead: true },
      { where: { id, userId } }
    )
    return updatedCount
  }

  markAllAsRead = async (userId: number): Promise<number> => {
    const [updatedCount] = await Notification.update(
      { isRead: true },
      {
        where: {
          userId,
          isRead: { [Op.eq]: false },
        },
      }
    )
    return updatedCount
  }

  markSentAt = async (id: number, sentAt: Date): Promise<void> => {
    await Notification.update(
      { sentAt, isRead: true },
      {
        where: { id },
      }
    )
  }

  existsByUserTypeAndProvisioningJobMeta = async (
    userId: number,
    type: string,
    provisioningJobId: number
  ): Promise<boolean> => {
    const count = await Notification.count({
      where: {
        userId,
        type,
        meta: {
          [Op.contains]: { provisioning_job_id: provisioningJobId },
        },
      },
    })
    return count > 0
  }

  existsByUserTypeAndEsimMeta = async (
    userId: number,
    type: string,
    esimProfileId: number
  ): Promise<boolean> => {
    const count = await Notification.count({
      where: {
        userId,
        type,
        meta: {
          [Op.contains]: { esim_id: esimProfileId },
        },
      },
    })
    return count > 0
  }

  existsByUserTypeAndOrderMeta = async (
    userId: number,
    type: string,
    orderId: number
  ): Promise<boolean> => {
    const count = await Notification.count({
      where: {
        userId,
        type,
        meta: {
          [Op.contains]: { order_id: orderId },
        },
      },
    })
    return count > 0
  }
}

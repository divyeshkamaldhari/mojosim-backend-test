import { TemplateType } from '../modules/email'
import { logger } from '../common/logger'
import { UserRepository } from '../repositories/user.repository'
import { NotificationRepository } from '../repositories/notification.repository'
import { emailQueue } from '../queues/email.queue'

export type SendNotificationInput = {
  userId: number
  channel: 'email' | 'in_app' | 'both'
  type: TemplateType
  subject: string
  body: string
  meta: Record<string, unknown> | null
  data: Record<string, string>
}

export type NotificationListFilters = {
  channel?: 'email' | 'in_app'
  is_read?: boolean
}

export type NotificationListItem = {
  id: number
  channel: 'email' | 'in_app' | 'sms'
  type: string
  subject: string
  body: string
  is_read: boolean
  meta: Record<string, unknown> | null
  sent_at: Date | null
  created_at: Date
  updated_at: Date
}

export class NotificationService {
  private readonly notificationRepository: NotificationRepository

  private readonly userRepository: UserRepository

  constructor(
    notificationRepository: NotificationRepository = new NotificationRepository(),
    userRepository: UserRepository = new UserRepository()
  ) {
    this.notificationRepository = notificationRepository
    this.userRepository = userRepository
  }

  sendNotification = async (input: SendNotificationInput): Promise<void> => {
    try {
      const shouldSendEmail =
        input.channel === 'email' || input.channel === 'both'
      const shouldSendInApp =
        input.channel === 'in_app' || input.channel === 'both'

      if (shouldSendInApp) {
        await this.notificationRepository.create({
          userId: input.userId,
          channel: 'in_app',
          type: input.type,
          subject: input.subject,
          body: input.body,
          meta: input.meta,
        })
      }

      let emailNotificationId: number | null = null

      if (shouldSendEmail) {
        const emailNotification = await this.notificationRepository.create({
          userId: input.userId,
          channel: 'email',
          type: input.type,
          subject: input.subject,
          body: input.body,
          meta: input.meta,
        })
        emailNotificationId = emailNotification.id
      }

      if (!shouldSendEmail) {
        return
      }

      const user = await this.userRepository.findByIdExcludingPasswordHash(
        input.userId
      )
      if (!user) {
        logger.warn('Notification email skipped: user not found', {
          userId: input.userId,
        })
        return
      }

      try {
        await emailQueue.add(
          'process-email',
          {
            to: user.email,
            templateType: input.type,
            data: input.data,
            notificationId: emailNotificationId,
          },
          {
            removeOnComplete: true,
            removeOnFail: false,
          }
        )
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown email error'
        logger.warn('Notification email enqueue failed', {
          userId: input.userId,
          type: input.type,
          error: message,
        })
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown notification error'
      logger.warn('Notification send failed (DB/email)', {
        userId: input.userId,
        type: input.type,
        error: message,
      })
    }
  }

  getNotifications = async (
    userId: number,
    filters: NotificationListFilters,
    pagination: { page: number; limit: number }
  ): Promise<{
    items: NotificationListItem[]
    meta: { page: number; limit: number; total: number }
  }> => {
    const result = await this.notificationRepository.findByUserId(
      userId,
      { channel: filters.channel, is_read: filters.is_read },
      pagination
    )

    return {
      items: result.rows.map((n) => ({
        id: n.id,
        channel: n.channel,
        type: n.type,
        subject: n.subject,
        body: n.body,
        is_read: n.isRead,
        meta: n.meta,
        sent_at: n.sentAt,
        created_at: n.createdAt,
        updated_at: n.updatedAt,
      })),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.count,
      },
    }
  }

  getUnreadCount = async (userId: number): Promise<number> => {
    return this.notificationRepository.findUnreadCount(userId)
  }

  markAsRead = async (id: number, userId: number): Promise<number> => {
    return this.notificationRepository.markAsRead(id, userId)
  }

  markAllAsRead = async (userId: number): Promise<number> => {
    return this.notificationRepository.markAllAsRead(userId)
  }
}

export const notificationService = new NotificationService()

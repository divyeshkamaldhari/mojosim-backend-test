import { logger } from '../common/logger'
import { sendEmail, type EmailPayload } from '../modules/email'
import { NotificationRepository } from '../repositories/notification.repository'

export type EmailQueuePayload = {
  to: string
  templateType: EmailPayload['templateType']
  data: Record<string, string>
  notificationId: number | null
}

export class EmailJobService {
  private readonly notificationRepository: NotificationRepository

  constructor(
    notificationRepository: NotificationRepository = new NotificationRepository()
  ) {
    this.notificationRepository = notificationRepository
  }

  processEmailJob = async (payload: EmailQueuePayload): Promise<void> => {
    await sendEmail({
      to: payload.to,
      templateType: payload.templateType,
      data: payload.data,
    })

    if (payload.notificationId !== null) {
      try {
        await this.notificationRepository.markSentAt(
          payload.notificationId,
          new Date()
        )
      } catch (error) {
        logger.warn('Failed to mark notification sent_at', {
          notificationId: payload.notificationId,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }
}

export const emailJobService = new EmailJobService()

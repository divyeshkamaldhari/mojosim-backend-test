import { logger } from '../common/logger'
import { TemplateType } from '../modules/email'
import type { EsimProfile } from '../models/esim-profile'
import type { Order } from '../models/order'
import type { User } from '../models/user'
import { EsimProfileRepository } from '../repositories/esim-profile.repository'
import { NotificationRepository } from '../repositories/notification.repository'
import { notificationService } from './notification.service'

const HORIZON_DAYS = 7
const BATCH_LIMIT = 300

type OrderWithUser = Order & {
  user?: Pick<User, 'firstName' | 'lastName'>
}

type EsimWithOrder = EsimProfile & { order?: OrderWithUser }

export class ExpiryReminderService {
  private readonly esimProfileRepository: EsimProfileRepository

  private readonly notificationRepository: NotificationRepository

  constructor(
    esimProfileRepository: EsimProfileRepository = new EsimProfileRepository(),
    notificationRepository: NotificationRepository = new NotificationRepository()
  ) {
    this.esimProfileRepository = esimProfileRepository
    this.notificationRepository = notificationRepository
  }

  sendDueExpiryReminders = async (): Promise<void> => {
    const rows = await this.esimProfileRepository.findExpiringWithinHorizon(
      HORIZON_DAYS,
      BATCH_LIMIT
    )
    let sent = 0
    for (const row of rows) {
      const didSend = await this.maybeNotify(row)
      if (didSend) {
        sent += 1
      }
    }
    logger.info('Expiry reminder pass finished', {
      scanned: rows.length,
      sent,
    })
  }

  private readonly maybeNotify = async (
    profile: EsimWithOrder
  ): Promise<boolean> => {
    const order = profile.order
    if (order === undefined || profile.expiresAt === null) {
      return false
    }

    const alreadySent =
      await this.notificationRepository.existsByUserTypeAndEsimMeta(
        order.userId,
        TemplateType.expiry_reminder,
        profile.id
      )
    if (alreadySent) {
      return false
    }

    const now = new Date()
    const msPerDay = 24 * 60 * 60 * 1000
    const daysLeft = Math.max(
      1,
      Math.ceil((profile.expiresAt.getTime() - now.getTime()) / msPerDay)
    )
    const firstName = String(order.user?.firstName ?? '')

    void notificationService.sendNotification({
      userId: order.userId,
      channel: 'both',
      type: TemplateType.expiry_reminder,
      subject: 'Your eSIM is expiring soon',
      body: `Your eSIM will expire in about ${String(daysLeft)} day(s). Renew to stay connected.`,
      meta: {
        esim_id: profile.id,
        iccid: profile.iccid,
        expires_at: profile.expiresAt.toISOString(),
      },
      data: {
        firstName,
        daysLeft: String(daysLeft),
      },
    })
    return true
  }
}

export const expiryReminderService = new ExpiryReminderService()

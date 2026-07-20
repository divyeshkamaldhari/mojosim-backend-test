import { logger } from '../common/logger'
import { TemplateType } from '../modules/email'
import { UserRepository } from '../repositories/user.repository'
import { notificationService } from './notification.service'

const userRepository = new UserRepository()

export type AdminOperationsAlertInput = {
  title: string
  body: string
}

/**
 * Ops alert for provisioning / scheduler failures (M3).
 * Emails staff when possible; always logs.
 */
export const sendAdminOperationsAlert = async (
  input: AdminOperationsAlertInput
): Promise<void> => {
  logger.warn('Admin operations alert', {
    title: input.title,
    body: input.body.slice(0, 2000),
  })

  try {
    const staff = await userRepository.findByRoles(['admin', 'manager'])
    await Promise.all(
      staff.map((user) =>
        notificationService.sendNotification({
          userId: user.id,
          channel: 'email',
          type: TemplateType.operations_alert,
          subject: input.title,
          body: input.body,
          meta: { source: 'operations_alert' },
          data: {},
        })
      )
    )
  } catch (error) {
    logger.warn('Failed to deliver admin operations alert', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

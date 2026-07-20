import cron from 'node-cron'
import type { ScheduledTask } from 'node-cron'

import { logger } from '../common/logger'
import { expiryReminderService } from '../services/expiry-reminder.service'

export const registerExpiryReminderScheduler = (): ScheduledTask => {
  return cron.schedule(
    '30 7 * * *',
    () => {
      void (async () => {
        try {
          await expiryReminderService.sendDueExpiryReminders()
        } catch (error) {
          logger.error('Expiry reminder cron failed', {
            error: error instanceof Error ? error.message : String(error),
          })
        }
      })()
    },
    { timezone: 'UTC' }
  )
}

import type { Server } from 'node:http'
import type { ScheduledTask } from 'node-cron'

import { app } from './app'
import { env } from './config/env'
import { logger } from './common/logger'

export type StartServerOptions = {
  redisAvailable?: boolean
}

export type ServerRuntime = {
  httpServer: Server
  scheduledTasks: ScheduledTask[]
}

export const startServer = (options?: StartServerOptions): ServerRuntime => {
  const scheduledTasks: ScheduledTask[] = []
  const httpServer = app.listen(env.PORT, () => {
    logger.info('Server started', {
      port: env.PORT,
      redisAvailable: options?.redisAvailable ?? false,
    })
    void import('./schedulers/expiry-reminder.scheduler').then((m) => {
      scheduledTasks.push(m.registerExpiryReminderScheduler())
    })
    void import('./schedulers/payment-reconciliation.scheduler').then((m) => {
      scheduledTasks.push(m.registerPaymentReconciliationScheduler())
    })
    if (options?.redisAvailable) {
      void import('./schedulers/compatibility-sync.scheduler').then((m) => {
        scheduledTasks.push(m.registerCompatibilitySyncScheduler())
      })
      void import('./schedulers/plan-sync.scheduler').then((m) => {
        scheduledTasks.push(m.registerPlanSyncScheduler())
      })
      void import('./schedulers/usage-sync.scheduler').then((m) => {
        scheduledTasks.push(m.registerUsageSyncScheduler())
      })
      void import('./schedulers/provisioning-recovery.scheduler').then((m) => {
        scheduledTasks.push(m.registerProvisioningRecoveryScheduler())
      })
      void import('./schedulers/provisioning-retry.scheduler').then((m) => {
        scheduledTasks.push(m.registerProvisioningRetryScheduler())
      })
    }
  })
  return {
    httpServer,
    scheduledTasks,
  }
}

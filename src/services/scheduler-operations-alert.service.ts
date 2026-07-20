import { TemplateType } from '../modules/email'
import { auditService } from './audit.service'
import { notificationService } from './notification.service'
import { sendAdminOperationsAlert } from './admin-operations-alert.service'
import { UserRepository } from '../repositories/user.repository'

type SchedulerKey =
  | 'plan_sync'
  | 'compatibility_sync'
  | 'usage_sync'
  | 'provisioning_recovery'
  | 'provisioning_retry'

type SchedulerIssueInput = {
  scheduler: SchedulerKey
  issue: 'skipped' | 'enqueue_failed'
  reason: string
  retryEndpoint: string
  context: Record<string, unknown>
}

const schedulerEntityIds: Record<SchedulerKey, number> = {
  plan_sync: 1,
  compatibility_sync: 2,
  usage_sync: 3,
  provisioning_recovery: 4,
  provisioning_retry: 5,
}

const schedulerLabels: Record<SchedulerKey, string> = {
  plan_sync: 'Plan sync',
  compatibility_sync: 'Compatibility sync',
  usage_sync: 'Usage sync',
  provisioning_recovery: 'Provisioning recovery',
  provisioning_retry: 'Provisioning retry',
}

export class SchedulerOperationsAlertService {
  private readonly userRepository: UserRepository

  constructor(userRepository: UserRepository = new UserRepository()) {
    this.userRepository = userRepository
  }

  reportIssue = async (input: SchedulerIssueInput): Promise<void> => {
    const title = `[Scheduler] ${schedulerLabels[input.scheduler]} ${input.issue}`
    const body = `${schedulerLabels[input.scheduler]} ${input.issue}: ${input.reason}. Retry endpoint: ${input.retryEndpoint}`

    await sendAdminOperationsAlert({ title, body })

    const admins = await this.userRepository.findByRoles(['admin', 'manager'])
    for (const user of admins) {
      await notificationService.sendNotification({
        userId: user.id,
        channel: 'in_app',
        type: TemplateType.operations_alert,
        subject: title,
        body,
        meta: {
          scheduler: input.scheduler,
          issue: input.issue,
          reason: input.reason,
          retry_endpoint: input.retryEndpoint,
          ...input.context,
        },
        data: {},
      })
    }

    void auditService.createLog({
      action: `scheduler.${input.scheduler}.${input.issue}`,
      entityType: 'scheduler_jobs',
      entityId: schedulerEntityIds[input.scheduler],
      actorId: null,
      beforeState: null,
      afterState: {
        scheduler: input.scheduler,
        issue: input.issue,
        reason: input.reason,
        retry_endpoint: input.retryEndpoint,
        ...input.context,
      },
      ipAddress: null,
    })
  }
}

export const schedulerOperationsAlertService =
  new SchedulerOperationsAlertService()

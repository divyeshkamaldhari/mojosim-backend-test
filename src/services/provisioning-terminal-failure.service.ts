import { TemplateType } from '../modules/email'
import type { Order } from '../models/order'
import type { User } from '../models/user'
import { OrderRepository } from '../repositories/order.repository'
import { NotificationRepository } from '../repositories/notification.repository'
import { ProvisioningJobRepository } from '../repositories/provisioning-job.repository'
import { sendAdminOperationsAlert } from './admin-operations-alert.service'
import { auditService } from './audit.service'
import { notificationService } from './notification.service'

export type ProvisioningTerminalFailureReason =
  | 'bullmq_exhausted'
  | 'recovery_stale'

type OrderWithUser = Order & {
  user?: Pick<User, 'firstName' | 'lastName' | 'email'>
}

const truncate = (value: string, max: number): string =>
  value.length <= max ? value : value.slice(0, max)

export class ProvisioningTerminalFailureService {
  private readonly provisioningJobRepository: ProvisioningJobRepository

  private readonly orderRepository: OrderRepository

  private readonly notificationRepository: NotificationRepository

  constructor(
    provisioningJobRepository: ProvisioningJobRepository = new ProvisioningJobRepository(),
    orderRepository: OrderRepository = new OrderRepository(),
    notificationRepository: NotificationRepository = new NotificationRepository()
  ) {
    this.provisioningJobRepository = provisioningJobRepository
    this.orderRepository = orderRepository
    this.notificationRepository = notificationRepository
  }

  handleTerminalFailure = async (params: {
    provisioningJobId: number
    reason: ProvisioningTerminalFailureReason
    lastErrorFromWorker?: string
  }): Promise<void> => {
    const job = await this.provisioningJobRepository.findById(
      params.provisioningJobId
    )
    if (job === null) {
      return
    }

    if (job.status === 'success' && job.esimProfileId !== null) {
      return
    }

    if (params.reason === 'bullmq_exhausted') {
      await this.provisioningJobRepository.updateById(job.id, {
        status: 'dead',
        nextRetryAt: null,
        lastError:
          params.lastErrorFromWorker === undefined
            ? job.lastError
            : truncate(params.lastErrorFromWorker, 4000),
      })
    }

    const refreshed = await this.provisioningJobRepository.findById(job.id)
    if (refreshed === null) {
      return
    }

    const order = await this.orderRepository.findByIdForProvisioning(
      refreshed.orderId
    )
    if (order === null) {
      void auditService.createLog({
        action: 'provisioning.job_failed',
        entityType: 'provisioning_jobs',
        entityId: refreshed.id,
        actorId: null,
        beforeState: null,
        afterState: {
          status: refreshed.status,
          order_id: refreshed.orderId,
          last_error: refreshed.lastError,
          reason: params.reason,
          note: 'order_not_found_for_notification',
        },
        ipAddress: null,
      })
      await sendAdminOperationsAlert({
        title: 'Provisioning terminal failure (order missing)',
        body: `Provisioning job ${refreshed.id} order ${refreshed.orderId} reason=${params.reason}\nlastError=${refreshed.lastError ?? ''}`,
      })
      return
    }

    const alreadyNotified =
      await this.notificationRepository.existsByUserTypeAndProvisioningJobMeta(
        order.userId,
        TemplateType.provisioning_failed,
        refreshed.id
      )
    if (alreadyNotified) {
      return
    }

    const orderWithUser = order as OrderWithUser
    const firstName = String(orderWithUser.user?.firstName ?? '')
    const lastError =
      params.reason === 'bullmq_exhausted' && params.lastErrorFromWorker
        ? params.lastErrorFromWorker
        : (refreshed.lastError ?? 'Unknown error')

    void notificationService.sendNotification({
      userId: order.userId,
      channel: 'both',
      type: TemplateType.provisioning_failed,
      subject: 'eSIM provisioning failed',
      body: 'We could not complete eSIM provisioning for your order. Please contact support if you need help.',
      meta: {
        order_id: order.id,
        provisioning_job_id: refreshed.id,
        reason: params.reason,
        last_error: truncate(lastError, 2000),
      },
      data: {
        firstName,
        orderId: String(order.id),
        reason: truncate(lastError, 1500),
      },
    })

    void auditService.createLog({
      action: 'provisioning.job_failed',
      entityType: 'provisioning_jobs',
      entityId: refreshed.id,
      actorId: null,
      beforeState: null,
      afterState: {
        status: refreshed.status,
        order_id: order.id,
        last_error: truncate(lastError, 2000),
        reason: params.reason,
      },
      ipAddress: null,
    })

    await sendAdminOperationsAlert({
      title: 'Provisioning failed (customer notified)',
      body: `Job ${refreshed.id} order ${order.id} user ${order.userId} reason=${params.reason}\n${truncate(lastError, 3000)}`,
    })
  }
}

export const provisioningTerminalFailureService =
  new ProvisioningTerminalFailureService()

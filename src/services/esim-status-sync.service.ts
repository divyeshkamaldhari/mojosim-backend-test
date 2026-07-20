import { TemplateType } from '../modules/email'
import type { EsimProfile } from '../models/esim-profile'
import type { Order } from '../models/order'
import type { Plan } from '../models/plan'
import { EsimProfileRepository } from '../repositories/esim-profile.repository'
import { ProfileStatusHistoryRepository } from '../repositories/profile-status-history.repository'
import { auditService } from './audit.service'
import { notificationService } from './notification.service'

type EsimWithOrderPlan = EsimProfile & {
  order?: Order & { plan?: Pick<Plan, 'name' | 'validityDays'> }
}

type LifecycleState = EsimProfile['lifecycleState']

const normalizeStatus = (status: string): string => status.trim().toLowerCase()

const mapProviderStatusToLifecycle = (
  status: string
): LifecycleState | null => {
  const normalized = normalizeStatus(status)
  if (normalized === 'not_active') {
    return 'assigned'
  }
  if (normalized === 'active' || normalized === 'activated') {
    return 'activated'
  }
  if (normalized === 'suspended') {
    return 'suspended'
  }
  if (normalized === 'expired') {
    return 'expired'
  }
  if (normalized === 'recycled') {
    return 'deactivated'
  }
  if (normalized === 'unknown') {
    return null
  }
  if (['cancelled', 'canceled', 'deactivated'].includes(normalized)) {
    return 'deactivated'
  }
  return null
}

const resolveNextLifecycleState = (
  providerStatus: string,
  currentState: LifecycleState
): LifecycleState | null => {
  const nextState = mapProviderStatusToLifecycle(providerStatus)
  if (
    nextState === 'assigned' &&
    currentState !== 'assigned' &&
    currentState !== 'created'
  ) {
    return null
  }
  return nextState
}

const normalizeExpiryUpdate = (expiredAt?: Date | null): Date | null =>
  expiredAt !== undefined && expiredAt !== null ? expiredAt : null

const buildSyncTimestampUpdates = (
  now: Date,
  expiryUpdate: Date | null
): { lastSyncedAt: Date; expiresAt?: Date } => {
  const updates: { lastSyncedAt: Date; expiresAt?: Date } = {
    lastSyncedAt: now,
  }
  if (expiryUpdate !== null) {
    updates.expiresAt = expiryUpdate
  }
  return updates
}

const buildLifecycleTransitionUpdates = (
  profile: EsimWithOrderPlan,
  nextState: LifecycleState,
  now: Date,
  expiryUpdate: Date | null
): {
  lifecycleState: LifecycleState
  lastSyncedAt: Date
  activatedAt?: Date | null
  expiresAt?: Date | null
} => {
  const updates: {
    lifecycleState: LifecycleState
    lastSyncedAt: Date
    activatedAt?: Date | null
    expiresAt?: Date | null
  } = {
    lifecycleState: nextState,
    lastSyncedAt: now,
  }

  if (expiryUpdate !== null) {
    updates.expiresAt = expiryUpdate
  }

  if (nextState !== 'activated') {
    return updates
  }

  updates.activatedAt = profile.activatedAt ?? now
  if (updates.expiresAt !== undefined || profile.expiresAt !== null) {
    return updates
  }

  const validityDays = profile.order?.plan?.validityDays
  if (validityDays === undefined) {
    return updates
  }

  updates.expiresAt = new Date(
    (updates.activatedAt ?? now).getTime() + validityDays * 24 * 60 * 60 * 1000
  )
  return updates
}

export class EsimStatusSyncService {
  private readonly esimProfileRepository: EsimProfileRepository

  private readonly profileStatusHistoryRepository: ProfileStatusHistoryRepository

  constructor(
    esimProfileRepository: EsimProfileRepository = new EsimProfileRepository(),
    profileStatusHistoryRepository: ProfileStatusHistoryRepository = new ProfileStatusHistoryRepository()
  ) {
    this.esimProfileRepository = esimProfileRepository
    this.profileStatusHistoryRepository = profileStatusHistoryRepository
  }

  reconcileFromProviderStatus = async (
    esimProfileId: number,
    providerStatus: string,
    expiredAt?: Date | null
  ): Promise<void> => {
    const profile =
      await this.esimProfileRepository.findByIdWithOrderPlan(esimProfileId)
    if (profile === null) {
      return
    }

    const now = new Date()
    const nextState = resolveNextLifecycleState(
      providerStatus,
      profile.lifecycleState
    )
    const expiryUpdate = normalizeExpiryUpdate(expiredAt)

    if (nextState === null) {
      await this.esimProfileRepository.updateById(
        profile.id,
        buildSyncTimestampUpdates(now, expiryUpdate)
      )
      return
    }

    if (profile.lifecycleState === nextState) {
      await this.esimProfileRepository.updateById(
        profile.id,
        buildSyncTimestampUpdates(now, expiryUpdate)
      )
      return
    }

    const updates = buildLifecycleTransitionUpdates(
      profile,
      nextState,
      now,
      expiryUpdate
    )

    await this.esimProfileRepository.updateById(profile.id, updates)
    await this.recordLifecycleTransition(profile, providerStatus, nextState)
  }

  private readonly recordLifecycleTransition = async (
    profile: EsimWithOrderPlan,
    providerStatus: string,
    nextState: LifecycleState
  ): Promise<void> => {
    await this.profileStatusHistoryRepository.create({
      esimProfileId: profile.id,
      fromState: profile.lifecycleState,
      toState: nextState,
      source: 'status_sync',
      reason: `Provider status sync mapped "${providerStatus}" to "${nextState}"`,
      actorId: null,
    })

    await this.sendTransitionNotification(profile, nextState)

    void auditService.createLog({
      action: `esim.status_synced.${nextState}`,
      entityType: 'esim_profiles',
      entityId: profile.id,
      actorId: null,
      beforeState: { lifecycle_state: profile.lifecycleState },
      afterState: {
        lifecycle_state: nextState,
        provider_status: providerStatus,
      },
      ipAddress: null,
    })
  }

  private readonly sendTransitionNotification = async (
    profile: EsimWithOrderPlan,
    nextState: LifecycleState
  ): Promise<void> => {
    if (profile.order === undefined) {
      return
    }

    if (nextState === 'activated') {
      await notificationService.sendNotification({
        userId: profile.order.userId,
        channel: 'in_app',
        type: TemplateType.esim_activated,
        subject: 'Your eSIM is now active',
        body: 'Your eSIM has been activated and is ready to use.',
        meta: { esim_id: profile.id, iccid: profile.iccid },
        data: {},
      })
      return
    }

    if (nextState === 'suspended' || nextState === 'expired') {
      const templateType =
        nextState === 'suspended'
          ? TemplateType.esim_suspended
          : TemplateType.esim_expired
      const subject =
        nextState === 'suspended'
          ? 'Your eSIM has been suspended'
          : 'Your eSIM has expired'
      const body =
        nextState === 'suspended'
          ? 'Your eSIM is currently suspended. Please check your portal for details.'
          : 'Your eSIM has expired. Renew to continue service.'

      await notificationService.sendNotification({
        userId: profile.order.userId,
        channel: 'both',
        type: templateType,
        subject,
        body,
        meta: {
          esim_id: profile.id,
          iccid: profile.iccid,
          lifecycle_state: nextState,
        },
        data: {
          firstName: '',
          iccid: profile.iccid ?? '',
        },
      })
    }
  }
}

export const esimStatusSyncService = new EsimStatusSyncService()

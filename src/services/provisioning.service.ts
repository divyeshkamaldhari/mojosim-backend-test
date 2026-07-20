/* eslint-disable sonarjs/cognitive-complexity */
import { UnrecoverableError } from 'bullmq'

import { sequelize } from '../config/db'
import { env } from '../config/env'
import {
  AppError,
  NotFoundError,
  ProviderRateLimitError,
} from '../common/errors'
import { logger, logWarn } from '../common/logger'
import { encryptQrPayload } from '../common/qr-payload-crypto'
import { TemplateType } from '../modules/email'
import { AiraloAdapter } from '../modules/providers/airalo/airalo.adapter'
import type { ProviderOrder } from '../modules/providers/provider.interface'
import type { Order } from '../models/order'
import type { Plan } from '../models/plan'
import type { User } from '../models/user'
import { EsimProfileRepository } from '../repositories/esim-profile.repository'
import { OrderRepository } from '../repositories/order.repository'
import { ProfileStatusHistoryRepository } from '../repositories/profile-status-history.repository'
import { ProvisioningJobRepository } from '../repositories/provisioning-job.repository'
import { ProviderRepository } from '../repositories/provider.repository'
import { getBillingSnapshotQuantity } from '../utils/billing-snapshot.util'
import {
  isFullyProvisionedEsimProfile,
  isPlaceholderEsimProfile,
} from '../utils/esim-profile-status'
import { resolveProvisioningPackageId } from '../utils/resolve-provisioning-package-id'
import { acquireRedisLock, releaseRedisLock } from '../utils/redis-lock'
import { isOrderClosedForProvisioning } from '../utils/order-refund-guards'
import { auditService } from './audit.service'
import { decryptApiCredentials } from './provider.service'
import { notificationService } from './notification.service'
import { provisioningTerminalFailureService } from './provisioning-terminal-failure.service'
import type { ProvisioningJob } from '../models/provisioning-job'

const BACKOFF_BASE_MS = 30_000
const PROVISION_LOCK_TTL_MS = 120_000
const PROVISION_LOCK_RETRY_MS = 5_000

const sleepMs = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

type OrderForProvisioning = Order & {
  plan: Plan
  user?: User
}

const computeNextRetryAt = (attemptCount: number): Date => {
  const exp = Math.max(0, attemptCount - 1)
  const delay = BACKOFF_BASE_MS * 2 ** exp
  const cap = 15 * 60 * 1000
  return new Date(Date.now() + Math.min(delay, cap))
}

export class ProvisioningService {
  private readonly provisioningJobRepository: ProvisioningJobRepository

  private readonly orderRepository: OrderRepository

  private readonly providerRepository: ProviderRepository

  private readonly esimProfileRepository: EsimProfileRepository

  private readonly profileStatusHistoryRepository: ProfileStatusHistoryRepository

  constructor(
    provisioningJobRepository: ProvisioningJobRepository = new ProvisioningJobRepository(),
    orderRepository: OrderRepository = new OrderRepository(),
    providerRepository: ProviderRepository = new ProviderRepository(),
    esimProfileRepository: EsimProfileRepository = new EsimProfileRepository(),
    profileStatusHistoryRepository: ProfileStatusHistoryRepository = new ProfileStatusHistoryRepository()
  ) {
    this.provisioningJobRepository = provisioningJobRepository
    this.orderRepository = orderRepository
    this.providerRepository = providerRepository
    this.esimProfileRepository = esimProfileRepository
    this.profileStatusHistoryRepository = profileStatusHistoryRepository
  }

  processProvisioningJob = async (jobId: number): Promise<void> => {
    const job = await this.provisioningJobRepository.findById(jobId)
    if (job === null) {
      throw new NotFoundError('Provisioning job')
    }

    if (job.status === 'success') {
      return
    }

    if (job.attemptCount >= job.maxAttempts) {
      await this.failJobAtMaxAttempts(job)
    }

    const orderRow = await this.orderRepository.findByIdForProvisioning(
      job.orderId
    )
    if (orderRow === null) {
      throw new NotFoundError('Order')
    }
    const order = orderRow as OrderForProvisioning
    if (order.plan === undefined) {
      throw new NotFoundError('Order')
    }

    if (isOrderClosedForProvisioning(order)) {
      await this.provisioningJobRepository.updateById(job.id, {
        status: 'failed',
        lastError: 'Provisioning skipped — order refunded or cancelled',
        nextRetryAt: null,
      })
      return
    }

    const plan = order.plan
    const expectedQuantity = getBillingSnapshotQuantity(order.billingSnapshot)
    const existingProfiles = await this.esimProfileRepository.findAllByOrderId(
      order.id
    )
    const fullyProvisionedProfiles = existingProfiles.filter(
      isFullyProvisionedEsimProfile
    )
    if (fullyProvisionedProfiles.length >= expectedQuantity) {
      await this.provisioningJobRepository.updateById(job.id, {
        status: 'success',
        esimProfileId: fullyProvisionedProfiles[0]?.id ?? job.esimProfileId,
        completedAt: job.completedAt ?? new Date(),
        lastError: null,
        nextRetryAt: null,
      })
      return
    }

    const provider = await this.providerRepository.findByIdWithCredentials(
      plan.providerId
    )
    if (provider === null) {
      throw new NotFoundError('Provider')
    }

    if (provider.slug !== 'airalo') {
      throw new AppError(
        'Only Airalo provisioning is supported',
        400,
        'UNSUPPORTED_PROVIDER'
      )
    }

    const lock = await acquireRedisLock(
      `provision:order:${order.id}`,
      PROVISION_LOCK_TTL_MS
    )
    if (lock === null) {
      throw new ProviderRateLimitError(
        'Order provisioning already in progress',
        PROVISION_LOCK_RETRY_MS
      )
    }

    const credentials = decryptApiCredentials(provider.apiCredentialsEnc)
    const adapter = new AiraloAdapter(provider.apiBaseUrl, {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
    })

    const packageId = resolveProvisioningPackageId(order, plan)
    const attemptCount = job.attemptCount + 1
    const providerOrderDescription = `mojoSim order #${order.id}`
    const providerRequest = {
      package_id: packageId,
      quantity: expectedQuantity,
      description: providerOrderDescription,
    }

    await this.provisioningJobRepository.updateById(job.id, {
      status: 'processing',
      attemptCount,
      providerRequest,
    })

    try {
      let providerOrders: ProviderOrder[] = []
      let raw: Record<string, unknown> = {
        source: 'airalo_order_lookup',
        matched: false,
      }
      let lookupResult: 'exact' | 'none' | 'mismatch' = 'none'

      try {
        const matchResult = await adapter.findOrderMatchResult(
          providerOrderDescription,
          packageId
        )

        if (matchResult.kind === 'exact') {
          providerOrders = matchResult.orders
          lookupResult = 'exact'
          raw = { source: 'airalo_order_lookup', matched: true }
        } else if (matchResult.kind === 'description_mismatch') {
          lookupResult = 'mismatch'
          logWarn(
            'Airalo order description matched but package_id differed — proceeding with POST',
            {
              orderId: order.id,
              provisioningJobId: job.id,
              packageId,
              foundPackageIds: matchResult.foundPackageIds,
            }
          )
        }
      } catch (lookupError) {
        if (lookupError instanceof ProviderRateLimitError) {
          await this.handleRateLimitFailure(job, attemptCount, lookupError)
          throw lookupError
        }
        throw lookupError
      }

      if (providerOrders.length === 0) {
        const lookupPostDelayMs = env.AIRALO_PROVISION_LOOKUP_POST_DELAY_MS
        if (lookupPostDelayMs > 0) {
          logger.debug('Waiting before Airalo POST after order lookup', {
            orderId: order.id,
            provisioningJobId: job.id,
            delayMs: lookupPostDelayMs,
          })
          await sleepMs(lookupPostDelayMs)
        }

        try {
          const createResult = await adapter.submitOrderWithRaw(
            packageId,
            expectedQuantity,
            providerOrderDescription
          )
          providerOrders = createResult.orders
          raw = createResult.raw
        } catch (submitError) {
          if (submitError instanceof ProviderRateLimitError) {
            await this.handleRateLimitFailure(job, attemptCount, submitError)
            throw submitError
          }

          try {
            const recoveredOrders =
              await adapter.findSubmittedOrdersByDescription(
                providerOrderDescription,
                packageId
              )
            if (recoveredOrders.length === 0) {
              throw submitError
            }
            providerOrders = recoveredOrders
            raw = {
              source: 'airalo_order_lookup_after_submit_error',
              submit_error:
                submitError instanceof Error
                  ? submitError.message
                  : String(submitError),
            }
          } catch (recoveryError) {
            if (recoveryError instanceof ProviderRateLimitError) {
              await this.handleRateLimitFailure(
                job,
                attemptCount,
                recoveryError
              )
              throw recoveryError
            }
            throw submitError
          }
        }
      }

      if (providerOrders.length === 0) {
        throw new AppError(
          'Unable to reconcile Airalo order response',
          502,
          'PROVIDER_ERROR'
        )
      }

      if (providerOrders.length < expectedQuantity) {
        throw new AppError(
          `Airalo returned ${providerOrders.length} eSIM(s), expected ${expectedQuantity}`,
          502,
          'PROVIDER_ERROR'
        )
      }

      const completedAt = new Date()
      const newlyProvisionedIds: number[] = []
      const knownIccids = new Set(
        existingProfiles
          .map((profile) => profile.iccid)
          .filter((iccid): iccid is string => iccid !== null)
      )
      const placeholders = existingProfiles
        .filter(isPlaceholderEsimProfile)
        .sort((a, b) => a.id - b.id)
      let placeholderIndex = 0
      let provisionedCount = fullyProvisionedProfiles.length

      await sequelize.transaction(async (transaction) => {
        for (const providerOrder of providerOrders) {
          if (knownIccids.has(providerOrder.iccid)) {
            continue
          }

          const qrPayloadEnc = encryptQrPayload(providerOrder.qr_payload)
          const placeholder = placeholders[placeholderIndex]
          let esimProfileId: number
          let fromState: 'created' | null = null

          if (placeholder !== undefined) {
            placeholderIndex += 1
            fromState = 'created'
            await this.esimProfileRepository.updateById(
              placeholder.id,
              {
                iccid: providerOrder.iccid,
                qrPayloadEnc,
                installInstructions: providerOrder.install_instructions,
                directAppleInstallationUrl: providerOrder.direct_apple_url,
                lifecycleState: 'assigned',
                lastSyncedAt: completedAt,
                dataAllowanceMb: plan.dataMb,
              },
              { transaction }
            )
            esimProfileId = placeholder.id
          } else {
            const esimProfile = await this.esimProfileRepository.create(
              {
                orderId: order.id,
                providerId: provider.id,
                iccid: providerOrder.iccid,
                ean: null,
                qrPayloadEnc,
                installInstructions: providerOrder.install_instructions,
                directAppleInstallationUrl: providerOrder.direct_apple_url,
                lifecycleState: 'assigned',
                activatedAt: null,
                expiresAt: null,
                lastSyncedAt: completedAt,
                dataAllowanceMb: plan.dataMb,
              },
              { transaction }
            )
            esimProfileId = esimProfile.id
          }

          newlyProvisionedIds.push(esimProfileId)
          knownIccids.add(providerOrder.iccid)
          provisionedCount += 1

          await this.profileStatusHistoryRepository.create(
            {
              esimProfileId,
              fromState,
              toState: 'assigned',
              source: 'provisioning',
              reason: 'Airalo order completed successfully',
              actorId: null,
            },
            { transaction }
          )
        }

        if (provisionedCount < expectedQuantity) {
          throw new AppError(
            `Provisioned ${provisionedCount} of ${expectedQuantity} eSIM(s)`,
            502,
            'PROVIDER_ERROR'
          )
        }

        const firstProfileId =
          fullyProvisionedProfiles[0]?.id ?? newlyProvisionedIds[0] ?? null
        await this.provisioningJobRepository.updateById(
          job.id,
          {
            status: 'success',
            esimProfileId: firstProfileId,
            providerResponse: raw,
            completedAt,
            lastError: null,
            nextRetryAt: null,
          },
          { transaction }
        )
      })

      const allProfiles = await this.esimProfileRepository.findAllByOrderId(
        order.id
      )
      const firstProvisionedId = allProfiles[0]?.id ?? 0

      logger.info('eSIM provisioning succeeded', {
        provisioningJobId: job.id,
        orderId: order.id,
        esimProfileId: firstProvisionedId,
        profilesCreated: newlyProvisionedIds.length,
        expectedQuantity,
        packageId,
        lookupResult,
      })

      for (const esimProfileId of newlyProvisionedIds) {
        const profile = allProfiles.find((row) => row.id === esimProfileId)
        void auditService.createLog({
          action: 'esim.provisioned',
          entityType: 'esim_profiles',
          entityId: esimProfileId,
          actorId: null,
          beforeState: null,
          afterState: {
            iccid: profile?.iccid ?? null,
            order_id: order.id,
            lifecycle_state: 'assigned',
          },
          ipAddress: null,
        })
      }

      if (newlyProvisionedIds.length > 0) {
        const firstName = String(order.user?.firstName ?? '')
        const readySubject =
          expectedQuantity > 1
            ? `Your ${expectedQuantity} eSIMs are ready to install`
            : 'Your eSIM is ready to install'
        const readyBody =
          expectedQuantity > 1
            ? 'Your eSIM QR codes are ready. Open your portal to view installation instructions.'
            : 'Your eSIM QR code is ready. Open your portal to view installation instructions.'

        void notificationService.sendNotification({
          userId: order.userId,
          channel: 'both',
          type: TemplateType.esim_activated,
          subject: readySubject,
          body: readyBody,
          meta: {
            esim_id: firstProvisionedId,
            order_id: order.id,
            quantity: expectedQuantity,
          },
          data: {
            firstName,
            esimId: String(firstProvisionedId),
            iccid: allProfiles[0]?.iccid ?? '',
            quantity: String(expectedQuantity),
          },
        })
      }
    } catch (error) {
      if (error instanceof ProviderRateLimitError) {
        throw error
      }
      const message =
        error instanceof Error ? error.message : 'Unknown provisioning error'
      await this.provisioningJobRepository.updateById(job.id, {
        status: 'failed',
        lastError: message,
        nextRetryAt: computeNextRetryAt(attemptCount),
      })
      throw error
    } finally {
      await releaseRedisLock(lock)
    }
  }

  private failJobAtMaxAttempts = async (
    job: ProvisioningJob
  ): Promise<never> => {
    if (job.status !== 'dead') {
      const message = `Max provisioning attempts (${job.maxAttempts}) exceeded`
      await this.provisioningJobRepository.updateById(job.id, {
        status: 'dead',
        lastError: message,
        nextRetryAt: null,
      })
      await provisioningTerminalFailureService.handleTerminalFailure({
        provisioningJobId: job.id,
        reason: 'bullmq_exhausted',
        lastErrorFromWorker: message,
      })
    }
    throw new UnrecoverableError(
      `Max provisioning attempts (${job.maxAttempts}) exceeded`
    )
  }

  private handleRateLimitFailure = async (
    job: ProvisioningJob,
    attemptCount: number,
    error: ProviderRateLimitError
  ): Promise<void> => {
    if (attemptCount >= job.maxAttempts) {
      await this.failJobAtMaxAttempts(job)
    }

    const nextRetryAt = new Date(Date.now() + error.retryAfterMs)
    await this.provisioningJobRepository.updateById(job.id, {
      status: 'queued',
      lastError: `PROVIDER_RATE_LIMITED: retry after ${nextRetryAt.toISOString()}`,
      nextRetryAt,
    })
    logger.warn('Provisioning deferred due to Airalo rate limit', {
      provisioningJobId: job.id,
      retryAfterMs: error.retryAfterMs,
      nextRetryAt: nextRetryAt.toISOString(),
      attemptCount,
      maxAttempts: job.maxAttempts,
    })
  }
}

export const provisioningService = new ProvisioningService()

/* eslint-disable sonarjs/cognitive-complexity */
import { ProviderRateLimitError } from '../common/errors'
import { logger } from '../common/logger'
import { env } from '../config/env'
import { AiraloAdapter } from '../modules/providers/airalo/airalo.adapter'
import type { Provider } from '../models/provider'
import { EsimProfileRepository } from '../repositories/esim-profile.repository'
import { ProviderRepository } from '../repositories/provider.repository'
import { UsageRecordRepository } from '../repositories/usage-record.repository'
import { decryptApiCredentials } from './provider.service'
import { esimStatusSyncService } from './esim-status-sync.service'
import { resolveEsimDataAllowanceMb } from '../utils/esim-data-allowance'

export type UsageSyncQueuePayload = {
  esimProfileId?: number
  limit?: number
  minIntervalMinutes?: number
}

const sleepMs = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export class UsageSyncService {
  private readonly esimProfileRepository: EsimProfileRepository

  private readonly providerRepository: ProviderRepository

  private readonly usageRecordRepository: UsageRecordRepository

  constructor(
    esimProfileRepository: EsimProfileRepository = new EsimProfileRepository(),
    providerRepository: ProviderRepository = new ProviderRepository(),
    usageRecordRepository: UsageRecordRepository = new UsageRecordRepository()
  ) {
    this.esimProfileRepository = esimProfileRepository
    this.providerRepository = providerRepository
    this.usageRecordRepository = usageRecordRepository
  }

  private buildAiraloAdapter = (provider: Provider): AiraloAdapter => {
    const credentials = decryptApiCredentials(provider.apiCredentialsEnc)
    return new AiraloAdapter(provider.apiBaseUrl, {
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
    })
  }

  syncUsage = async (payload: UsageSyncQueuePayload): Promise<void> => {
    const targetProfiles =
      payload.esimProfileId === undefined
        ? await this.esimProfileRepository.findSyncCandidates(
            payload.limit ?? 100,
            payload.minIntervalMinutes ?? 0
          )
        : []

    if (payload.esimProfileId !== undefined) {
      const single = await this.esimProfileRepository.findById(
        payload.esimProfileId
      )
      if (single) {
        targetProfiles.push(single)
      }
    }

    if (targetProfiles.length === 0) {
      return
    }

    const airaloProviderIds = [
      ...new Set(
        targetProfiles
          .map((profile) => profile.providerId)
          .filter((id) => Number.isFinite(id))
      ),
    ]

    const adaptersByProviderId = new Map<number, AiraloAdapter>()

    for (const providerId of airaloProviderIds) {
      const provider =
        await this.providerRepository.findByIdWithCredentials(providerId)
      if (provider?.slug === 'airalo') {
        adaptersByProviderId.set(providerId, this.buildAiraloAdapter(provider))
      }
    }

    const interRequestDelayMs = env.USAGE_SYNC_INTER_REQUEST_DELAY_MS
    let syncedCount = 0

    for (const profile of targetProfiles) {
      const adapter = adaptersByProviderId.get(profile.providerId)
      if (adapter === undefined || profile.iccid === null) {
        continue
      }

      if (syncedCount > 0 && interRequestDelayMs > 0) {
        await sleepMs(interRequestDelayMs)
      }

      try {
        const usage = await adapter.getEsimUsage(profile.iccid)
        await esimStatusSyncService.reconcileFromProviderStatus(
          profile.id,
          usage.status,
          usage.expired_at
        )

        const refreshedProfile = await this.esimProfileRepository.findById(
          profile.id
        )
        if (
          refreshedProfile !== null &&
          refreshedProfile.expiresAt !== null &&
          refreshedProfile.expiresAt.getTime() <= Date.now() &&
          (refreshedProfile.lifecycleState === 'assigned' ||
            refreshedProfile.lifecycleState === 'activated' ||
            refreshedProfile.lifecycleState === 'suspended')
        ) {
          await esimStatusSyncService.reconcileFromProviderStatus(
            profile.id,
            'expired',
            refreshedProfile.expiresAt
          )
        }

        const latest =
          await this.usageRecordRepository.findLatestByEsimProfileId(profile.id)

        if (usage.is_unlimited) {
          const unchanged = latest !== null && latest.isUnlimited === true
          if (!unchanged) {
            await this.usageRecordRepository.create({
              esimProfileId: profile.id,
              dataUsedMb: 0,
              dataRemainingMb: 0,
              isUnlimited: true,
              source: 'poll',
              recordedAt: new Date(),
            })
          }
        } else if (
          usage.data_used_mb !== null &&
          usage.data_used_mb !== undefined &&
          usage.data_remaining_mb !== null &&
          usage.data_remaining_mb !== undefined
        ) {
          const unchanged =
            latest !== null &&
            !latest.isUnlimited &&
            latest.dataUsedMb === usage.data_used_mb &&
            latest.dataRemainingMb === usage.data_remaining_mb
          if (!unchanged) {
            await this.usageRecordRepository.create({
              esimProfileId: profile.id,
              dataUsedMb: usage.data_used_mb,
              dataRemainingMb: usage.data_remaining_mb,
              isUnlimited: false,
              source: 'poll',
              recordedAt: new Date(),
            })
          }

          const reconciledAllowance = resolveEsimDataAllowanceMb(
            profile.dataAllowanceMb,
            null,
            {
              data_used_mb: usage.data_used_mb,
              data_remaining_mb: usage.data_remaining_mb,
            }
          )
          if (
            profile.dataAllowanceMb === null ||
            reconciledAllowance > profile.dataAllowanceMb
          ) {
            await this.esimProfileRepository.updateById(profile.id, {
              dataAllowanceMb: reconciledAllowance,
            })
          }
        }

        await this.esimProfileRepository.updateById(profile.id, {
          lastSyncedAt: new Date(),
        })
        syncedCount += 1
      } catch (error) {
        if (error instanceof ProviderRateLimitError) {
          logger.warn('Usage sync stopped — Airalo rate limit hit', {
            esimProfileId: profile.id,
            iccid: profile.iccid,
            syncedCount,
            remainingCount: targetProfiles.length - syncedCount,
            retryAfterMs: error.retryAfterMs,
          })
          break
        }

        logger.warn('Usage sync failed for eSIM profile', {
          esimProfileId: profile.id,
          iccid: profile.iccid,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }
  }
}

export const usageSyncService = new UsageSyncService()

import { NotFoundError, ValidationError } from '../common/errors'
import { decryptQrPayload } from '../common/qr-payload-crypto'
import type { EsimProfile } from '../models/esim-profile'
import type { Order } from '../models/order'
import type { Plan } from '../models/plan'
import type { UsageRecord } from '../models/usage-record'
import { EsimProfileRepository } from '../repositories/esim-profile.repository'
import { OrderRepository } from '../repositories/order.repository'
import { resolveEsimDataAllowanceMb } from '../utils/esim-data-allowance'
import { isOrderRefunded } from '../utils/order-refund-guards'

type EsimWithIncludes = EsimProfile & {
  order?: Order & { plan?: Plan }
  usageRecords?: UsageRecord[]
}

export type EsimListItem = {
  id: number
  esim_id: number
  iccid: string | null
  plan_name: string
  plan_type: string
  flag_url: string | null
  region_name: string | null
  data_mb: number
  data_label: string | null
  validity_days: number
  lifecycle_state: EsimProfile['lifecycleState']
  activated_at: Date | null
  expires_at: Date | null
  install_instructions: string | null
  latest_usage: {
    data_used_mb: number
    data_remaining_mb: number
    is_unlimited: boolean
    recorded_at: Date
  } | null
  order_id: number
  created_at: Date
}

export type EsimQrPayload = {
  qr_payload: string
  direct_apple_installation_url: string | null
  install_instructions: string
}

const mapProfileToListItem = (profile: EsimWithIncludes): EsimListItem => {
  const plan = profile.order?.plan
  const latestUsageRecord = profile.usageRecords?.[0]
  const latestUsage =
    latestUsageRecord === undefined
      ? null
      : {
          data_used_mb: latestUsageRecord.dataUsedMb,
          data_remaining_mb: latestUsageRecord.dataRemainingMb,
          is_unlimited: latestUsageRecord.isUnlimited,
          recorded_at: latestUsageRecord.recordedAt,
        }

  return {
    id: profile.id,
    esim_id: profile.id,
    iccid: profile.iccid,
    plan_name: plan?.name ?? 'Plan',
    plan_type: plan?.planType ?? 'local',
    flag_url: plan?.flagUrl ?? null,
    region_name: plan?.regionName ?? null,
    data_mb: resolveEsimDataAllowanceMb(
      profile.dataAllowanceMb,
      plan?.dataMb,
      latestUsage
    ),
    data_label: plan?.dataLabel ?? null,
    validity_days: plan?.validityDays ?? 0,
    lifecycle_state: profile.lifecycleState,
    activated_at: profile.activatedAt,
    expires_at: profile.expiresAt,
    install_instructions: profile.installInstructions,
    latest_usage: latestUsage,
    order_id: profile.orderId,
    created_at: profile.createdAt,
  }
}

export class EsimService {
  private readonly esimProfileRepository: EsimProfileRepository

  private readonly orderRepository: OrderRepository

  constructor(
    esimProfileRepository: EsimProfileRepository = new EsimProfileRepository(),
    orderRepository: OrderRepository = new OrderRepository()
  ) {
    this.esimProfileRepository = esimProfileRepository
    this.orderRepository = orderRepository
  }

  getByIdForUser = async (
    userId: number,
    esimId: number
  ): Promise<EsimListItem> => {
    const profile = await this.esimProfileRepository.findByIdAndUserId(
      esimId,
      userId
    )
    if (profile === null) {
      throw new NotFoundError('eSIM profile')
    }
    return mapProfileToListItem(profile)
  }

  getQrForUser = async (
    userId: number,
    esimId: number
  ): Promise<EsimQrPayload> => {
    const profile = await this.esimProfileRepository.findByIdAndUserId(
      esimId,
      userId
    )
    if (profile === null) {
      throw new NotFoundError('eSIM profile')
    }
    if (profile.lifecycleState === 'deactivated') {
      throw new ValidationError('This eSIM is no longer available')
    }

    if (
      profile.lifecycleState === 'created' ||
      profile.qrPayloadEnc === null ||
      profile.installInstructions === null
    ) {
      throw new ValidationError('eSIM is still being prepared')
    }

    const order = await this.orderRepository.findById(profile.orderId)
    if (order !== null && isOrderRefunded(order)) {
      throw new ValidationError(
        'This eSIM is no longer available — order was refunded'
      )
    }

    const qr_payload = decryptQrPayload(profile.qrPayloadEnc)
    return {
      qr_payload,
      direct_apple_installation_url: profile.directAppleInstallationUrl,
      install_instructions: profile.installInstructions,
    }
  }
}

export const esimService = new EsimService()

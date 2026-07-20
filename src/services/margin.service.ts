import { NotFoundError } from '../common/errors'
import type { Plan } from '../models/plan'
import type { Provider } from '../models/provider'
import { PlanRepository } from '../repositories/plan.repository'
import { ProviderRepository } from '../repositories/provider.repository'
import { calculateSellingPrice } from '../utils/margin.util'

export type RecalculateResult = {
  providerName: string
  plansUpdated: number
  marginPercent: number
}

const toNumber = (value: string): number => Number.parseFloat(value)
const toMoney = (value: number): string => value.toFixed(2)

export class MarginService {
  private readonly providerRepository: ProviderRepository
  private readonly planRepository: PlanRepository

  constructor(
    providerRepository: ProviderRepository = new ProviderRepository(),
    planRepository: PlanRepository = new PlanRepository()
  ) {
    this.providerRepository = providerRepository
    this.planRepository = planRepository
  }

  recalculateProviderPlans = async (
    providerId: number
  ): Promise<RecalculateResult> => {
    const provider = await this.providerRepository.findById(providerId)
    if (provider === null) {
      throw new NotFoundError('Provider')
    }

    const plans = await this.planRepository.findByProviderId(providerId)
    const marginPercent = toNumber(provider.marginPercent)
    for (const plan of plans) {
      const sellingPrice = calculateSellingPrice(
        toNumber(plan.netPrice),
        marginPercent,
        plan.customMarginPercent === null
          ? null
          : toNumber(plan.customMarginPercent)
      )
      await this.planRepository.updateById(plan.id, {
        sellingPrice: toMoney(sellingPrice),
      })
    }

    return {
      providerName: provider.name,
      plansUpdated: plans.length,
      marginPercent,
    }
  }

  recalculatePlan = async (planId: number): Promise<void> => {
    const plan = await this.planRepository.findById(planId)
    if (plan === null) {
      throw new NotFoundError('Plan')
    }
    const typedPlan = plan as Plan & { provider?: Provider }
    if (typedPlan.provider === undefined) {
      throw new NotFoundError('Provider')
    }

    const sellingPrice = calculateSellingPrice(
      toNumber(plan.netPrice),
      toNumber(typedPlan.provider.marginPercent),
      plan.customMarginPercent === null
        ? null
        : toNumber(plan.customMarginPercent)
    )
    await this.planRepository.updateById(plan.id, {
      sellingPrice: toMoney(sellingPrice),
    })
  }
}

export const marginService = new MarginService()

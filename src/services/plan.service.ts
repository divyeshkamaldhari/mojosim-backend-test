import { NotFoundError } from '../common/errors'
import type {
  ListPlansQuery,
  SearchDestinationsQuery,
  SearchPlansQuery,
} from '../dto/plan.dto'
import { PlanRepository } from '../repositories/plan.repository'
import {
  LocalDestinationItem,
  PlanDetail,
  PlanListItem,
  PlanPackageDetails,
  PlanWithRelations,
  RegionDestinationItem,
} from '../types/plan.types'
import {
  appendAvailableDestinationRow,
  asBooleanOrNull,
  asNumberOrNull,
  asStringOrNull,
  mapPlanToDetail,
  mapPlanToListItem,
  normalizeSearchTerm,
  toFilters,
  toRecord,
} from '../helpers/plan.helpers'
export class PlanService {
  private readonly planRepository: PlanRepository

  constructor(planRepository: PlanRepository = new PlanRepository()) {
    this.planRepository = planRepository
  }

  listPlans = async (
    query: ListPlansQuery
  ): Promise<{
    items: PlanListItem[]
    meta: { page: number; limit: number; total: number }
  }> => {
    const filters = toFilters(query)
    const page = query.page
    const limit = query.limit
    if (
      filters.countryCode !== undefined &&
      !(await this.planRepository.isDestinationEnabled(filters.countryCode))
    ) {
      return {
        items: [],
        meta: { page, limit, total: 0 },
      }
    }
    const total = await this.planRepository.countActivePlansWithFilters(filters)
    const ids = await this.planRepository.findActivePlanIdsPaginated(
      filters,
      page,
      limit
    )
    return {
      items: (await this.planRepository.findPlansByIdsWithProvider(ids)).map(
        (p) => mapPlanToListItem(p as PlanWithRelations)
      ),
      meta: { page, limit, total },
    }
  }

  getPlanById = async (id: number): Promise<PlanDetail> => {
    const plan = await this.planRepository.findActivePlanByIdWithDetails(id)
    if (!plan) {
      throw new NotFoundError('Plan')
    }
    const enabledDestinations =
      await this.planRepository.findActiveEnabledDestinationsByPlanId(id)
    if (enabledDestinations.length === 0) {
      throw new NotFoundError('Plan')
    }
    return mapPlanToDetail(plan)
  }

  getPlanDestinationsById = async (
    id: number,
    q?: string
  ): Promise<
    Array<{
      country_code: string
      country_name: string
      flag_url: string | null
    }>
  > => {
    const plan = await this.planRepository.findActivePlanByIdWithDetails(id)
    if (!plan) {
      throw new NotFoundError('Plan')
    }
    const destinations =
      await this.planRepository.findActiveEnabledDestinationsByPlanId(id, q)
    if (destinations.length === 0) {
      throw new NotFoundError('Plan')
    }
    return destinations.map((destination) => ({
      country_code: destination.countryCode,
      country_name: destination.countryName,
      flag_url: destination.countryFlagUrl,
    }))
  }

  getPlanCoverageById = async (id: number): Promise<unknown[]> => {
    const plan = await this.planRepository.findActivePlanByIdWithDetails(id)
    if (!plan) {
      throw new NotFoundError('Plan')
    }
    const enabledDestinations =
      await this.planRepository.findActiveEnabledDestinationsByPlanId(id)
    if (enabledDestinations.length === 0) {
      throw new NotFoundError('Plan')
    }
    return Array.isArray(plan.coverage) ? plan.coverage : []
  }

  getPlanPackageDetailsById = async (
    id: number
  ): Promise<PlanPackageDetails> => {
    const plan = await this.planRepository.findActivePlanByIdWithDetails(id)
    if (!plan) {
      throw new NotFoundError('Plan')
    }
    const enabledDestinations =
      await this.planRepository.findActiveEnabledDestinationsByPlanId(id)
    if (enabledDestinations.length === 0) {
      throw new NotFoundError('Plan')
    }

    const metadata = toRecord(plan.metadata)
    const operator = toRecord(metadata?.operator)

    const activationPolicy = asStringOrNull(operator?.activation_policy)
    const installWindowDays = asNumberOrNull(operator?.install_window_days)
    const isRoaming = asBooleanOrNull(operator?.is_roaming)
    const rechargeability = asBooleanOrNull(operator?.rechargeability)
    const topupGraceWindowDays = asNumberOrNull(
      operator?.topup_grace_window_days
    )
    const otherInfo = asStringOrNull(operator?.other_info)

    let providerActivationDescription =
      'Activation window details are provided by the operator and may vary by package.'
    if (installWindowDays !== null) {
      providerActivationDescription = `You have ${installWindowDays} days from purchase to start using this eSIM by connecting to a supported network in the coverage area.`
    }

    let validityDescription = `This package includes ${plan.validityDays} day(s) validity. Refer to operator activation policy for when validity starts.`
    if (activationPolicy === 'first-usage') {
      validityDescription = `The validity period starts when the eSIM first connects in its coverage area. This package includes ${plan.validityDays} day(s) validity.`
    } else if (activationPolicy === 'installation') {
      validityDescription = `The validity period starts when the eSIM is installed. This package includes ${plan.validityDays} day(s) validity.`
    }

    let ipRoutingDescription =
      'The eSIM IP routing follows operator policy and does not affect package usage.'
    if (isRoaming === true) {
      ipRoutingDescription =
        'The eSIM IP address may appear from outside its coverage area; this does not affect usage.'
    }

    let topupDescription = 'Top-up is not available for this package.'
    if (rechargeability === true) {
      topupDescription = 'Top-up is available once the eSIM is installed.'
      if (topupGraceWindowDays !== null) {
        topupDescription = `Top-up is available. You can top up within ${topupGraceWindowDays} day(s) after expiry/exhaustion.`
      }
    }

    return {
      provider_activation_policy: {
        activation_policy: activationPolicy,
        install_window_days: installWindowDays,
        description: providerActivationDescription,
      },
      validity_policy: {
        activation_policy: activationPolicy,
        validity_days: plan.validityDays,
        description: validityDescription,
      },
      ip_routing: {
        is_roaming: isRoaming,
        note: otherInfo,
        description: ipRoutingDescription,
      },
      top_up_option: {
        rechargeability,
        topup_grace_window_days: topupGraceWindowDays,
        description: topupDescription,
      },
    }
  }

  searchPlans = async (query: SearchPlansQuery): Promise<PlanListItem[]> => {
    return (
      await this.planRepository.findActivePlansByDestinationSearch(query.q)
    ).map((p) => mapPlanToListItem(p as PlanWithRelations))
  }

  listFeaturedPlans = async (): Promise<PlanListItem[]> => {
    return (await this.planRepository.findActiveFeaturedPlans()).map((p) =>
      mapPlanToListItem(p as PlanWithRelations)
    )
  }

  listDestinationCatalog = async (
    query: SearchDestinationsQuery
  ): Promise<{
    countries: Array<{
      country_code: string
      country_name: string
    }>
    regions: string[]
  }> => {
    const rows =
      await this.planRepository.findDistinctDestinationsForActivePlans()
    const regions =
      await this.planRepository.findDistinctRegionsForActivePlans()
    const searchTerm = normalizeSearchTerm(query.q)
    const countries = rows
      .filter((row) => {
        if (searchTerm === null) {
          return true
        }
        return (
          row.countryCode.toLowerCase().includes(searchTerm) ||
          row.countryName.toLowerCase().includes(searchTerm)
        )
      })
      .map((r) => ({
        country_code: r.countryCode,
        country_name: r.countryName,
      }))
    const filteredRegions = regions.filter((regionName) => {
      if (searchTerm === null) {
        return true
      }
      return regionName.toLowerCase().includes(searchTerm)
    })
    return { countries, regions: filteredRegions }
  }

  listAvailableDestinationsByPlanType = async (
    query: SearchDestinationsQuery
  ): Promise<{
    local: LocalDestinationItem[]
    regional: RegionDestinationItem[]
    global: RegionDestinationItem[]
  }> => {
    const rows = await this.planRepository.findAvailableDestinationsByPlanType()
    const searchTerm = normalizeSearchTerm(query.q)
    const local: LocalDestinationItem[] = []
    const regional: RegionDestinationItem[] = []
    const global: RegionDestinationItem[] = []
    const regionalSeen = new Set<string>()
    const globalSeen = new Set<string>()

    for (const row of rows) {
      appendAvailableDestinationRow(
        row,
        searchTerm,
        local,
        regional,
        global,
        regionalSeen,
        globalSeen
      )
    }

    return { local, regional, global }
  }
}

export const planService = new PlanService()

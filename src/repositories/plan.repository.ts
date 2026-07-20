import {
  Op,
  QueryTypes,
  col,
  fn,
  where as sqlWhere,
  type Transaction,
  type WhereOptions,
} from 'sequelize'

import { sequelize } from '../config/db'
import { Plan } from '../models/plan'
import { PlanDestination } from '../models/plan-destination'
import { PlanTranslation } from '../models/plan-translation'
import { Provider } from '../models/provider'
import { DestinationControl } from '../models/destination-control'
import type { ProviderCoverage } from '../modules/providers/provider.interface'

export type PlanListFilters = {
  countryCode?: string
  region?: string
  isFeatured?: boolean
  providerId?: number
  dataLabelNormalized?: string
  validityDays?: number
  planType?: 'local' | 'regional' | 'global'
  airaloPackageType?: string
}

export type AdminPlanFilters = {
  isActive?: boolean
  isFeatured?: boolean
  providerId?: number
  countryCode?: string
  region?: string
  dataLabelNormalized?: string
  validityDays?: number
  planType?: 'local' | 'regional' | 'global'
  airaloPackageType?: string
}

export type UpdatePlanData = {
  isActive?: boolean
  isFeatured?: boolean
  customMarginPercent?: string | null
  sellingPrice?: string | null
}

export type PlanSyncRowData = {
  providerId: number
  providerSku: string
  name: string
  description: string
  dataMb: number
  dataLabel: string | null
  validityDays: number
  currency: string
  price: string
  netPrice: string
  customMarginPercent: string | null
  sellingPrice: string
  planType: 'local' | 'regional' | 'global'
  flagUrl: string | null
  regionName: string | null
  airaloPackageType: string
  metadata: unknown
  coverage: ProviderCoverage[] | null
  syncedAt: Date
  isActive: boolean
  isFeatured: boolean
}

export class PlanRepository {
  countActivePlansWithFilters = async (
    filters: PlanListFilters
  ): Promise<number> => {
    const { sql, replacements } = this.buildFilteredPlansSqlParts(filters)
    // NOSONAR: SQL uses fixed clauses; dynamic values are bound via replacements.
    const rows = await sequelize.query<{ c: string }>(
      `SELECT COUNT(DISTINCT p.id)::int AS c FROM plans p
       INNER JOIN plan_destinations pd ON pd.plan_id = p.id
       LEFT JOIN destination_controls dc ON dc.country_code = pd.country_code
       WHERE ${sql}`,
      { replacements, type: QueryTypes.SELECT }
    )
    const first = rows[0]
    return first ? Number.parseInt(first.c, 10) : 0
  }

  findActivePlanIdsPaginated = async (
    filters: PlanListFilters,
    page: number,
    limit: number
  ): Promise<number[]> => {
    const offset = (page - 1) * limit
    const { sql, replacements } = this.buildFilteredPlansSqlParts(filters)
    // NOSONAR: SQL uses fixed clauses; dynamic values are bound via replacements.
    const rows = await sequelize.query<{ id: number }>(
      `SELECT DISTINCT p.id FROM plans p
       INNER JOIN plan_destinations pd ON pd.plan_id = p.id
       LEFT JOIN destination_controls dc ON dc.country_code = pd.country_code
       WHERE ${sql}
       ORDER BY p.id ASC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: { ...replacements, limit, offset },
        type: QueryTypes.SELECT,
      }
    )
    return rows.map((r) => r.id)
  }

  private buildFilteredPlansSqlParts(filters: PlanListFilters): {
    sql: string
    replacements: Record<string, string | number>
  } {
    const parts: string[] = [
      'p.is_active = true',
      'COALESCE(dc.is_active, true) = true',
    ]
    const replacements: Record<string, string | number> = {}

    if (filters.providerId !== undefined) {
      parts.push('p.provider_id = :providerId')
      replacements.providerId = filters.providerId
    }
    if (filters.isFeatured === true) {
      parts.push('p.is_featured = true')
    }
    if (filters.countryCode !== undefined) {
      parts.push('pd.country_code = :countryCode')
      replacements.countryCode = filters.countryCode
    }
    if (filters.region !== undefined) {
      parts.push('p.region_name ILIKE :region')
      replacements.region = filters.region
    }
    if (filters.planType !== undefined) {
      parts.push('p.plan_type = :planType')
      replacements.planType = filters.planType
    }
    if (filters.airaloPackageType !== undefined) {
      parts.push('p.airalo_package_type = :airaloPackageType')
      replacements.airaloPackageType = filters.airaloPackageType
    }
    if (filters.dataLabelNormalized !== undefined) {
      const whitespacePattern = String.raw`\s+`
      parts.push(
        `regexp_replace(lower(coalesce(p.data_label, '')), '${whitespacePattern}', '', 'g') = :dataLabelNormalized`
      )
      replacements.dataLabelNormalized = filters.dataLabelNormalized
    }
    if (filters.validityDays !== undefined) {
      parts.push('p.validity_days = :validityDays')
      replacements.validityDays = filters.validityDays
    }

    return { sql: parts.join(' AND '), replacements }
  }

  findPlansByIdsWithProviderAndDestinations = async (
    ids: number[]
  ): Promise<Plan[]> => {
    if (ids.length === 0) {
      return []
    }
    return Plan.findAll({
      where: { id: { [Op.in]: ids }, isActive: true },
      include: [
        {
          model: Provider,
          as: 'provider',
          attributes: ['name'],
        },
        {
          model: PlanDestination,
          as: 'destinations',
          required: false,
        },
      ],
      order: [['id', 'ASC']],
    })
  }

  findPlansByIdsWithProvider = async (ids: number[]): Promise<Plan[]> => {
    if (ids.length === 0) {
      return []
    }
    return Plan.findAll({
      where: { id: { [Op.in]: ids }, isActive: true },
      include: [
        {
          model: Provider,
          as: 'provider',
          attributes: ['name'],
        },
      ],
      order: [['id', 'ASC']],
    })
  }

  findActivePlanByIdWithDetails = async (id: number): Promise<Plan | null> => {
    return Plan.findOne({
      where: { id, isActive: true },
      include: [
        {
          model: Provider,
          as: 'provider',
          attributes: ['name', 'marginPercent'],
        },
      ],
    })
  }

  findActivePlansByDestinationSearch = async (
    searchTerm: string
  ): Promise<Plan[]> => {
    const rows = await sequelize.query<{ id: number }>(
      `
      SELECT DISTINCT p.id
      FROM plans p
      INNER JOIN plan_destinations pd ON pd.plan_id = p.id
      LEFT JOIN destination_controls dc ON dc.country_code = pd.country_code
      WHERE p.is_active = true
        AND COALESCE(dc.is_active, true) = true
        AND (
          pd.country_code ILIKE :search
          OR pd.country_name ILIKE :search
          OR p.name ILIKE :search
          OR COALESCE(p.region_name, '') ILIKE :search
        )
      ORDER BY p.id ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { search: `%${searchTerm}%` },
      }
    )
    const ids = rows.map((row) => row.id)
    if (ids.length === 0) {
      return []
    }
    return this.findPlansByIdsWithProvider(ids)
  }

  findActiveFeaturedPlans = async (): Promise<Plan[]> => {
    const rows = await sequelize.query<{ id: number }>(
      `
      SELECT DISTINCT p.id
      FROM plans p
      INNER JOIN plan_destinations pd ON pd.plan_id = p.id
      LEFT JOIN destination_controls dc ON dc.country_code = pd.country_code
      WHERE p.is_active = true
        AND p.is_featured = true
        AND COALESCE(dc.is_active, true) = true
      ORDER BY p.id ASC
      `,
      { type: QueryTypes.SELECT }
    )
    return this.findPlansByIdsWithProvider(rows.map((row) => row.id))
  }

  findDistinctDestinationsForActivePlans = async (): Promise<
    Array<{ countryCode: string; countryName: string }>
  > => {
    const rows = await sequelize.query<{
      country_code: string
      country_name: string
    }>(
      `
      SELECT DISTINCT pd.country_code, pd.country_name
      FROM plan_destinations pd
      INNER JOIN plans p ON p.id = pd.plan_id AND p.is_active = true
      LEFT JOIN destination_controls dc ON dc.country_code = pd.country_code
      WHERE COALESCE(dc.is_active, true) = true
      ORDER BY country_name ASC
      `,
      { type: QueryTypes.SELECT }
    )
    return rows.map((r) => ({
      countryCode: r.country_code,
      countryName: r.country_name,
    }))
  }

  findDistinctRegionsForActivePlans = async (): Promise<string[]> => {
    const rows = await sequelize.query<{ region_name: string | null }>(
      `
      SELECT DISTINCT p.region_name
      FROM plans p
      WHERE p.is_active = true
      ORDER BY p.region_name ASC NULLS LAST
      `,
      { type: QueryTypes.SELECT }
    )
    return rows
      .map((r) => r.region_name)
      .filter((r): r is string => r !== null && r.length > 0)
  }

  findAvailableDestinationsByPlanType = async (): Promise<
    Array<{
      planType: 'local' | 'regional' | 'global'
      regionName: string | null
      countryCode: string
      countryName: string
      flagUrl: string | null
    }>
  > => {
    const rows = await sequelize.query<{
      plan_type: 'local' | 'regional' | 'global'
      region_name: string | null
      country_code: string
      country_name: string
      flag_url: string | null
    }>(
      `
      SELECT DISTINCT
        p.plan_type,
        p.region_name,
        pd.country_code,
        pd.country_name,
        p.flag_url
      FROM plans p
      INNER JOIN plan_destinations pd ON pd.plan_id = p.id
      LEFT JOIN destination_controls dc ON dc.country_code = pd.country_code
      WHERE p.is_active = true AND COALESCE(dc.is_active, true) = true
      ORDER BY p.plan_type ASC, p.region_name ASC NULLS LAST, pd.country_name ASC
      `,
      { type: QueryTypes.SELECT }
    )
    return rows.map((r) => ({
      planType: r.plan_type,
      regionName: r.region_name,
      countryCode: r.country_code,
      countryName: r.country_name,
      flagUrl: r.flag_url,
    }))
  }

  findAllAdmin = async (
    filters: AdminPlanFilters,
    page: number,
    limit: number
  ): Promise<{ rows: Plan[]; count: number }> => {
    const offset = (page - 1) * limit
    const where: WhereOptions = {}
    const andConditions: Array<ReturnType<typeof sqlWhere>> = []

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive
    }
    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured
    }
    if (filters.providerId !== undefined) {
      where.providerId = filters.providerId
    }
    if (filters.region !== undefined) {
      where.regionName = { [Op.iLike]: filters.region }
    }
    if (filters.planType !== undefined) {
      where.planType = filters.planType
    }
    if (filters.airaloPackageType !== undefined) {
      where.airaloPackageType = filters.airaloPackageType
    }
    if (filters.dataLabelNormalized !== undefined) {
      const whitespacePattern = String.raw`\s+`
      andConditions.push(
        sqlWhere(
          fn(
            'regexp_replace',
            fn('lower', fn('coalesce', col('data_label'), '')),
            whitespacePattern,
            '',
            'g'
          ),
          filters.dataLabelNormalized
        )
      )
    }
    if (filters.validityDays !== undefined) {
      where.validityDays = filters.validityDays
    }
    const whereClause: WhereOptions =
      andConditions.length > 0 ? { ...where, [Op.and]: andConditions } : where

    const include: Array<Record<string, unknown>> = [
      {
        model: Provider,
        as: 'provider',
        attributes: ['id', 'name', 'marginPercent'],
      },
      {
        model: PlanTranslation,
        as: 'translations',
        required: false,
      },
    ]
    if (filters.countryCode !== undefined) {
      include.push({
        model: PlanDestination,
        as: 'destinations',
        required: true,
        where: { countryCode: filters.countryCode },
      })
    }

    const { rows, count } = await Plan.findAndCountAll({
      where: whereClause,
      include,
      order: [['id', 'ASC']],
      limit,
      offset,
      distinct: true,
    })

    return { rows, count }
  }

  findById = async (id: number): Promise<Plan | null> => {
    return Plan.findByPk(id, {
      include: [
        {
          model: Provider,
          as: 'provider',
          attributes: ['id', 'name', 'marginPercent'],
        },
        {
          model: PlanTranslation,
          as: 'translations',
          required: false,
        },
      ],
    })
  }

  findDestinationsByPlanId = async (
    planId: number
  ): Promise<
    Array<{
      countryCode: string
      countryName: string
      countryFlagUrl: string | null
    }>
  > => {
    const rows = await sequelize.query<{
      country_code: string
      country_name: string
      country_flag_url: string | null
    }>(
      `
      SELECT DISTINCT pd.country_code, pd.country_name, pd.country_flag_url
      FROM plan_destinations pd
      WHERE pd.plan_id = :planId
      ORDER BY pd.country_name ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { planId },
      }
    )
    return rows.map((row) => ({
      countryCode: row.country_code,
      countryName: row.country_name,
      countryFlagUrl: row.country_flag_url,
    }))
  }

  findActiveEnabledDestinationsByPlanId = async (
    planId: number,
    q?: string
  ): Promise<
    Array<{
      countryCode: string
      countryName: string
      countryFlagUrl: string | null
    }>
  > => {
    const rows = await sequelize.query<{
      country_code: string
      country_name: string
      country_flag_url: string | null
    }>(
      `
      SELECT DISTINCT pd.country_code, pd.country_name, pd.country_flag_url
      FROM plan_destinations pd
      INNER JOIN plans p ON p.id = pd.plan_id
      LEFT JOIN destination_controls dc ON dc.country_code = pd.country_code
      WHERE pd.plan_id = :planId
        AND p.is_active = true
        AND COALESCE(dc.is_active, true) = true
        AND (
          :q IS NULL
          OR pd.country_code ILIKE :qLike
          OR pd.country_name ILIKE :qLike
        )
      ORDER BY pd.country_name ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: {
          planId,
          q: q?.trim() ? q.trim() : null,
          qLike: q?.trim() ? `%${q.trim()}%` : null,
        },
      }
    )
    return rows.map((row) => ({
      countryCode: row.country_code,
      countryName: row.country_name,
      countryFlagUrl: row.country_flag_url,
    }))
  }

  updateById = async (
    id: number,
    data: Partial<UpdatePlanData>
  ): Promise<void> => {
    const payload: Record<string, unknown> = {
      ...(data.isActive === undefined ? {} : { isActive: data.isActive }),
      ...(data.isFeatured === undefined ? {} : { isFeatured: data.isFeatured }),
      ...(data.customMarginPercent === undefined
        ? {}
        : { customMarginPercent: data.customMarginPercent }),
      ...(data.sellingPrice === undefined
        ? {}
        : { sellingPrice: data.sellingPrice }),
    }

    await Plan.update(payload, { where: { id } })
  }

  findByProviderAndSku = async (
    providerId: number,
    providerSku: string,
    transaction?: Transaction
  ): Promise<Plan | null> => {
    return Plan.findOne({
      where: { providerId, providerSku },
      transaction,
    })
  }

  findActiveByProviderSku = async (
    providerSku: string
  ): Promise<Plan | null> => {
    return Plan.findOne({
      where: { providerSku, isActive: true },
      include: [
        { model: Provider, as: 'provider', attributes: ['id', 'slug'] },
      ],
    })
  }

  createPlanSyncRow = async (
    data: PlanSyncRowData,
    transaction?: Transaction
  ): Promise<Plan> => {
    return Plan.create(
      {
        providerId: data.providerId,
        providerSku: data.providerSku,
        name: data.name,
        description: data.description,
        dataMb: data.dataMb,
        dataLabel: data.dataLabel,
        validityDays: data.validityDays,
        currency: data.currency,
        price: data.price,
        netPrice: data.netPrice,
        customMarginPercent: data.customMarginPercent,
        sellingPrice: data.sellingPrice,
        planType: data.planType,
        flagUrl: data.flagUrl,
        regionName: data.regionName,
        airaloPackageType: data.airaloPackageType,
        metadata: data.metadata,
        coverage: data.coverage,
        syncedAt: data.syncedAt,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
      },
      { transaction }
    )
  }

  updatePlanSyncRow = async (
    id: number,
    data: Omit<PlanSyncRowData, 'providerId' | 'providerSku' | 'isFeatured'>,
    transaction?: Transaction
  ): Promise<void> => {
    await Plan.update(
      {
        name: data.name,
        description: data.description,
        dataMb: data.dataMb,
        dataLabel: data.dataLabel,
        validityDays: data.validityDays,
        currency: data.currency,
        price: data.price,
        netPrice: data.netPrice,
        sellingPrice: data.sellingPrice,
        planType: data.planType,
        flagUrl: data.flagUrl,
        regionName: data.regionName,
        airaloPackageType: data.airaloPackageType,
        metadata: data.metadata,
        coverage: data.coverage,
        syncedAt: data.syncedAt,
        isActive: data.isActive,
      },
      { where: { id }, transaction }
    )
  }

  deleteDestinationsByPlanId = async (
    planId: number,
    transaction?: Transaction
  ): Promise<void> => {
    await PlanDestination.destroy({ where: { planId }, transaction })
  }

  bulkCreateDestinations = async (
    rows: Array<{
      planId: number
      countryCode: string
      countryName: string
      countryFlagUrl: string | null
    }>,
    transaction?: Transaction
  ): Promise<void> => {
    if (rows.length === 0) {
      return
    }
    await PlanDestination.bulkCreate(
      rows.map((r) => ({
        planId: r.planId,
        countryCode: r.countryCode,
        countryName: r.countryName,
        countryFlagUrl: r.countryFlagUrl,
      })),
      { transaction }
    )
  }

  deactivatePlansNotInSync = async (
    providerId: number,
    activeSkus: string[],
    transaction?: Transaction
  ): Promise<number> => {
    if (activeSkus.length === 0) {
      const [affected] = await Plan.update(
        { isActive: false, isFeatured: false },
        { where: { providerId }, transaction }
      )
      return affected
    }
    const [affected] = await Plan.update(
      { isActive: false, isFeatured: false },
      {
        where: {
          providerId,
          providerSku: { [Op.notIn]: activeSkus },
        },
        transaction,
      }
    )
    return affected
  }

  findByProviderId = async (
    providerId: number,
    transaction?: Transaction
  ): Promise<Plan[]> => {
    return Plan.findAll({
      where: { providerId },
      order: [['id', 'ASC']],
      transaction,
    })
  }

  findDistinctDestinationsForAdmin = async (
    searchTerm?: string
  ): Promise<
    Array<{
      planType: 'local' | 'regional' | 'global'
      countryCode: string
      countryName: string
      regionName: string | null
      flagUrl: string | null
      isActive: boolean | null
      totalPlans: number
    }>
  > => {
    const normalizedSearch =
      searchTerm !== undefined ? searchTerm.trim().toLowerCase() : ''
    const hasSearch = normalizedSearch.length > 0
    const localRows = await sequelize.query<{
      plan_type: string
      country_code: string
      country_name: string
      region_name: null
      flag_url: string | null
      is_active: boolean
      total_plans: string
    }>(
      `
      SELECT
        'local' AS plan_type,
        pd.country_code,
        MIN(pd.country_name) AS country_name,
        NULL::varchar AS region_name,
        p.flag_url,
        COALESCE(dc.is_active, true) AS is_active,
        COUNT(DISTINCT pd.plan_id)::int AS total_plans
      FROM plan_destinations pd
      INNER JOIN plans p ON p.id = pd.plan_id
      LEFT JOIN destination_controls dc ON dc.country_code = pd.country_code
      WHERE p.plan_type = 'local'
      ${hasSearch ? 'AND (lower(pd.country_code) LIKE :search OR lower(pd.country_name) LIKE :search)' : ''}
      GROUP BY pd.country_code, p.flag_url, COALESCE(dc.is_active, true)
      ORDER BY country_name ASC
      `,
      {
        type: QueryTypes.SELECT,
        replacements: hasSearch ? { search: `%${normalizedSearch}%` } : {},
      }
    )

    const regionalRows = await sequelize.query<{
      plan_type: string
      country_code: ''
      country_name: ''
      region_name: string | null
      flag_url: string | null
      is_active: null
      total_plans: string
    }>(
      `
      SELECT
        'regional' AS plan_type,
        ''::varchar(16) AS country_code,
        ''::varchar AS country_name,
        p.region_name,
        p.flag_url,
        NULL::boolean AS is_active,
        COUNT(DISTINCT p.id)::int AS total_plans
      FROM plans p
      WHERE p.plan_type = 'regional'
      ${hasSearch ? "AND lower(coalesce(p.region_name, '')) LIKE :search" : ''}
      GROUP BY p.region_name, p.flag_url
      ORDER BY p.region_name ASC NULLS LAST
      `,
      {
        type: QueryTypes.SELECT,
        replacements: hasSearch ? { search: `%${normalizedSearch}%` } : {},
      }
    )

    const globalRows = await sequelize.query<{
      plan_type: string
      country_code: ''
      country_name: ''
      region_name: string | null
      flag_url: string | null
      is_active: null
      total_plans: string
    }>(
      `
      SELECT
        'global' AS plan_type,
        ''::varchar(16) AS country_code,
        ''::varchar AS country_name,
        p.region_name,
        p.flag_url,
        NULL::boolean AS is_active,
        COUNT(DISTINCT p.id)::int AS total_plans
      FROM plans p
      WHERE p.plan_type = 'global'
      ${hasSearch ? "AND lower(coalesce(p.region_name, '')) LIKE :search" : ''}
      GROUP BY p.region_name, p.flag_url
      ORDER BY p.region_name ASC NULLS LAST
      `,
      {
        type: QueryTypes.SELECT,
        replacements: hasSearch ? { search: `%${normalizedSearch}%` } : {},
      }
    )

    return [...localRows, ...regionalRows, ...globalRows].map((r) => ({
      planType: r.plan_type as 'local' | 'regional' | 'global',
      countryCode: r.country_code,
      countryName: r.country_name,
      regionName: r.region_name,
      flagUrl: r.flag_url,
      isActive: r.is_active,
      totalPlans: Number.parseInt(r.total_plans, 10),
    }))
  }

  upsertDestinationControl = async (
    countryCode: string,
    countryName: string,
    isActive: boolean
  ): Promise<DestinationControl> => {
    const existing = await DestinationControl.findOne({
      where: { countryCode },
    })
    if (existing) {
      await DestinationControl.update(
        { countryName, isActive },
        { where: { countryCode } }
      )
      const updated = await DestinationControl.findOne({
        where: { countryCode },
      })
      return updated ?? existing
    }
    return DestinationControl.create({
      countryCode,
      countryName,
      isActive,
    })
  }

  findActiveDestinationCountryByCode = async (
    countryCode: string
  ): Promise<{ countryCode: string; countryName: string } | null> => {
    const row = await sequelize.query<{
      country_code: string
      country_name: string
    }>(
      `
      SELECT DISTINCT pd.country_code, pd.country_name
      FROM plan_destinations pd
      INNER JOIN plans p ON p.id = pd.plan_id AND p.is_active = true
      WHERE pd.country_code = :countryCode
      ORDER BY pd.country_name ASC
      LIMIT 1
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { countryCode },
        plain: true,
      }
    )
    if (!row) {
      return null
    }
    return {
      countryCode: row.country_code,
      countryName: row.country_name,
    }
  }

  isDestinationEnabled = async (countryCode: string): Promise<boolean> => {
    const control = await DestinationControl.findOne({ where: { countryCode } })
    return control?.isActive !== false
  }

  findDisabledDestinationCodes = async (
    countryCodes: string[]
  ): Promise<Set<string>> => {
    if (countryCodes.length === 0) {
      return new Set<string>()
    }
    const rows = await DestinationControl.findAll({
      attributes: ['countryCode'],
      where: {
        countryCode: { [Op.in]: countryCodes },
        isActive: false,
      },
      raw: true,
    })
    return new Set(rows.map((row) => row.countryCode))
  }

  findPrimaryCountryNamesByPlanIds = async (
    planIds: number[]
  ): Promise<Map<number, string>> => {
    if (planIds.length === 0) {
      return new Map()
    }

    const rows = await sequelize.query<{
      plan_id: number
      country_name: string
    }>(
      `
      SELECT plan_id, MIN(country_name) AS country_name
      FROM plan_destinations
      WHERE plan_id IN (:planIds)
      GROUP BY plan_id
      `,
      {
        type: QueryTypes.SELECT,
        replacements: { planIds },
      }
    )

    return new Map(rows.map((row) => [row.plan_id, row.country_name]))
  }
}

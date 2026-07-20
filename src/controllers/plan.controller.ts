import { Request, Response } from 'express'

import {
  ListPlansQuerySchema,
  PlanIdParamsSchema,
  SearchDestinationsQuerySchema,
  SearchPlansQuerySchema,
} from '../dto/plan.dto'
import { planService } from '../services/plan.service'

export const listPlans = async (req: Request, res: Response): Promise<void> => {
  const query = ListPlansQuerySchema.parse(req.query)
  const result = await planService.listPlans(query)
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta,
  })
}

export const getPlanById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = PlanIdParamsSchema.parse(req.params)
  const data = await planService.getPlanById(id)
  res.status(200).json({ success: true, data })
}

export const getPlanDestinationsById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = PlanIdParamsSchema.parse(req.params)
  const { q } = SearchDestinationsQuerySchema.parse(req.query)
  const data = await planService.getPlanDestinationsById(id, q)
  res.status(200).json({ success: true, data })
}

export const getPlanCoverageById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = PlanIdParamsSchema.parse(req.params)
  const data = await planService.getPlanCoverageById(id)
  res.status(200).json({ success: true, data })
}

export const getPlanPackageDetailsById = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = PlanIdParamsSchema.parse(req.params)
  const data = await planService.getPlanPackageDetailsById(id)
  res.status(200).json({ success: true, data })
}

export const searchPlans = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = SearchPlansQuerySchema.parse(req.query)
  const data = await planService.searchPlans(query)
  res.status(200).json({ success: true, data })
}

export const listFeaturedPlans = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const data = await planService.listFeaturedPlans()
  res.status(200).json({ success: true, data })
}

export const listDestinationCatalog = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = SearchDestinationsQuerySchema.parse(req.query)
  const data = await planService.listDestinationCatalog(query)
  res.status(200).json({ success: true, data })
}

export const listAvailableDestinationsByPlanType = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = SearchDestinationsQuerySchema.parse(req.query)
  const data = await planService.listAvailableDestinationsByPlanType(query)
  res.status(200).json({ success: true, data })
}

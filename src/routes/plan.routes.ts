import { Router } from 'express'

import {
  getPlanById,
  getPlanCoverageById,
  getPlanDestinationsById,
  getPlanPackageDetailsById,
  listAvailableDestinationsByPlanType,
  listDestinationCatalog,
  listFeaturedPlans,
  listPlans,
  searchPlans,
} from '../controllers/plan.controller'

export const planRouter = Router()

planRouter.get('/search', searchPlans)
planRouter.get('/featured', listFeaturedPlans)
planRouter.get('/destinations/available', listAvailableDestinationsByPlanType)
planRouter.get('/destinations', listDestinationCatalog)
planRouter.get('/:id/coverage', getPlanCoverageById)
planRouter.get('/:id/destinations', getPlanDestinationsById)
planRouter.get('/', listPlans)
planRouter.get('/:id/package-details', getPlanPackageDetailsById)
planRouter.get('/:id', getPlanById)

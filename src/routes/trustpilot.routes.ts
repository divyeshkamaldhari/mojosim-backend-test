import { Router } from 'express'

import { getTrustpilotSummary } from '../controllers/trustpilot.controller'

export const trustpilotRouter = Router()

trustpilotRouter.get('/summary', getTrustpilotSummary)

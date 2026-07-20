import { Request, Response } from 'express'

import { trustpilotSummaryService } from '../services/trustpilot-summary.service'

export const getTrustpilotSummary = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const data = await trustpilotSummaryService.getPublicSummary()
  res.status(200).json({ success: true, data })
}

import { Request, Response } from 'express'

import { SubscribeNewsletterSchema } from '../dto/newsletter.dto'
import { newsletterService } from '../services/newsletter.service'

export const subscribeNewsletter = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = SubscribeNewsletterSchema.parse(req.body)
  const data = await newsletterService.subscribe(body)
  res.status(201).json({ success: true, data })
}

import { Request, Response } from 'express'

import { ValidatePromoCodeSchema } from '../dto/promo-code.dto'
import { promoCodeService } from '../services/promo-code.service'

export const validatePromoCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = ValidatePromoCodeSchema.parse(req.body)
  const data = await promoCodeService.validateForCheckout(
    body.code,
    body.email,
    body.subtotal
  )
  res.status(200).json({ success: true, data })
}

import { Request, Response } from 'express'

import { ListCompatibleDevicesQuerySchema } from '../dto/compatibility.dto'
import { deviceCompatibilitySyncService } from '../services/device-compatibility-sync.service'

export const listCompatibleDevices = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = ListCompatibleDevicesQuerySchema.parse(req.query)
  const result =
    await deviceCompatibilitySyncService.listCompatibleDevices(query)
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta,
  })
}

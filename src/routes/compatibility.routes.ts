import { Router } from 'express'

import { listCompatibleDevices } from '../controllers/compatibility.controller'

export const compatibilityRouter = Router()

compatibilityRouter.get('/compatible-devices', listCompatibleDevices)

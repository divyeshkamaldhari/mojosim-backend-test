import { Router } from 'express'

import { getPublicContent } from '../controllers/content-block.controller'

export const contentRouter = Router()

contentRouter.get('/:key', getPublicContent)

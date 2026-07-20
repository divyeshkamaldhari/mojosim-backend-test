import { Router } from 'express'

import { authenticate, requireRole } from '../middlewares/auth.middleware'
import {
  createOrder,
  getOrderById,
  getOrderStatus,
  refreshOrderPaymentIntent,
  verifyOrderPayment,
} from '../controllers/order.controller'
import {
  getInvoiceByOrder,
  getInvoiceDownload,
} from '../controllers/invoice.controller'

export const orderRouter = Router()

orderRouter.use(authenticate, requireRole('customer'))

orderRouter.post('/', createOrder)
orderRouter.get('/:id', getOrderById)
orderRouter.get('/:id/status', getOrderStatus)
orderRouter.post('/:id/verify-payment', verifyOrderPayment)
orderRouter.post('/:id/payment-intent', refreshOrderPaymentIntent)
orderRouter.get('/:id/invoice', getInvoiceByOrder)
orderRouter.get('/:id/invoice/download', getInvoiceDownload)

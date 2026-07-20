import { Request, Response } from 'express'
import { Readable } from 'node:stream'

import { UnauthorizedError } from '../common/errors'
import {
  AdminListInvoicesQuerySchema,
  InvoiceIdParamsSchema,
  InvoiceOrderParamsSchema,
  ListCustomerInvoicesQuerySchema,
} from '../dto/invoice.dto'
import { invoiceService } from '../services/invoice.service'

const requireUserId = (req: Request): number => {
  const userId = req.user?.userId
  if (userId === undefined) {
    throw new UnauthorizedError()
  }
  return userId
}

export const getInvoiceByOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { id: orderId } = InvoiceOrderParamsSchema.parse(req.params)
  const data = await invoiceService.getInvoiceByOrderId(orderId, userId)
  res.status(200).json({ success: true, data })
}

export const listInvoices = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const query = ListCustomerInvoicesQuerySchema.parse(req.query)
  const result = await invoiceService.getInvoicesForUser(userId, query)
  res.status(200).json({ success: true, data: result.items, meta: result.meta })
}

export const getInvoiceDownload = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { id: orderId } = InvoiceOrderParamsSchema.parse(req.params)
  const { body, contentType, filename } =
    await invoiceService.downloadInvoicePdfByOrderId(orderId, userId)

  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  if (body instanceof Readable) {
    body.pipe(res)
    return
  }

  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Unable to download invoice' },
  })
}

export const listInvoicesAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = AdminListInvoicesQuerySchema.parse(req.query)
  const result = await invoiceService.getAllInvoicesAdmin(query)
  res.status(200).json({ success: true, data: result.items, meta: result.meta })
}

export const getInvoiceAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = InvoiceIdParamsSchema.parse(req.params)
  const data = await invoiceService.getInvoiceByIdAdmin(id)
  res.status(200).json({ success: true, data })
}

export const regenerateInvoicePdf = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = requireUserId(req)
  const { id } = InvoiceIdParamsSchema.parse(req.params)
  const data = await invoiceService.regenerateInvoicePdf(id, userId)
  res.status(200).json({ success: true, data })
}

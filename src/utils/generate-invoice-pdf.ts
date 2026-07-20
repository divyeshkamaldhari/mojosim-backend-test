import { createElement, type ReactElement } from 'react'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'

import { AppError } from '../common/errors'
import { logError } from '../common/logger'
import { InvoiceDocument } from '../templates/invoice/invoice-document'
import { resolveInvoiceLogoSrc } from '../templates/invoice/resolve-invoice-logo'

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null

export const lineDescriptionFromBillingSnapshot = (
  snapshot: unknown
): string => {
  if (!isRecord(snapshot)) {
    return 'eSIM plan'
  }
  const name =
    (typeof snapshot.name === 'string' ? snapshot.name.trim() : '') ||
    (typeof snapshot.title === 'string' ? snapshot.title.trim() : '')
  if (name) {
    return name
  }
  return 'eSIM plan'
}

import type { InvoicePdfLineItem } from './invoice-line-item-display'

export type InvoicePdfInput = {
  issuerName: string
  invoiceNumber: string
  issuedAt: Date
  orderId: number
  paymentGateway: string
  customerName: string
  customerEmail: string
  lineItem: InvoicePdfLineItem
  subtotal: string
  discountAmount?: string | null
  taxAmount: string
  totalAmount: string
  currency: string
}

export const generateInvoicePdfBuffer = async (
  input: InvoicePdfInput
): Promise<Buffer> => {
  try {
    const logoSrc = resolveInvoiceLogoSrc()
    const doc = createElement(InvoiceDocument, {
      input,
      logoSrc,
    }) as unknown as ReactElement<DocumentProps>
    const buf = await renderToBuffer(doc)
    if (buf.length < 100) {
      throw new AppError(
        'Invoice PDF generation produced empty output',
        502,
        'INVOICE_PDF_FAILED'
      )
    }
    return Buffer.from(buf)
  } catch (err) {
    if (err instanceof AppError) {
      throw err
    }
    logError('Invoice PDF render failed', {
      error: err instanceof Error ? err.message : String(err),
    })
    throw new AppError(
      'Invoice PDF generation failed',
      502,
      'INVOICE_PDF_FAILED'
    )
  }
}

import { Request, Response } from 'express'

import {
  AdminListContactSubmissionsQuerySchema,
  ContactSubmissionIdParamsSchema,
  CreateContactSubmissionSchema,
} from '../dto/contact.dto'
import { contactService } from '../services/contact.service'

export const submitForm = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = CreateContactSubmissionSchema.parse(req.body)
  const data = await contactService.submitContactForm(body)
  res.status(200).json({ success: true, data })
}

export const listSubmissions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const query = AdminListContactSubmissionsQuerySchema.parse(req.query)
  const result = await contactService.getSubmissions(query)
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta,
  })
}

export const getSubmission = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = ContactSubmissionIdParamsSchema.parse(req.params)
  const data = await contactService.getSubmissionById(id)
  res.status(200).json({ success: true, data })
}

export const markSubmissionRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = ContactSubmissionIdParamsSchema.parse(req.params)
  const data = await contactService.markSubmissionRead(id)
  res.status(200).json({ success: true, data })
}

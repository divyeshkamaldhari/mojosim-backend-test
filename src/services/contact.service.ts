import { ValidationError, NotFoundError } from '../common/errors'
import { logWarn } from '../common/logger'
import { env } from '../config/env'
import type {
  AdminListContactSubmissionsQuery,
  CreateContactSubmissionDto,
} from '../dto/contact.dto'
import { TemplateType } from '../modules/email/email.types'
import { sendEmail } from '../modules/email/email.service'
import type { ContactSubmission } from '../models/contact-submission.model'
import {
  ContactSubmissionRepository,
  type ContactSubmissionFilters,
} from '../repositories/contact-submission.repository'

type ContactSubmissionResponse = {
  id: number
  full_name: string
  email: string
  phone: string | null
  message: string
  is_read: boolean
  created_at: Date
}

const mapSubmission = (row: ContactSubmission): ContactSubmissionResponse => ({
  id: row.id,
  full_name: row.fullName,
  email: row.email,
  phone: row.phone,
  message: row.message,
  is_read: row.isRead,
  created_at: row.createdAt,
})

const parseOptionalDate = (value: string | undefined): Date | undefined => {
  if (value === undefined || value.trim() === '') {
    return undefined
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError('Invalid from or to date')
  }
  return parsed
}

const toFilters = (
  query: AdminListContactSubmissionsQuery
): ContactSubmissionFilters => ({
  isRead: query.is_read,
  search: query.search,
  from: parseOptionalDate(query.from),
  to: parseOptionalDate(query.to),
})

export class ContactService {
  private readonly repository: ContactSubmissionRepository

  constructor(
    repository: ContactSubmissionRepository = new ContactSubmissionRepository()
  ) {
    this.repository = repository
  }

  submitContactForm = async (
    dto: CreateContactSubmissionDto
  ): Promise<{ message: string }> => {
    const phone = dto.phone ?? null

    const row = await this.repository.create({
      fullName: dto.full_name,
      email: dto.email,
      phone,
      message: dto.message,
    })

    const created = row.createdAt ?? new Date()
    const submittedAt = created.toISOString()

    void sendEmail({
      to: env.ADMIN_EMAIL,
      templateType: TemplateType.contact_form_received,
      data: {
        fullName: dto.full_name,
        email: dto.email,
        phone: phone ?? '',
        message: dto.message,
        submittedAt,
      },
    }).catch((err: unknown) => {
      let message = 'Unknown error'
      if (err instanceof Error) {
        message = err.message
      } else if (typeof err === 'string') {
        message = err
      }
      logWarn('Contact form admin email failed', { message })
    })

    return {
      message: 'Thank you for contacting us. We will get back to you shortly.',
    }
  }

  getSubmissions = async (
    query: AdminListContactSubmissionsQuery
  ): Promise<{
    items: ContactSubmissionResponse[]
    meta: { page: number; limit: number; total: number }
  }> => {
    const filters = toFilters(query)
    const { rows, count } = await this.repository.findAll(
      filters,
      query.page,
      query.limit
    )
    return {
      items: rows.map(mapSubmission),
      meta: { page: query.page, limit: query.limit, total: count },
    }
  }

  getSubmissionById = async (
    id: number
  ): Promise<ContactSubmissionResponse> => {
    const row = await this.repository.findById(id)
    if (!row) {
      throw new NotFoundError('Contact submission')
    }
    await this.repository.markAsRead(id)
    return { ...mapSubmission(row), is_read: true }
  }

  markSubmissionRead = async (id: number): Promise<{ message: string }> => {
    const row = await this.repository.findById(id)
    if (!row) {
      throw new NotFoundError('Contact submission')
    }
    await this.repository.markAsRead(id)
    return { message: 'Submission marked as read' }
  }
}

export const contactService = new ContactService()

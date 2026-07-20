import { col, Op, where as sqlWhere, type WhereOptions } from 'sequelize'

import { ContactSubmission } from '../models/contact-submission.model'

export type CreateContactSubmissionData = {
  fullName: string
  email: string
  phone: string | null
  message: string
}

export type ContactSubmissionFilters = {
  isRead?: boolean
  search?: string
  from?: Date
  to?: Date
}

export class ContactSubmissionRepository {
  create = async (
    data: CreateContactSubmissionData
  ): Promise<ContactSubmission> => {
    const row = await ContactSubmission.create({
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      message: data.message,
    })
    await row.reload()
    return row
  }

  findAll = async (
    filters: ContactSubmissionFilters,
    page: number,
    limit: number
  ): Promise<{ rows: ContactSubmission[]; count: number }> => {
    const offset = (page - 1) * limit
    const andParts: WhereOptions[] = []

    if (filters.isRead !== undefined) {
      andParts.push({ isRead: filters.isRead })
    }

    if (filters.search !== undefined && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`
      andParts.push({
        [Op.or]: [
          { fullName: { [Op.iLike]: term } },
          { email: { [Op.iLike]: term } },
        ],
      })
    }

    if (filters.from !== undefined) {
      andParts.push(sqlWhere(col('created_at'), Op.gte, filters.from))
    }
    if (filters.to !== undefined) {
      andParts.push(sqlWhere(col('created_at'), Op.lte, filters.to))
    }

    let where: WhereOptions = {}
    if (andParts.length === 1) {
      where = andParts[0]!
    } else if (andParts.length > 1) {
      where = { [Op.and]: andParts }
    }

    const { rows, count } = await ContactSubmission.findAndCountAll({
      where,
      limit,
      offset,
      order: [[col('created_at'), 'DESC']],
    })
    return { rows, count }
  }

  findById = async (id: number): Promise<ContactSubmission | null> => {
    return ContactSubmission.findByPk(id)
  }

  markAsRead = async (id: number): Promise<void> => {
    await ContactSubmission.update({ isRead: true }, { where: { id } })
  }
}

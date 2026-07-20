import { ContentBlock } from '../models/content-block'

export type UpsertContentBlockData = {
  key: string
  locale: string
  type: string
  value: unknown
  isPublished: boolean
  updatedBy: number
}

export class ContentBlockRepository {
  findByKeyAndLocale = async (
    key: string,
    locale: string
  ): Promise<ContentBlock | null> => {
    return ContentBlock.findOne({ where: { key, locale } })
  }

  findAll = async (
    page: number,
    limit: number
  ): Promise<{ rows: ContentBlock[]; count: number }> => {
    const offset = (page - 1) * limit
    const { rows, count } = await ContentBlock.findAndCountAll({
      limit,
      offset,
      order: [['id', 'ASC']],
    })
    return { rows, count }
  }

  upsert = async (data: UpsertContentBlockData): Promise<ContentBlock> => {
    const existing = await this.findByKeyAndLocale(data.key, data.locale)
    if (existing) {
      await existing.update({
        type: data.type,
        value: data.value,
        isPublished: data.isPublished,
        updatedBy: data.updatedBy,
      })
      return existing
    }

    return ContentBlock.create({
      key: data.key,
      locale: data.locale,
      type: data.type,
      value: data.value,
      isPublished: data.isPublished,
      updatedBy: data.updatedBy,
    })
  }

  updatePublished = async (
    key: string,
    locale: string,
    is_published: boolean
  ): Promise<void> => {
    await ContentBlock.update(
      { isPublished: is_published },
      { where: { key, locale } }
    )
  }

  deleteByKeyAndLocale = async (key: string, locale: string): Promise<void> => {
    await ContentBlock.destroy({ where: { key, locale } })
  }
}

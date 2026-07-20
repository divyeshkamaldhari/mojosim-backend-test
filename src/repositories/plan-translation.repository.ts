import { PlanTranslation } from '../models/plan-translation'

export class PlanTranslationRepository {
  findByPlanId = async (planId: number): Promise<PlanTranslation[]> => {
    return PlanTranslation.findAll({
      where: { planId },
      order: [['id', 'ASC']],
    })
  }

  findByPlanIdAndLocale = async (
    planId: number,
    locale: string
  ): Promise<PlanTranslation | null> => {
    return PlanTranslation.findOne({
      where: { planId, locale },
    })
  }

  upsert = async (
    planId: number,
    locale: string,
    data: { name: string; description: string }
  ): Promise<PlanTranslation> => {
    const existing = await this.findByPlanIdAndLocale(planId, locale)
    if (existing) {
      await existing.update({
        name: data.name,
        description: data.description,
      })
      return existing
    }

    return PlanTranslation.create({
      planId,
      locale,
      name: data.name,
      description: data.description,
    })
  }

  deleteByPlanIdAndLocale = async (
    planId: number,
    locale: string
  ): Promise<void> => {
    await PlanTranslation.destroy({ where: { planId, locale } })
  }
}

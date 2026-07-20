import { UsageRecord } from '../models/usage-record'

export type CreateUsageRecordData = {
  esimProfileId: number
  dataUsedMb: number
  dataRemainingMb: number
  isUnlimited: boolean
  source: string
  recordedAt: Date
}

export class UsageRecordRepository {
  findLatestByEsimProfileId = async (
    esimProfileId: number
  ): Promise<UsageRecord | null> => {
    return UsageRecord.findOne({
      where: { esimProfileId },
      order: [['recordedAt', 'DESC']],
    })
  }

  create = async (data: CreateUsageRecordData): Promise<UsageRecord> => {
    return UsageRecord.create({
      esimProfileId: data.esimProfileId,
      dataUsedMb: data.dataUsedMb,
      dataRemainingMb: data.dataRemainingMb,
      isUnlimited: data.isUnlimited,
      source: data.source,
      recordedAt: data.recordedAt,
    })
  }

  findByEsimProfileId = async (
    esimProfileId: number,
    page: number,
    limit: number
  ): Promise<{ rows: UsageRecord[]; count: number }> => {
    const offset = (page - 1) * limit
    return UsageRecord.findAndCountAll({
      where: { esimProfileId },
      order: [['recordedAt', 'DESC']],
      limit,
      offset,
    })
  }
}

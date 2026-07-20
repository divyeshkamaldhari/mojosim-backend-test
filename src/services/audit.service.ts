import { logger } from '../common/logger'
import {
  CreateAuditLogDtoSchema,
  type CreateAuditLogDto,
} from '../dto/audit.dto'
import { AuditLogRepository } from '../repositories/audit-log.repository'
import { normalizeAuditLogPayload } from '../utils/audit-ip.util'

export class AuditService {
  private readonly repository: AuditLogRepository

  constructor(repository: AuditLogRepository = new AuditLogRepository()) {
    this.repository = repository
  }

  createLog = async (input: CreateAuditLogDto): Promise<void> => {
    const normalizedInput = normalizeAuditLogPayload(input)
    const parsed = CreateAuditLogDtoSchema.safeParse(normalizedInput)
    if (!parsed.success) {
      logger.warn('Audit log validation failed', {
        issues: parsed.error.flatten(),
        action: input.action,
        entityType: input.entityType,
      })
      return
    }

    try {
      await this.repository.create({
        actorId: parsed.data.actorId,
        action: parsed.data.action,
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        beforeState: parsed.data.beforeState,
        afterState: parsed.data.afterState,
        ipAddress: parsed.data.ipAddress,
      })
    } catch (error) {
      logger.warn('Audit log write failed', {
        action: parsed.data.action,
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        error: error instanceof Error ? error.message : 'unknown',
      })
    }
  }
}

export const auditService = new AuditService()

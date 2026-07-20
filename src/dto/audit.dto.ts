import { z } from 'zod'

const jsonObjectNullable = z.record(z.string(), z.unknown()).nullable()

export const CreateAuditLogDtoSchema = z.object({
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.number().int().positive(),
  actorId: z.number().int().positive().nullable(),
  beforeState: jsonObjectNullable,
  afterState: jsonObjectNullable,
  ipAddress: z.string().nullable(),
})

export type CreateAuditLogDto = z.infer<typeof CreateAuditLogDtoSchema>

const entityTypeSegment = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9_-]+$/)

export const ListAuditLogsQuerySchema = z.object({
  actor_id: z.coerce.number().int().positive().optional().nullable(),
  action: z.string().min(1).max(200).optional().nullable(),
  entity_type: z.string().min(1).max(100).optional().nullable(),
  entity_id: z.coerce.number().int().positive().optional().nullable(),
  created_from: z.coerce.date().optional().nullable(),
  created_to: z.coerce.date().optional().nullable(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
})

export const AuditEntityTrailParamsSchema = z.object({
  entity_type: entityTypeSegment,
  entity_id: z.coerce.number().int().positive(),
})

export type ListAuditLogsQuery = z.infer<typeof ListAuditLogsQuerySchema>
export type AuditEntityTrailParams = z.infer<
  typeof AuditEntityTrailParamsSchema
>

import { z } from 'zod'

export const ReportDateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  currency: z.string().optional().default('USD'),
})

export const PopularPlansQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).default(5),
})

export const UsageReportQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  active_only: z
    .enum(['true', 'false'])
    .optional()
    .nullable()
    .transform((v) => (v === undefined || v === null ? true : v === 'true')),
})

export type ReportDateRangeQuery = z.infer<typeof ReportDateRangeSchema>
export type PopularPlansQuery = z.infer<typeof PopularPlansQuerySchema>
export type UsageReportQuery = z.infer<typeof UsageReportQuerySchema>

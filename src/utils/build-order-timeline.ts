import type { AuditLog } from '../models/audit-log'
import type { Invoice } from '../models/invoice'
import type { Order } from '../models/order'
import type { ProfileStatusHistory } from '../models/profile-status-history'
import type { ProvisioningJob } from '../models/provisioning-job'

export type OrderTimelineEventKey =
  | 'order_placed'
  | 'payment_confirmed'
  | 'payment_failed'
  | 'checkout_expired'
  | 'invoice_issued'
  | 'invoice_ready'
  | 'provisioning_queued'
  | 'provisioning_succeeded'
  | 'provisioning_failed'
  | 'esim_assigned'
  | 'esim_activated'
  | 'esim_expired'
  | 'esim_suspended'
  | 'esim_deactivated'

export type OrderTimelineStep = {
  id: string
  key: OrderTimelineEventKey
  label: string
  timestamp: Date
  status: 'completed' | 'failed'
  description: string | null
}

export type OrderTimelineContext = {
  order: Pick<
    Order,
    'orderType' | 'status' | 'paymentStatus' | 'createdAt' | 'updatedAt'
  >
  esimQuantity: number
  provisionedEsimCount: number
  auditLogs: Pick<AuditLog, 'action' | 'createdAt'>[]
  invoice: Pick<Invoice, 'issuedAt' | 'updatedAt' | 'pdfUrl'> | null
  provisioningJob: Pick<
    ProvisioningJob,
    'status' | 'createdAt' | 'completedAt' | 'updatedAt' | 'lastError'
  > | null
  profileHistory: Pick<
    ProfileStatusHistory,
    'fromState' | 'toState' | 'source' | 'createdAt'
  >[]
}

type DraftStep = Omit<OrderTimelineStep, 'id'>

type PerEsimLifecycleKey = Extract<
  OrderTimelineEventKey,
  | 'esim_assigned'
  | 'esim_activated'
  | 'esim_expired'
  | 'esim_suspended'
  | 'esim_deactivated'
>

const PER_ESIM_KEYS = new Set<OrderTimelineEventKey>([
  'esim_assigned',
  'esim_activated',
  'esim_expired',
  'esim_suspended',
  'esim_deactivated',
])

const ESIM_LABELS: Record<
  PerEsimLifecycleKey,
  { one: string; many: string; partial: string; pending?: string }
> = {
  esim_assigned: {
    one: 'eSIM linked to order',
    many: '{n} eSIMs linked to order',
    partial: '{n} of {t} eSIMs linked to order',
    pending: 'could not be linked yet',
  },
  esim_activated: {
    one: 'eSIM activated',
    many: '{n} eSIMs activated',
    partial: '{n} of {t} eSIMs activated',
    pending: 'not activated yet',
  },
  esim_expired: {
    one: 'Plan expired',
    many: '{n} eSIM plans expired',
    partial: '{n} of {t} eSIM plans expired',
    pending: 'still active',
  },
  esim_suspended: {
    one: 'eSIM suspended',
    many: '{n} eSIMs suspended',
    partial: '{n} of {t} eSIMs suspended',
    pending: 'not suspended',
  },
  esim_deactivated: {
    one: 'eSIM deactivated',
    many: '{n} eSIMs deactivated',
    partial: '{n} of {t} eSIMs deactivated',
    pending: 'still active',
  },
}

const TO_STATE_KEY: Record<
  ProfileStatusHistory['toState'],
  PerEsimLifecycleKey | null
> = {
  created: null,
  assigned: 'esim_assigned',
  activated: 'esim_activated',
  expired: 'esim_expired',
  suspended: 'esim_suspended',
  deactivated: 'esim_deactivated',
}

const draft = (
  key: OrderTimelineEventKey,
  label: string,
  timestamp: Date,
  status: 'completed' | 'failed' = 'completed',
  description: string | null = null
): DraftStep => ({ key, label, timestamp, status, description })

const auditAt = (
  logs: OrderTimelineContext['auditLogs'],
  action: string
): Date | null => logs.find((log) => log.action === action)?.createdAt ?? null

const fill = (template: string, n: number, t: number): string =>
  template.replace('{n}', String(n)).replace('{t}', String(t))

const esimLabel = (
  key: PerEsimLifecycleKey,
  count: number,
  total: number
): string => {
  const labels = ESIM_LABELS[key]
  const t = Math.max(total, count)
  if (count <= 1 && t <= 1) {
    return labels.one
  }
  return fill(count >= t ? labels.many : labels.partial, count, t)
}

const esimPendingDescription = (
  key: PerEsimLifecycleKey,
  count: number,
  total: number
): string | null => {
  const remaining = total - count
  const pending = ESIM_LABELS[key].pending
  if (remaining <= 0 || pending === undefined) {
    return null
  }
  const unit = remaining === 1 ? 'eSIM' : 'eSIMs'
  return `${remaining} ${unit} ${pending}`
}

const provisioningFailureLabel = (
  provisioned: number,
  total: number
): string => {
  const failed = total - provisioned
  if (failed <= 0 || provisioned <= 0) {
    return total > 1
      ? `${total} eSIMs provisioning failed`
      : 'eSIM provisioning failed'
  }
  const unit = failed === 1 ? 'eSIM' : 'eSIMs'
  return `${failed} of ${total} ${unit} failed to provision`
}

const collectPaymentSteps = (ctx: OrderTimelineContext): DraftStep[] => {
  const { order, auditLogs } = ctx
  if (order.paymentStatus === 'paid') {
    return [
      draft(
        'payment_confirmed',
        'Payment confirmed',
        auditAt(auditLogs, 'order.payment_confirmed') ?? order.updatedAt
      ),
    ]
  }
  if (order.paymentStatus === 'failed') {
    return [
      draft(
        'payment_failed',
        'Payment failed',
        auditAt(auditLogs, 'order.payment_failed') ?? order.updatedAt,
        'failed'
      ),
    ]
  }
  if (order.status === 'cancelled' && order.paymentStatus === 'pending') {
    const expiredAt = auditAt(auditLogs, 'order.payment_expired')
    if (expiredAt !== null) {
      return [
        draft('checkout_expired', 'Checkout expired', expiredAt, 'failed'),
      ]
    }
  }
  return []
}

const collectInvoiceSteps = (ctx: OrderTimelineContext): DraftStep[] => {
  const { invoice } = ctx
  if (invoice === null) {
    return []
  }
  const steps = [draft('invoice_issued', 'Invoice generated', invoice.issuedAt)]
  if (invoice.pdfUrl !== null && invoice.pdfUrl.trim().length > 0) {
    steps.push(
      draft('invoice_ready', 'Invoice ready for download', invoice.updatedAt)
    )
  }
  return steps
}

const collectProvisioningSteps = (ctx: OrderTimelineContext): DraftStep[] => {
  const { order, provisioningJob } = ctx
  if (order.orderType !== 'new' || provisioningJob === null) {
    return []
  }

  const steps = [
    draft(
      'provisioning_queued',
      'eSIM provisioning started',
      provisioningJob.createdAt
    ),
  ]
  const { status, completedAt, updatedAt, lastError } = provisioningJob

  if (status === 'success' && completedAt !== null) {
    const qty = ctx.esimQuantity
    steps.push(
      draft(
        'provisioning_succeeded',
        qty > 1 ? `${qty} eSIMs provisioned` : 'eSIM provisioned',
        completedAt
      )
    )
    return steps
  }

  if (status === 'failed' || status === 'dead') {
    steps.push(
      draft(
        'provisioning_failed',
        provisioningFailureLabel(ctx.provisionedEsimCount, ctx.esimQuantity),
        completedAt ?? updatedAt,
        'failed',
        lastError !== null && lastError.trim().length > 0
          ? 'Provisioning could not be completed. Our team has been notified.'
          : null
      )
    )
  }
  return steps
}

const collectProfileHistorySteps = (ctx: OrderTimelineContext): DraftStep[] => {
  const steps: DraftStep[] = []
  for (const row of ctx.profileHistory) {
    if (row.toState === 'created' || row.fromState === row.toState) {
      continue
    }
    const key = TO_STATE_KEY[row.toState]
    if (key === null) {
      continue
    }
    steps.push(draft(key, ESIM_LABELS[key].one, row.createdAt))
  }
  return steps
}

const collectSteps = (ctx: OrderTimelineContext): DraftStep[] => [
  ...collectPaymentSteps(ctx),
  ...collectInvoiceSteps(ctx),
  ...collectProvisioningSteps(ctx),
  ...collectProfileHistorySteps(ctx),
]

const dedupeSteps = (sorted: DraftStep[]): DraftStep[] =>
  sorted.filter((step, _, all) => {
    if (step.key === 'provisioning_succeeded') {
      return !all.some((other) => other.key === 'esim_assigned')
    }
    if (step.key === 'invoice_ready') {
      const bucket = Math.floor(step.timestamp.getTime() / 1000)
      return !all.some(
        (other) =>
          other.key === 'invoice_issued' &&
          Math.floor(other.timestamp.getTime() / 1000) === bucket
      )
    }
    return true
  })

const aggregatePerEsimSteps = (
  deduped: DraftStep[],
  esimQuantity: number
): DraftStep[] => {
  const aggregated: DraftStep[] = []
  let index = 0
  while (index < deduped.length) {
    const current = deduped[index]
    if (!PER_ESIM_KEYS.has(current.key)) {
      aggregated.push(current)
      index += 1
      continue
    }

    const key = current.key as PerEsimLifecycleKey
    const batch = [current]
    index += 1
    while (index < deduped.length && deduped[index].key === key) {
      batch.push(deduped[index])
      index += 1
    }

    const count = batch.length
    aggregated.push({
      key,
      label: esimLabel(key, count, esimQuantity),
      timestamp: batch[batch.length - 1].timestamp,
      status: batch.some((item) => item.status === 'failed')
        ? 'failed'
        : 'completed',
      description: esimPendingDescription(key, count, esimQuantity),
    })
  }
  return aggregated
}

const finalizeSteps = (
  steps: DraftStep[],
  esimQuantity: number
): OrderTimelineStep[] => {
  const sorted = [...steps].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )
  return aggregatePerEsimSteps(dedupeSteps(sorted), esimQuantity).map(
    (step) => ({
      ...step,
      id: `${step.key}-${step.timestamp.getTime()}`,
    })
  )
}

export const filterProfileHistoryForOrder = (
  _orderType: Order['orderType'],
  profileHistory: OrderTimelineContext['profileHistory']
): OrderTimelineContext['profileHistory'] =>
  profileHistory.filter(
    (row) => row.source !== 'renewal' && row.source !== 'topup'
  )

export const buildOrderTimeline = (
  ctx: OrderTimelineContext
): OrderTimelineStep[] =>
  finalizeSteps(
    [
      draft('order_placed', 'Order placed', ctx.order.createdAt),
      ...collectSteps(ctx),
    ],
    ctx.esimQuantity
  )

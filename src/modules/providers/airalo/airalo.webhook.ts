import crypto from 'node:crypto'

export type AiraloWebhookEventType =
  | 'async_orders'
  | 'low_data_notification'
  | 'credit_limit_notification'
  | 'unknown'

type GenericRecord = Record<string, unknown>

export type AiraloAsyncOrderPayload = {
  request_id?: string
  code?: string
  sims?: Array<Record<string, unknown>>
  reason?: string
}

export type AiraloLowDataPayload = {
  event?: string
  type?: string
  iccid?: string
  level?: string
  package_name?: string
  remaining_percentage?: number
}

export type AiraloCreditLimitPayload = {
  event?: string
  type?: string
  message?: string
  remaining?: number
}

const toRecord = (value: unknown): GenericRecord | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as GenericRecord
}

const toLower = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim().toLowerCase()
}

const getString = (record: GenericRecord, key: string): string | null => {
  const value = record[key]
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

const getNestedPayload = (payload: GenericRecord): GenericRecord => {
  const nested = toRecord(payload.data)
  return nested ?? payload
}

const signatureToBuffer = (signature: string): Buffer | null => {
  const normalized = signature.trim().toLowerCase()
  if (!/^[a-f0-9]+$/.test(normalized) || normalized.length % 2 !== 0) {
    return null
  }
  return Buffer.from(normalized, 'hex')
}

export const verifyAiraloSignature = (
  rawBody: Buffer,
  signatureHeader: string,
  secret: string
): boolean => {
  const expected = crypto.createHmac('sha512', secret).update(rawBody).digest()
  const received = signatureToBuffer(signatureHeader)
  if (!received || received.length !== expected.length) {
    return false
  }
  return crypto.timingSafeEqual(expected, received)
}

export const parseAiraloWebhookPayload = (
  rawBody: Buffer
): GenericRecord | null => {
  try {
    const parsed: unknown = JSON.parse(rawBody.toString('utf8'))
    return toRecord(parsed)
  } catch {
    return null
  }
}

export const detectAiraloWebhookEventType = (
  payloadInput: GenericRecord
): AiraloWebhookEventType => {
  const payload = getNestedPayload(payloadInput)
  const event = toLower(payload.event)
  const type = toLower(payload.type)

  if (
    event.includes('low_data') ||
    type.includes('expire_') ||
    type.includes('percent_')
  ) {
    return 'low_data_notification'
  }
  if (event.includes('credit_limit') || type.includes('credit_limit')) {
    return 'credit_limit_notification'
  }
  if (event.includes('async') || type === 'async_orders') {
    return 'async_orders'
  }

  const requestId = getString(payload, 'request_id')
  const hasSims = Array.isArray(payload.sims)
  if (requestId !== null || hasSims) {
    return 'async_orders'
  }

  return 'unknown'
}

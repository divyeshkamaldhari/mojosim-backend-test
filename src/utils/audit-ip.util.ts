export const AUDIT_SYSTEM_IP = 'system'

const IPV4_MAPPED_IPV6_PREFIX = /^::ffff:/i

export function normalizeClientIp(
  raw: string | null | undefined
): string | null {
  if (raw === null || raw === undefined) {
    return null
  }

  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }

  if (IPV4_MAPPED_IPV6_PREFIX.test(trimmed)) {
    return trimmed.replace(IPV4_MAPPED_IPV6_PREFIX, '')
  }

  if (trimmed === '::1') {
    return '127.0.0.1'
  }

  return trimmed
}

export function normalizeAuditStateForDisplay(
  state: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!state) {
    return state
  }

  const ip = state.ip_address
  if (typeof ip !== 'string') {
    return state
  }

  const normalized = normalizeClientIp(ip)
  if (normalized === null || normalized === ip) {
    return state
  }

  return { ...state, ip_address: normalized }
}

export function resolveAuditIpAddress(ip: string | null | undefined): string {
  return normalizeClientIp(ip) ?? AUDIT_SYSTEM_IP
}

export function normalizeAuditLogPayload<
  T extends {
    ipAddress: string | null
    beforeState: Record<string, unknown> | null
    afterState: Record<string, unknown> | null
  },
>(input: T): T {
  return {
    ...input,
    ipAddress: resolveAuditIpAddress(input.ipAddress),
    beforeState: normalizeAuditStateForDisplay(input.beforeState),
    afterState: normalizeAuditStateForDisplay(input.afterState),
  }
}

export function formatAuditIpForDisplay(ip: string | null | undefined): string {
  const normalized = normalizeClientIp(ip)
  if (!normalized) {
    return 'System'
  }
  if (normalized === AUDIT_SYSTEM_IP) {
    return 'System'
  }
  return normalized
}

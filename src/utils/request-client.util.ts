import type { Request } from 'express'

import { normalizeClientIp } from './audit-ip.util'

export const getRequestUserAgent = (req: Request): string => {
  const userAgent = req.headers['user-agent']
  return typeof userAgent === 'string' ? userAgent : ''
}

export const getRequestIpAddress = (req: Request): string => {
  return normalizeClientIp(req.ip) ?? ''
}

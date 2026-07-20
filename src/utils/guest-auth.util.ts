import crypto from 'node:crypto'

export const generateGuestCartToken = (): string => {
  return crypto.randomBytes(32).toString('hex')
}

export const generateOtpCode = (): string => {
  return crypto.randomInt(100_000, 1_000_000).toString()
}

export const hashOtpCode = (code: string): string => {
  return crypto.createHash('sha256').update(code).digest('hex')
}

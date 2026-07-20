import crypto from 'node:crypto'

import { AppError } from './errors'
import { env } from '../config/env'

const getAes256Key = (): Buffer =>
  crypto.createHash('sha256').update(env.ENCRYPTION_KEY).digest()

export const encryptQrPayload = (plaintext: string): string => {
  const iv = crypto.randomBytes(12)
  const key = getAes256Key()
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

export const decryptQrPayload = (encrypted: string): string => {
  const parts = encrypted.split(':')
  if (parts.length !== 3) {
    throw new AppError('Invalid encrypted QR payload', 500, 'INTERNAL_ERROR')
  }
  const iv = Buffer.from(parts[0], 'base64')
  const authTag = Buffer.from(parts[1], 'base64')
  const ciphertext = Buffer.from(parts[2], 'base64')
  const key = getAes256Key()
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString('utf8')
}

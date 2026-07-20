/* eslint-disable security/detect-non-literal-fs-filename -- fixed allowlist of asset paths under src/dist */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { env } from '../../../config/env'
import { logWarn } from '../../../common/logger'
import {
  buildPublicUrlForKey,
  objectExistsByKey,
  uploadPngBufferAtKey,
} from '../../s3'

const EMAIL_LOGO_S3_KEY = 'brand/email-logo.png'

const logoCandidates = [
  path.resolve(process.cwd(), 'src/assets/logo.png'),
  path.resolve(process.cwd(), 'dist/assets/logo.png'),
]

let cachedLogoUrl: string | null = null

const readLogoBuffer = (): Buffer | null => {
  for (const filePath of logoCandidates) {
    if (!existsSync(filePath)) {
      continue
    }
    return readFileSync(filePath)
  }
  return null
}

export const resolveEmailLogoUrl = async (
  frontendUrl: string
): Promise<string> => {
  if (cachedLogoUrl) {
    return cachedLogoUrl
  }

  const configured = env.EMAIL_LOGO_URL.trim()
  if (configured) {
    cachedLogoUrl = configured
    return configured
  }

  const publicUrl = buildPublicUrlForKey(EMAIL_LOGO_S3_KEY)

  try {
    const exists = await objectExistsByKey(EMAIL_LOGO_S3_KEY)
    if (!exists) {
      const buffer = readLogoBuffer()
      if (!buffer) {
        return `${frontendUrl.replace(/\/$/, '')}/logo.png`
      }
      cachedLogoUrl = await uploadPngBufferAtKey(buffer, EMAIL_LOGO_S3_KEY)
      return cachedLogoUrl
    }

    cachedLogoUrl = publicUrl
    return cachedLogoUrl
  } catch (error) {
    logWarn('Email logo S3 resolve failed; using storage proxy URL fallback', {
      key: EMAIL_LOGO_S3_KEY,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    cachedLogoUrl = publicUrl
    return cachedLogoUrl
  }
}

import {
  PROVIDER_COUNTRY_CODE_MAX_LENGTH,
  PROVIDER_COUNTRY_CODE_MIN_LENGTH,
  PROVIDER_COUNTRY_CODE_PATTERN,
} from '../constants/provider-country-code'

export const normalizeProviderCountryCode = (
  code: string | null | undefined
): string | null => {
  if (code === null || code === undefined) {
    return null
  }
  const normalized = code.trim().toUpperCase()
  if (
    normalized.length < PROVIDER_COUNTRY_CODE_MIN_LENGTH ||
    normalized.length > PROVIDER_COUNTRY_CODE_MAX_LENGTH
  ) {
    return null
  }
  if (!PROVIDER_COUNTRY_CODE_PATTERN.test(normalized)) {
    return null
  }
  return normalized
}

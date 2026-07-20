import { z } from 'zod'

import { PROVIDER_COUNTRY_CODE_MAX_LENGTH } from '../constants/provider-country-code'

export const ProviderCountryCodeSchema = z
  .string()
  .min(2, 'Country code must be at least 2 characters')
  .max(
    PROVIDER_COUNTRY_CODE_MAX_LENGTH,
    `Country code must be at most ${PROVIDER_COUNTRY_CODE_MAX_LENGTH} characters`
  )
  .regex(
    /^[A-Za-z0-9-]+$/,
    'Country code must be alphanumeric (hyphens allowed)'
  )
  .transform((value) => value.toUpperCase())

export const PROVIDER_COUNTRY_CODE_MIN_LENGTH = 2
export const PROVIDER_COUNTRY_CODE_MAX_LENGTH = 16

/** Airalo uses codes like USPR, GP-MG (not only ISO alpha-2). */
export const PROVIDER_COUNTRY_CODE_PATTERN = /^[A-Z0-9-]{2,16}$/

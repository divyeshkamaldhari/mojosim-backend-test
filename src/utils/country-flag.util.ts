export function countryFlagUrlFromIso2(countryCode: string): string | null {
  const raw = countryCode.trim()
  if (!raw) return null

  const normalized = raw.toLowerCase()
  const iso2 = normalized === 'uk' ? 'gb' : normalized
  if (!/^[a-z]{2}$/.test(iso2)) return null

  // ISO-3166-1 alpha-2 flags (PNG).
  return `https://flagcdn.com/w40/${iso2}.png`
}

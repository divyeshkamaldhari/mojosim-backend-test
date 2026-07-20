export const resolveEsimDataAllowanceMb = (
  dataAllowanceMb: number | null | undefined,
  planDataMb: number | null | undefined,
  latestUsage?: {
    data_used_mb: number
    data_remaining_mb: number
  } | null
): number => {
  const base =
    dataAllowanceMb !== null &&
    dataAllowanceMb !== undefined &&
    dataAllowanceMb > 0
      ? dataAllowanceMb
      : (planDataMb ?? 0)

  if (latestUsage === null || latestUsage === undefined) {
    return base
  }

  const fromUsage = latestUsage.data_used_mb + latestUsage.data_remaining_mb
  return fromUsage > base ? fromUsage : base
}

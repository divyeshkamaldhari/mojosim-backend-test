import type { EsimProfile } from '../models/esim-profile'

/** Profiles that still await provider ICCID / QR data. */
export const isPlaceholderEsimProfile = (
  profile: Pick<EsimProfile, 'lifecycleState' | 'iccid'>
): boolean => profile.lifecycleState === 'created' || profile.iccid === null

/** Profiles that have been fully provisioned by the provider. */
export const isFullyProvisionedEsimProfile = (
  profile: Pick<EsimProfile, 'lifecycleState' | 'iccid'>
): boolean => !isPlaceholderEsimProfile(profile)

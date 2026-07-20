import { env } from '../config/env'

export const getProvisioningMaxAttempts = (): number =>
  env.PROVISIONING_BULLMQ_ATTEMPTS

export const getProvisioningQueueJobOptions = (): {
  attempts: number
  backoff: { type: 'exponential'; delay: number }
  removeOnComplete: boolean
  removeOnFail: boolean
} => ({
  attempts: getProvisioningMaxAttempts(),
  backoff: { type: 'exponential', delay: env.PROVISIONING_BULLMQ_BACKOFF_MS },
  removeOnComplete: true,
  removeOnFail: false,
})

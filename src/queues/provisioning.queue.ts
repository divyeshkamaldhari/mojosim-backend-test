import { createQueue } from '../modules/bullmq'
import { getProvisioningQueueJobOptions } from './provisioning-queue-options'

export const provisioningQueue = createQueue('provisioning', {
  defaultJobOptions: getProvisioningQueueJobOptions(),
})

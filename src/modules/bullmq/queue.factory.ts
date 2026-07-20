import type { ConnectionOptions, QueueOptions } from 'bullmq'
import { Queue } from 'bullmq'

import { logger } from '../../common/logger'
import { redisConnection } from '../redis'

type CreateQueueOptions = Omit<QueueOptions, 'connection'>

const defaultQueueOptions: Pick<QueueOptions, 'defaultJobOptions'> = {
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
}

const activeQueues: Queue[] = []

export const createQueue = <TData = unknown, TResult = unknown>(
  name: string,
  options?: CreateQueueOptions
): Queue<TData, TResult> => {
  const safeOptions = options ?? {}
  const queue = new Queue<TData, TResult>(name, {
    ...defaultQueueOptions,
    ...safeOptions,
    // merge nested defaults so callers can override specific fields
    defaultJobOptions: {
      ...defaultQueueOptions.defaultJobOptions,
      ...safeOptions.defaultJobOptions,
    },
    connection: redisConnection as ConnectionOptions,
  })
  queue.on('error', (err) => {
    logger.error('BullMQ queue error', {
      queue: name,
      err: { name: err.name, message: err.message, stack: err.stack },
    })
  })
  activeQueues.push(queue as Queue)
  return queue
}

export const closeAllQueues = async (): Promise<void> => {
  await Promise.all(activeQueues.map(async (queue) => queue.close()))
}

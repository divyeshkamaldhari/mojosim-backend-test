import { Redis } from 'ioredis'

import { logger } from '../../common/logger'
import { env } from '../../config/env'

const redisEnabled = env.ENABLE_REDIS

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  enableOfflineQueue: redisEnabled,
  retryStrategy: (times: number) => {
    if (!redisEnabled) {
      return null
    }
    const delay = Math.min(times * 200, 2000)
    return delay
  },
})

if (redisEnabled) {
  redisConnection.on('connect', () => {
    logger.debug('Redis TCP connected', {})
  })

  redisConnection.on('ready', () => {
    logger.debug('Redis ready', {})
  })

  redisConnection.on('error', (err: Error) => {
    logger.error('Redis connection error', {
      err: { name: err.name, message: err.message, stack: err.stack },
    })
  })

  redisConnection.on('close', () => {
    logger.warn('Redis connection closed', {})
  })
}

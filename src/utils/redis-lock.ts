import { randomUUID } from 'node:crypto'

import { redisConnection } from '../modules/redis'

export type RedisLockHandle = {
  key: string
  token: string
}

const NO_REDIS_TOKEN = 'no-redis'

export const acquireRedisLock = async (
  key: string,
  ttlMs: number
): Promise<RedisLockHandle | null> => {
  if (redisConnection.status !== 'ready') {
    return { key, token: NO_REDIS_TOKEN }
  }
  const token = randomUUID()
  const result = await redisConnection.set(key, token, 'PX', ttlMs, 'NX')
  return result === 'OK' ? { key, token } : null
}

export const releaseRedisLock = async (
  handle: RedisLockHandle
): Promise<void> => {
  if (handle.token === NO_REDIS_TOKEN) {
    return
  }
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    end
    return 0
  `
  await redisConnection.eval(script, 1, handle.key, handle.token)
}

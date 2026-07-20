import { env } from '../../../config/env'
import { logWarn } from '../../../common/logger'
import { redisConnection } from '../../redis'

const RATE_KEY = 'airalo:api:rate'
const WINDOW_MS = 1000
const MAX_WAIT_MS = 120_000

const sleepMs = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

export const acquireAiraloRequestSlot = async (): Promise<void> => {
  if (redisConnection.status !== 'ready') {
    return
  }

  const maxRps = env.AIRALO_MAX_REQUESTS_PER_SECOND
  const deadline = Date.now() + MAX_WAIT_MS
  const waitStart = Date.now()

  while (Date.now() < deadline) {
    const count = await redisConnection.incr(RATE_KEY)
    if (count === 1) {
      await redisConnection.pexpire(RATE_KEY, WINDOW_MS)
    }
    if (count <= maxRps) {
      const waitedMs = Date.now() - waitStart
      if (waitedMs > 500) {
        logWarn('Airalo request throttle waited', { waitedMs, maxRps })
      }
      return
    }

    await redisConnection.decr(RATE_KEY)
    const ttl = await redisConnection.pttl(RATE_KEY)
    const waitMs = ttl > 0 ? ttl + 25 : 100
    await sleepMs(waitMs)
  }

  logWarn('Airalo request throttle wait exceeded', {
    maxRps,
    maxWaitMs: MAX_WAIT_MS,
  })
}

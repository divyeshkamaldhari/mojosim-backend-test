import 'dotenv/config'
import { initDb } from './config/db'
import { logger } from './common/logger'
import { env } from './config/env'
import { redisConnection } from './modules/redis'
import { registerGracefulShutdown } from './lifecycle'
import { startServer } from './server'

const bootstrap = async (): Promise<void> => {
  await initDb()

  let redisAvailable = false
  if (env.ENABLE_REDIS) {
    try {
      // Queues (e.g. provisioning) are created when the app module graph loads, so
      // ioredis may already be connected. connect() then throws; use ping() instead.
      const pong = await redisConnection.ping()
      if (pong !== 'PONG') {
        throw new Error(`Unexpected Redis ping reply: ${String(pong)}`)
      }
      redisAvailable = true
      logger.info('Redis connected', {})
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      logger.warn(
        'Redis unavailable — BullMQ worker and plan sync cron disabled',
        {
          message,
        }
      )
      try {
        redisConnection.disconnect()
      } catch {
        // ignore cleanup errors
      }
    }
  } else {
    logger.warn('Redis disabled by ENABLE_REDIS flag', {})
  }

  if (redisAvailable) {
    await import('./workers/compatibility-sync.worker')
    await import('./workers/plan-sync.worker')
    await import('./workers/provisioning.worker')
    await import('./workers/webhook.worker')
    await import('./workers/email.worker')
    await import('./workers/invoice.worker')
    await import('./workers/usage-sync.worker')
  }

  const runtime = startServer({ redisAvailable })
  registerGracefulShutdown({ runtime, redisEnabled: redisAvailable })
}

void bootstrap()

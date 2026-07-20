import type { ScheduledTask } from 'node-cron'

/* eslint-disable @typescript-eslint/no-floating-promises */
import { logger } from './common/logger'
import { closeAllQueues, closeAllWorkers } from './modules/bullmq'
import { redisConnection } from './modules/redis'
import type { ServerRuntime } from './server'

type ShutdownOptions = {
  runtime: ServerRuntime
  redisEnabled: boolean
}

let shutdownRegistered = false

const stopScheduledTasks = (tasks: ScheduledTask[]): void => {
  for (const task of tasks) {
    task.stop()
    task.destroy()
  }
}

export const registerGracefulShutdown = ({
  runtime,
  redisEnabled,
}: ShutdownOptions): void => {
  if (shutdownRegistered) {
    return
  }
  shutdownRegistered = true

  let closing = false

  const shutdown = async (signal: string): Promise<void> => {
    if (closing) {
      return
    }
    closing = true
    logger.warn('Graceful shutdown started', { signal })

    stopScheduledTasks(runtime.scheduledTasks)

    await new Promise<void>((resolve) => {
      runtime.httpServer.close(() => {
        resolve()
      })
    })

    await closeAllWorkers()
    await closeAllQueues()

    if (redisEnabled) {
      try {
        await redisConnection.quit()
      } catch {
        redisConnection.disconnect()
      }
    }

    logger.info('Graceful shutdown completed', {})
    process.exit(0)
  }

  process.on('SIGINT', () => {
    void shutdown('SIGINT')
  })
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM')
  })
}

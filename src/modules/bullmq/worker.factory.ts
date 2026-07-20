import type { ConnectionOptions, Job, Processor, WorkerOptions } from 'bullmq'
import { Worker } from 'bullmq'

import { UnrecoverableError } from 'bullmq'

import { ProviderRateLimitError } from '../../common/errors'
import { logger } from '../../common/logger'
import { redisConnection } from '../redis'

type CreateWorkerOptions = Omit<WorkerOptions, 'connection'>
type RuntimeWorkerOptions<
  TData = unknown,
  TResult = unknown,
> = CreateWorkerOptions & {
  jobTimeoutMs?: number
  onExhaustedRetries?: (args: {
    job: Job<TData, TResult, string>
    err: Error
  }) => void | Promise<void>
}

const DEFAULT_WORKER_OPTIONS: Pick<
  WorkerOptions,
  'lockDuration' | 'maxStalledCount'
> = {
  lockDuration: 60_000,
  maxStalledCount: 3,
}
const activeWorkers: Worker[] = []

const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  queue: string,
  jobId: string
): Promise<T> => {
  let timer: NodeJS.Timeout | null = null

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Job timed out after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  try {
    return await Promise.race([operation, timeoutPromise])
  } catch (error) {
    if (
      error instanceof ProviderRateLimitError ||
      error instanceof UnrecoverableError
    ) {
      throw error
    }
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`[${queue}][${jobId}] ${message}`)
  } finally {
    if (timer !== null) {
      clearTimeout(timer)
    }
  }
}

export const createWorker = <TData = unknown, TResult = unknown>(
  name: string,
  processor: Processor<TData, TResult, string>,
  options?: RuntimeWorkerOptions<TData, TResult>
): Worker<TData, TResult, string> => {
  const safeOptions = options ?? {}
  const { jobTimeoutMs, onExhaustedRetries, ...workerOptions } = safeOptions
  const worker = new Worker<TData, TResult, string>(
    name,
    async (job) => {
      try {
        if (jobTimeoutMs === undefined) {
          return await processor(job)
        }
        return await withTimeout(
          processor(job),
          jobTimeoutMs,
          name,
          typeof job.id === 'string' ? job.id : String(job.id)
        )
      } catch (err) {
        logger.error('BullMQ job processor error', {
          queue: name,
          jobId: job.id,
          err:
            err instanceof Error
              ? { name: err.name, message: err.message, stack: err.stack }
              : { message: String(err) },
        })
        throw err
      }
    },
    {
      ...DEFAULT_WORKER_OPTIONS,
      ...workerOptions,
      connection: redisConnection as ConnectionOptions,
    }
  )

  worker.on('active', (job) => {
    logger.info('BullMQ job started', { queue: name, jobId: job.id })
  })

  worker.on('completed', (job) => {
    logger.info('BullMQ job completed', { queue: name, jobId: job.id })
  })

  worker.on('failed', (job, err) => {
    const maxAttempts = job?.opts.attempts ?? null
    const attemptsMade = job?.attemptsMade ?? null
    const isLastAttempt =
      maxAttempts !== null &&
      attemptsMade !== null &&
      attemptsMade >= maxAttempts

    logger.error('BullMQ job failed', {
      queue: name,
      jobId: job?.id,
      attemptsMade,
      maxAttempts,
      err: { name: err.name, message: err.message, stack: err.stack },
    })

    if (isLastAttempt) {
      logger.error('BullMQ job exhausted retries', {
        queue: name,
        jobId: job?.id,
        attemptsMade,
        maxAttempts,
        alertLevel: 'critical',
      })
    }

    if (
      isLastAttempt &&
      onExhaustedRetries !== undefined &&
      job !== undefined &&
      job !== null
    ) {
      void Promise.resolve(
        onExhaustedRetries({
          job: job,
          err,
        })
      ).catch((callbackError: unknown) => {
        logger.warn('onExhaustedRetries handler failed', {
          queue: name,
          jobId: job.id,
          error:
            callbackError instanceof Error
              ? callbackError.message
              : String(callbackError),
        })
      })
    }
  })

  worker.on('stalled', (jobId) => {
    logger.warn('BullMQ job stalled', {
      queue: name,
      jobId,
    })
  })

  worker.on('error', (err) => {
    logger.error('BullMQ worker error', {
      queue: name,
      err: { name: err.name, message: err.message, stack: err.stack },
    })
  })

  activeWorkers.push(worker as Worker)
  return worker
}

export const closeAllWorkers = async (): Promise<void> => {
  await Promise.all(activeWorkers.map(async (worker) => worker.close()))
}

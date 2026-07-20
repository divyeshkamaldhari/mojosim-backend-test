export class TimeoutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

export const withTimeout = async <T>(
  operation: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> => {
  let timer: NodeJS.Timeout | null = null
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new TimeoutError(errorMessage))
    }, timeoutMs)
  })

  try {
    return await Promise.race([operation, timeoutPromise])
  } finally {
    if (timer !== null) {
      clearTimeout(timer)
    }
  }
}

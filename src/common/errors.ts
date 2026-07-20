export class AppError extends Error {
  public readonly statusCode: number

  public readonly code: string

  constructor(message: string, statusCode: number, code: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

export class UnauthorizedError extends AppError {
  constructor() {
    super('Unauthorized', 401, 'UNAUTHORIZED')
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super('Forbidden', 403, 'FORBIDDEN')
  }
}

export class ValidationError extends AppError {
  constructor(msg: string) {
    super(msg, 422, 'VALIDATION_ERROR')
  }
}

export class ConflictError extends AppError {
  constructor(msg: string) {
    super(msg, 409, 'CONFLICT')
  }
}

export class ProviderRateLimitError extends AppError {
  public readonly retryAfterMs: number

  public readonly providerStatus: number

  constructor(
    message: string,
    retryAfterMs: number,
    providerStatus: number = 429
  ) {
    super(message, 503, 'PROVIDER_RATE_LIMITED')
    this.retryAfterMs = retryAfterMs
    this.providerStatus = providerStatus
  }
}

export class ProvisioningPackageMismatchError extends AppError {
  public readonly orderId: number

  public readonly expectedPackageId: string

  public readonly foundPackageIds: string[]

  constructor(
    message: string,
    orderId: number,
    expectedPackageId: string,
    foundPackageIds: string[]
  ) {
    super(message, 422, 'PROVISIONING_PACKAGE_MISMATCH')
    this.orderId = orderId
    this.expectedPackageId = expectedPackageId
    this.foundPackageIds = foundPackageIds
  }
}

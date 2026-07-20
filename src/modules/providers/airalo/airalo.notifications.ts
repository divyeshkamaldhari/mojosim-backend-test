import { AppError } from '../../../common/errors'

type AiraloCredentials = {
  client_id: string
  client_secret: string
}

type AiraloTokenResponse = {
  access_token: string
  expires_in: number
}

export type AiraloOptInResult = {
  type: string
  contact_point: string | null
}

const normalizeBaseUrl = (baseUrl: string): string => {
  let end = baseUrl.length
  while (end > 0 && baseUrl.codePointAt(end - 1) === 47) {
    end -= 1
  }
  return baseUrl.slice(0, end)
}

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  return value as Record<string, unknown>
}

const parseTokenPayload = (json: unknown): AiraloTokenResponse => {
  const root = toRecord(json)
  if (root === null) {
    throw new AppError('Invalid Airalo token response', 502, 'PROVIDER_ERROR')
  }
  const candidate = toRecord(root.data) ?? root
  const accessToken = candidate.access_token
  const expiresIn = candidate.expires_in
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new AppError('Invalid Airalo token response', 502, 'PROVIDER_ERROR')
  }
  const expires =
    typeof expiresIn === 'number' && Number.isFinite(expiresIn) && expiresIn > 0
      ? expiresIn
      : 3600
  return { access_token: accessToken, expires_in: expires }
}

const parseOptInPayload = (
  json: unknown,
  fallbackType: string
): AiraloOptInResult => {
  const root = toRecord(json)
  const data = root ? toRecord(root.data) : null
  const notification = data ? toRecord(data.notification) : null
  const contactPointRaw = notification?.contact_point
  const typeRaw = notification?.type
  return {
    type:
      typeof typeRaw === 'string' && typeRaw.length > 0
        ? typeRaw
        : fallbackType,
    contact_point:
      typeof contactPointRaw === 'string' && contactPointRaw.length > 0
        ? contactPointRaw
        : null,
  }
}

export class AiraloNotificationsClient {
  private readonly baseUrl: string

  private readonly clientId: string

  private readonly clientSecret: string

  private accessToken: string | null = null

  private accessTokenExpiresAt: Date | null = null

  constructor(apiBaseUrl: string, credentials: AiraloCredentials) {
    this.baseUrl = normalizeBaseUrl(apiBaseUrl)
    this.clientId = credentials.client_id
    this.clientSecret = credentials.client_secret
  }

  private async getAccessToken(): Promise<string> {
    const now = new Date()
    if (
      this.accessToken !== null &&
      this.accessTokenExpiresAt !== null &&
      now.getTime() < this.accessTokenExpiresAt.getTime()
    ) {
      return this.accessToken
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'client_credentials',
    })
    const response = await fetch(`${this.baseUrl}/token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })
    const json: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      throw new AppError(
        'Airalo token request failed for notifications',
        502,
        'PROVIDER_ERROR'
      )
    }
    const token = parseTokenPayload(json)
    this.accessToken = token.access_token
    this.accessTokenExpiresAt = new Date(
      Date.now() + token.expires_in * 1000 - 60_000
    )
    return this.accessToken
  }

  optIn = async (
    type: string,
    webhookUrl: string
  ): Promise<AiraloOptInResult> => {
    const token = await this.getAccessToken()
    const response = await fetch(`${this.baseUrl}/notifications/opt-in`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        webhook_url: webhookUrl,
      }),
    })
    const json: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      throw new AppError(
        `Airalo notifications opt-in failed for type "${type}"`,
        502,
        'PROVIDER_ERROR'
      )
    }
    return parseOptInPayload(json, type)
  }
}

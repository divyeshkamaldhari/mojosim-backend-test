import 'express-async-errors'
import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import cors from 'cors'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { ZodError } from 'zod'

import { env } from './config/env'
import { stripeWebhookMiddleware } from './modules/stripe'
import { routes } from './routes'
import {
  handleAiraloWebhook,
  validateAiraloWebhookEndpoint,
} from './webhooks/airalo.webhook.handler'
import { handleStripeWebhook } from './webhooks/stripe.webhook.handler'
import { logger } from './common/logger'
import { AppError, NotFoundError } from './common/errors'
import { streamMedia } from './controllers/media.controller'

export const app = express()

const isProduction = env.NODE_ENV === 'production'

app.use(
  morgan(isProduction ? 'combined' : 'dev', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
)

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
})

const allowedOrigins = new Set([
  env.APP_URL,
  env.FRONTEND_URL,
  ...(env.FRONTEND_ADMIN_URL ? [env.FRONTEND_ADMIN_URL] : []),
])

const allowedConnectSources = [
  "'self'",
  env.APP_URL,
  env.FRONTEND_URL,
  ...(env.FRONTEND_ADMIN_URL ? [env.FRONTEND_ADMIN_URL] : []),
]

// Swagger UI uses CDN assets and inline snippets.
// Keep CSP disabled in non-production for developer ergonomics, but enable a
// constrained policy in production.
app.use(
  helmet({
    contentSecurityPolicy: isProduction
      ? {
          useDefaults: true,
          directives: {
            defaultSrc: ["'self'"],
            baseUri: ["'self'"],
            frameAncestors: ["'none'"],
            objectSrc: ["'none'"],
            scriptSrc: [
              "'self'",
              "'unsafe-inline'",
              'https://cdn.jsdelivr.net',
            ],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'data:', 'https:'],
            fontSrc: ["'self'", 'data:', 'https:'],
            connectSrc: allowedConnectSources,
          },
        }
      : false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
)
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
  })
)
app.use(compression())
app.post(
  '/api/v1/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookMiddleware,
  handleStripeWebhook
)
app.head('/api/v1/webhooks/airalo', validateAiraloWebhookEndpoint)
app.post(
  '/api/v1/webhooks/airalo',
  express.raw({ type: 'application/json' }),
  handleAiraloWebhook
)
app.use(express.json({ limit: '1mb' }))
app.get('/backend/medias/*', streamMedia)

app.use('/api/v1', apiLimiter, routes)

app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`))
})

export const errorHandler = (
  err: Error,
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
): void => {
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.issues.map((issue) => issue.message),
      },
    })
    return
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message },
    })
    return
  }

  logger.error('Unhandled error', {
    err: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  })
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  })
}

app.use(errorHandler)

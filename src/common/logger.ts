import winston from 'winston'

const { combine, timestamp, json, colorize, simple } = winston.format

const isDev = process.env.NODE_ENV === 'development'

export const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: combine(
    timestamp(),
    isDev ? colorize() : json(),
    isDev ? simple() : json()
  ),
  transports: [new winston.transports.Console()],
  silent: process.env.NODE_ENV === 'test',
})

export const logInfo = (msg: string, meta?: object) => logger.info(msg, meta)
export const logWarn = (msg: string, meta?: object) => logger.warn(msg, meta)
export const logError = (msg: string, meta?: object) => logger.error(msg, meta)
export const logDebug = (msg: string, meta?: object) => logger.debug(msg, meta)

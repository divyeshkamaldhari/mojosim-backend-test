import 'dotenv/config'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { QueryInterface } from 'sequelize'
import { Umzug, type MigrationFn } from 'umzug'
import { SequelizeStorage } from 'umzug'
import { sequelize } from '../config/db'
import { logger } from '../common/logger'

type MigrationModule = {
  default: {
    up: (queryInterface: QueryInterface) => Promise<void>
    down: (queryInterface: QueryInterface) => Promise<void>
  }
}

const toLogString = (value: unknown): string => {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.message
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

const createUmzug = (): Umzug<QueryInterface> => {
  const queryInterface = sequelize.getQueryInterface()
  const migrationExt = __filename.endsWith('.ts') ? 'ts' : 'js'
  const requireFromHere = createRequire(__filename)

  return new Umzug<QueryInterface>({
    context: queryInterface,
    storage: new SequelizeStorage({ sequelize }),
    logger: {
      info: (message: unknown): void => {
        logger.info(toLogString(message), {})
      },
      warn: (message: unknown): void => {
        logger.warn(toLogString(message), {})
      },
      error: (message: unknown): void => {
        logger.error(toLogString(message), {})
      },
      debug: (message: unknown): void => {
        logger.debug(toLogString(message), {})
      },
    },
    migrations: {
      // Same folder as this CLI: src/migrations/*.ts (dev) or dist/migrations/*.js (Docker / CI)
      glob: [`[0-9]*-*.${migrationExt}`, { cwd: __dirname }],
      resolve: ({ name, path: filepath, context }) => {
        const load = async (): Promise<MigrationModule> => {
          if (!filepath) throw new Error(`Missing migration path: ${name}`)

          // In production we run compiled CommonJS JS. Loading via require(filepath)
          // avoids `import(file://...)` being transpiled into `require('file://...')`.
          if (migrationExt === 'js') {
            return requireFromHere(filepath) as MigrationModule
          }

          const migrationUrl = pathToFileURL(filepath).href
          return (await import(migrationUrl)) as MigrationModule
        }

        const up: MigrationFn<QueryInterface> = async () => {
          const mod = await load()
          await mod.default.up(context)
        }

        const down: MigrationFn<QueryInterface> = async () => {
          const mod = await load()
          await mod.default.down(context)
        }

        return { name, up, down }
      },
    },
  })
}

const main = async (): Promise<void> => {
  const cmd = process.argv[2]
  const umzug = createUmzug()

  if (!cmd || cmd === 'help') {
    logger.info(
      `Usage: node ${path.relative(process.cwd(), __filename)} <up|down|status>`,
      {}
    )
    process.exitCode = 1
    return
  }

  if (cmd === 'up') {
    await umzug.up()
    return
  }

  if (cmd === 'down') {
    await umzug.down()
    return
  }

  if (cmd === 'status') {
    const [executed, pending] = await Promise.all([
      umzug.executed(),
      umzug.pending(),
    ])
    logger.info('Migrations status', {
      executed: executed.map((m) => m.name),
      pending: pending.map((m) => m.name),
    })
    return
  }

  throw new Error(`Unknown command: ${cmd}`)
}

const runCli = async (): Promise<void> => {
  try {
    await main()
  } catch (error) {
    logger.error('Migration command failed', { error })
    process.exitCode = 1
  }
}

void runCli()

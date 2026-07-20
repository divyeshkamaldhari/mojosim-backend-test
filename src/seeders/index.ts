import 'dotenv/config'
import { sequelize } from '../config/db'
import { logger } from '../common/logger'
import { seedAdminUser } from './seed-admin-user'
import { seedAiraloProvider } from './seed-airalo-provider'
// import { seedContentBlocks } from './seed-content-blocks'

export const runAllSeeders = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    await seedAdminUser()
    await seedAiraloProvider()
    // await seedContentBlocks()
    logger.info('All seeders completed successfully', {})
  } catch (error) {
    logger.error('Seeders failed', { error })
    throw error
  } finally {
    await sequelize.close()
  }
}

import 'dotenv/config'
import { sequelize } from '../config/db'
// import { seedContentBlocks } from './seed-content-blocks'
import { logger } from '../common/logger'

const runSeeder = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    // await seedContentBlocks()
    await sequelize.close()
    logger.info('Content blocks seeder completed successfully')
  } catch (error) {
    logger.error('Content blocks seeder failed', { error })
    process.exitCode = 1
  }
}

void runSeeder()

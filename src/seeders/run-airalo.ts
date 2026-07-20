import 'dotenv/config'
import { sequelize } from '../config/db'
import { seedAiraloProvider } from './seed-airalo-provider'

const runSeeder = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    await seedAiraloProvider()
    await sequelize.close()
  } catch {
    process.exitCode = 1
  }
}

void runSeeder()

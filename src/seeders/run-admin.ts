import 'dotenv/config'
import { sequelize } from '../config/db'
import { seedAdminUser } from './seed-admin-user'

const runSeeder = async (): Promise<void> => {
  try {
    await sequelize.authenticate()
    await seedAdminUser()
    await sequelize.close()
  } catch {
    process.exitCode = 1
  }
}

void runSeeder()

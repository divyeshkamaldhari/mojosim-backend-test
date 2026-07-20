import 'dotenv/config'
import bcrypt from 'bcrypt'
import { User } from '../models/user'
import { logger } from '../common/logger'

export const seedAdminUser = async (): Promise<void> => {
  try {
    const email = 'admin@mojosim.com'
    const existing = await User.findOne({ where: { email } })
    if (existing) {
      logger.info('Admin user already exists', { email })
      return
    }

    const passwordHash = await bcrypt.hash('ChangeMe123!', 12)

    await User.create({
      email,
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      avatarUrl: null,
      phone: null,
      locale: 'en',
      currency: 'USD',
      role: 'admin',
      isActive: true,
      emailVerified: true,
    })

    logger.info('Seeded admin user', { email })
  } catch (error) {
    logger.error('Failed to seed admin user', { error })
    throw error
  }
}

import 'dotenv/config'
import { Provider } from '../models/provider'
import { logger } from '../common/logger'

export const seedAiraloProvider = async (): Promise<void> => {
  try {
    const slug = 'airalo'
    const existing = await Provider.findOne({ where: { slug } })
    if (existing) {
      logger.info('Airalo provider already exists', { slug })
      return
    }

    await Provider.create({
      name: 'Airalo',
      slug,
      apiBaseUrl: 'https://partners-api.airalo.com/v2',
      apiCredentialsEnc: 'ENCRYPTED_PLACEHOLDER',
      isActive: true,
      priority: 1,
      capabilities: {
        webhooks: true,
        topup: false,
        renewal: true,
        usage_api: true,
      },
    })

    logger.info('Seeded Airalo provider', { slug })
  } catch (error) {
    logger.error('Failed to seed Airalo provider', { error })
    throw error
  }
}

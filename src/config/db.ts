import { Sequelize } from 'sequelize-typescript'
import { env, getDatabaseUrl } from './env'
import { logger } from '../common/logger'
import { User } from '../models/user'
import { UserSession } from '../models/user-session'
import { Provider } from '../models/provider'
import { Plan } from '../models/plan'
import { PlanTranslation } from '../models/plan-translation'
import { PlanDestination } from '../models/plan-destination'
import { Cart } from '../models/cart'
import { CartItem } from '../models/cart-item'
import { Order } from '../models/order'
import { Invoice } from '../models/invoice'
import { EsimProfile } from '../models/esim-profile'
import { ProfileStatusHistory } from '../models/profile-status-history'
import { ProvisioningJob } from '../models/provisioning-job'
import { UsageRecord } from '../models/usage-record'
import { WebhookEvent } from '../models/webhook-event'
import { Notification } from '../models/notification'
import { AuditLog } from '../models/audit-log'
import { ContentBlock } from '../models/content-block'
import { ContactSubmission } from '../models/contact-submission.model'
import { CompatibleDevice } from '../models/compatible-device'
import { DestinationControl } from '../models/destination-control'
import { AuthOtp } from '../models/auth-otp'
import { NewsletterSubscription } from '../models/newsletter-subscription.model'
import { setupAssociations } from '../models/associations'

export const sequelize = new Sequelize(getDatabaseUrl(), {
  dialect: 'postgres',
  logging: env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
  models: [
    User,
    UserSession,
    Provider,
    Plan,
    PlanTranslation,
    PlanDestination,
    Cart,
    CartItem,
    Order,
    Invoice,
    EsimProfile,
    ProfileStatusHistory,
    ProvisioningJob,
    UsageRecord,
    WebhookEvent,
    Notification,
    AuditLog,
    ContentBlock,
    ContactSubmission,
    CompatibleDevice,
    DestinationControl,
    AuthOtp,
    NewsletterSubscription,
  ],
})

setupAssociations()

export const initDb = async (retries = 5, delayMs = 3000): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sequelize.authenticate()
      logger.info('Database connection established', {})
      return
    } catch (error) {
      logger.error('Database connection failed', { error, attempt, retries })
      if (attempt === retries) throw error
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }
}

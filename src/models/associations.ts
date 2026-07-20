import { User } from './user'
import { UserSession } from './user-session'
import { Provider } from './provider'
import { CompatibleDevice } from './compatible-device'
import { Plan } from './plan'
import { PlanTranslation } from './plan-translation'
import { PlanDestination } from './plan-destination'
import { Cart } from './cart'
import { CartItem } from './cart-item'
import { Order } from './order'
import { Invoice } from './invoice'
import { EsimProfile } from './esim-profile'
import { ProfileStatusHistory } from './profile-status-history'
import { ProvisioningJob } from './provisioning-job'
import { UsageRecord } from './usage-record'
import { Notification } from './notification'
import { AuditLog } from './audit-log'
import { ContentBlock } from './content-block'

export const setupAssociations = (): void => {
  User.hasMany(UserSession, { foreignKey: 'user_id', as: 'sessions' })
  UserSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

  Provider.hasMany(Plan, { foreignKey: 'provider_id', as: 'plans' })
  Plan.belongsTo(Provider, { foreignKey: 'provider_id', as: 'provider' })

  Provider.hasMany(CompatibleDevice, {
    foreignKey: 'provider_id',
    as: 'compatibleDevices',
  })
  CompatibleDevice.belongsTo(Provider, {
    foreignKey: 'provider_id',
    as: 'provider',
  })

  Plan.hasMany(PlanTranslation, {
    foreignKey: 'plan_id',
    as: 'translations',
  })
  PlanTranslation.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' })

  Plan.hasMany(PlanDestination, {
    foreignKey: 'plan_id',
    as: 'destinations',
  })
  PlanDestination.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' })

  User.hasMany(Cart, { foreignKey: 'user_id', as: 'carts' })
  Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

  Cart.hasMany(CartItem, { foreignKey: 'cart_id', as: 'items' })
  CartItem.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' })

  Plan.hasMany(CartItem, { foreignKey: 'plan_id', as: 'cartItems' })
  CartItem.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' })

  User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' })
  Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

  Plan.hasMany(Order, { foreignKey: 'plan_id', as: 'orders' })
  Order.belongsTo(Plan, { foreignKey: 'plan_id', as: 'plan' })

  Cart.hasMany(Order, { foreignKey: 'cart_id', as: 'orders' })
  Order.belongsTo(Cart, { foreignKey: 'cart_id', as: 'cart' })

  Order.hasOne(Invoice, { foreignKey: 'order_id', as: 'invoice' })
  Invoice.belongsTo(Order, { foreignKey: 'order_id', as: 'order' })

  User.hasMany(Invoice, { foreignKey: 'user_id', as: 'invoices' })
  Invoice.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

  Order.hasOne(EsimProfile, {
    foreignKey: 'order_id',
    as: 'esimProfile',
  })
  EsimProfile.belongsTo(Order, { foreignKey: 'order_id', as: 'order' })

  Provider.hasMany(EsimProfile, {
    foreignKey: 'provider_id',
    as: 'esimProfiles',
  })
  EsimProfile.belongsTo(Provider, {
    foreignKey: 'provider_id',
    as: 'provider',
  })

  EsimProfile.hasMany(ProfileStatusHistory, {
    foreignKey: 'esim_profile_id',
    as: 'statusHistory',
  })
  ProfileStatusHistory.belongsTo(EsimProfile, {
    foreignKey: 'esim_profile_id',
    as: 'esimProfile',
  })

  User.hasMany(ProfileStatusHistory, {
    foreignKey: 'actor_id',
    as: 'profileStatusChanges',
  })
  ProfileStatusHistory.belongsTo(User, {
    foreignKey: 'actor_id',
    as: 'actor',
  })

  Order.hasMany(ProvisioningJob, {
    foreignKey: 'order_id',
    as: 'provisioningJobs',
  })
  ProvisioningJob.belongsTo(Order, {
    foreignKey: 'order_id',
    as: 'order',
  })

  EsimProfile.hasMany(ProvisioningJob, {
    foreignKey: 'esim_profile_id',
    as: 'provisioningJobs',
  })
  ProvisioningJob.belongsTo(EsimProfile, {
    foreignKey: 'esim_profile_id',
    as: 'esimProfile',
  })

  EsimProfile.hasMany(UsageRecord, {
    foreignKey: 'esim_profile_id',
    as: 'usageRecords',
  })
  UsageRecord.belongsTo(EsimProfile, {
    foreignKey: 'esim_profile_id',
    as: 'esimProfile',
  })

  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' })
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' })

  User.hasMany(AuditLog, { foreignKey: 'actor_id', as: 'auditLogs' })
  AuditLog.belongsTo(User, { foreignKey: 'actor_id', as: 'actor' })

  User.hasMany(ContentBlock, {
    foreignKey: 'updated_by',
    as: 'contentBlocks',
  })
  ContentBlock.belongsTo(User, {
    foreignKey: 'updated_by',
    as: 'updatedByUser',
  })
}

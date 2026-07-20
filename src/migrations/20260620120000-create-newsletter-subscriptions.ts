import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

const createEnumIfNotExists = async (
  queryInterface: QueryInterface,
  name: string,
  values: readonly string[]
): Promise<void> => {
  const valuesSql = values.map((v) => `'${v.replaceAll("'", "''")}'`).join(', ')
  await queryInterface.sequelize.query(
    `DO $$ BEGIN
      CREATE TYPE ${name} AS ENUM (${valuesSql});
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;`
  )
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await createEnumIfNotExists(
      queryInterface,
      'newsletter_subscription_status',
      ['active', 'used', 'expired']
    )

    if (!(await tableExists(queryInterface, 'newsletter_subscriptions'))) {
      await queryInterface.createTable('newsletter_subscriptions', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
          unique: true,
        },
        promo_code: {
          type: DataTypes.STRING(32),
          allowNull: false,
          unique: true,
        },
        discount_percent: {
          type: DataTypes.DECIMAL(5, 2),
          allowNull: false,
          defaultValue: '10.00',
        },
        status: {
          type: 'newsletter_subscription_status',
          allowNull: false,
          defaultValue: 'active',
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        terms_accepted_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        used_order_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'orders', key: 'id' },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        used_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        subscribed_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      })
    }

    await createIndexIfNotExists(
      queryInterface,
      'newsletter_subscriptions_email_idx',
      'newsletter_subscriptions',
      ['email']
    )
    await createIndexIfNotExists(
      queryInterface,
      'newsletter_subscriptions_promo_code_idx',
      'newsletter_subscriptions',
      ['promo_code']
    )
    await createIndexIfNotExists(
      queryInterface,
      'newsletter_subscriptions_status_idx',
      'newsletter_subscriptions',
      ['status']
    )
    await createIndexIfNotExists(
      queryInterface,
      'newsletter_subscriptions_expires_at_idx',
      'newsletter_subscriptions',
      ['expires_at']
    )
    await createIndexIfNotExists(
      queryInterface,
      'newsletter_subscriptions_used_order_id_idx',
      'newsletter_subscriptions',
      ['used_order_id']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('newsletter_subscriptions')
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS newsletter_subscription_status;'
    )
  },
}

import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'orders'))) {
      await queryInterface.createTable('orders', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'RESTRICT',
        },
        plan_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'plans', key: 'id' },
          onDelete: 'RESTRICT',
        },
        cart_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'carts', key: 'id' },
          onDelete: 'SET NULL',
        },
        idempotency_key: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        order_type: {
          type: 'order_type',
          allowNull: false,
        },
        status: {
          type: 'order_status',
          allowNull: false,
        },
        amount: {
          type: DataTypes.DECIMAL(20, 2),
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        payment_gateway: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        payment_ref: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        payment_status: {
          type: 'payment_status',
          allowNull: false,
        },
        billing_snapshot: {
          type: DataTypes.JSONB,
          allowNull: false,
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
      'orders_user_id_idx',
      'orders',
      ['user_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'orders_plan_id_idx',
      'orders',
      ['plan_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'orders_cart_id_idx',
      'orders',
      ['cart_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'orders_order_type_idx',
      'orders',
      ['order_type']
    )
    await createIndexIfNotExists(
      queryInterface,
      'orders_status_idx',
      'orders',
      ['status']
    )
    await createIndexIfNotExists(
      queryInterface,
      'orders_payment_status_idx',
      'orders',
      ['payment_status']
    )
    await createIndexIfNotExists(
      queryInterface,
      'orders_created_at_idx',
      'orders',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('orders')
  },
}

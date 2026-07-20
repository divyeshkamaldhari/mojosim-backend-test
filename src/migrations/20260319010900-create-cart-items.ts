import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'cart_items'))) {
      await queryInterface.createTable('cart_items', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        cart_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'carts', key: 'id' },
          onDelete: 'CASCADE',
        },
        plan_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'plans', key: 'id' },
          onDelete: 'RESTRICT',
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        unit_price: {
          type: DataTypes.DECIMAL(20, 2),
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING,
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
      'cart_items_cart_id_idx',
      'cart_items',
      ['cart_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'cart_items_plan_id_idx',
      'cart_items',
      ['plan_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'cart_items_created_at_idx',
      'cart_items',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('cart_items')
  },
}

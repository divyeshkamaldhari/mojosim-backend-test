import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'carts'))) {
      await queryInterface.createTable('carts', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'CASCADE',
        },
        status: {
          type: 'cart_status',
          allowNull: false,
        },
        expires_at: {
          type: DataTypes.DATE,
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

    await createIndexIfNotExists(queryInterface, 'carts_user_id_idx', 'carts', [
      'user_id',
    ])
    await createIndexIfNotExists(queryInterface, 'carts_status_idx', 'carts', [
      'status',
    ])
    await createIndexIfNotExists(
      queryInterface,
      'carts_expires_at_idx',
      'carts',
      ['expires_at']
    )
    await createIndexIfNotExists(
      queryInterface,
      'carts_created_at_idx',
      'carts',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('carts')
  },
}

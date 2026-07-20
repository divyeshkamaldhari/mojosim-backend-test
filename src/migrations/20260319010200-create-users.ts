import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'users'))) {
      await queryInterface.createTable('users', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        password_hash: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        first_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        last_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        avatar_url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        locale: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        role: {
          type: 'user_role',
          allowNull: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        email_verified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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

    await createIndexIfNotExists(queryInterface, 'users_role_idx', 'users', [
      'role',
    ])
    await createIndexIfNotExists(
      queryInterface,
      'users_is_active_idx',
      'users',
      ['is_active']
    )
    await createIndexIfNotExists(
      queryInterface,
      'users_email_verified_idx',
      'users',
      ['email_verified']
    )
    await createIndexIfNotExists(
      queryInterface,
      'users_created_at_idx',
      'users',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('users')
  },
}

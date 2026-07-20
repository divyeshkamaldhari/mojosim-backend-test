import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'user_sessions'))) {
      await queryInterface.createTable('user_sessions', {
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
          onDelete: 'CASCADE',
        },
        token_hash: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        ip_address: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        user_agent: {
          type: DataTypes.TEXT,
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

    await createIndexIfNotExists(
      queryInterface,
      'user_sessions_user_id_idx',
      'user_sessions',
      ['user_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'user_sessions_expires_at_idx',
      'user_sessions',
      ['expires_at']
    )
    await createIndexIfNotExists(
      queryInterface,
      'user_sessions_created_at_idx',
      'user_sessions',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('user_sessions')
  },
}

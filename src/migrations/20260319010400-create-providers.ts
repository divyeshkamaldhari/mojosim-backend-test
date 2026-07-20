import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'providers'))) {
      await queryInterface.createTable('providers', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        api_base_url: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        api_credentials_enc: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        priority: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        capabilities: {
          type: DataTypes.JSONB,
          allowNull: false,
          defaultValue: {},
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
      'providers_is_active_idx',
      'providers',
      ['is_active']
    )
    await createIndexIfNotExists(
      queryInterface,
      'providers_priority_idx',
      'providers',
      ['priority']
    )
    await createIndexIfNotExists(
      queryInterface,
      'providers_created_at_idx',
      'providers',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('providers')
  },
}

import { DataTypes, QueryInterface } from 'sequelize'

import {
  createIndexIfNotExists,
  createUniqueIndexIfNotExists,
  tableExists,
} from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'plans'))) {
      await queryInterface.createTable('plans', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        provider_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'providers', key: 'id' },
          onDelete: 'RESTRICT',
        },
        provider_sku: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        data_mb: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        validity_days: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        price: {
          type: DataTypes.DECIMAL(20, 2),
          allowNull: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        is_featured: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        synced_at: {
          type: DataTypes.DATE,
          allowNull: true,
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
      'plans_provider_id_idx',
      'plans',
      ['provider_id']
    )
    await createUniqueIndexIfNotExists(
      queryInterface,
      'plans_provider_sku_unique_idx',
      'plans',
      ['provider_id', 'provider_sku']
    )
    await createIndexIfNotExists(
      queryInterface,
      'plans_is_active_idx',
      'plans',
      ['is_active']
    )
    await createIndexIfNotExists(
      queryInterface,
      'plans_is_featured_idx',
      'plans',
      ['is_featured']
    )
    await createIndexIfNotExists(
      queryInterface,
      'plans_synced_at_idx',
      'plans',
      ['synced_at']
    )
    await createIndexIfNotExists(
      queryInterface,
      'plans_created_at_idx',
      'plans',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('plans')
  },
}

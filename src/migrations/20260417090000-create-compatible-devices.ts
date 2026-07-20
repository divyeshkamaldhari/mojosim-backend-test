import { DataTypes, QueryInterface } from 'sequelize'

import {
  createIndexIfNotExists,
  createUniqueIndexIfNotExists,
  tableExists,
} from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'compatible_devices'))) {
      await queryInterface.createTable('compatible_devices', {
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
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        os: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        brand: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        synced_at: {
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

    await createUniqueIndexIfNotExists(
      queryInterface,
      'compatible_devices_provider_os_brand_name_uq',
      'compatible_devices',
      ['provider_id', 'os', 'brand', 'name']
    )
    await createIndexIfNotExists(
      queryInterface,
      'compatible_devices_provider_id_idx',
      'compatible_devices',
      ['provider_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'compatible_devices_is_active_idx',
      'compatible_devices',
      ['is_active']
    )
    await createIndexIfNotExists(
      queryInterface,
      'compatible_devices_synced_at_idx',
      'compatible_devices',
      ['synced_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('compatible_devices')
  },
}

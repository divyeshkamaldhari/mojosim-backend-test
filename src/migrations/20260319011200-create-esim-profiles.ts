import { DataTypes, QueryInterface } from 'sequelize'

import {
  createIndexIfNotExists,
  createUniqueIndexIfNotExists,
  tableExists,
} from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'esim_profiles'))) {
      await queryInterface.createTable('esim_profiles', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'orders', key: 'id' },
          onDelete: 'RESTRICT',
        },
        provider_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'providers', key: 'id' },
          onDelete: 'RESTRICT',
        },
        iccid: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        ean: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        qr_payload_enc: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        install_instructions: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        lifecycle_state: {
          type: 'esim_state',
          allowNull: false,
        },
        activated_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        last_synced_at: {
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

    await createUniqueIndexIfNotExists(
      queryInterface,
      'esim_profiles_order_id_unique_idx',
      'esim_profiles',
      ['order_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'esim_profiles_provider_id_idx',
      'esim_profiles',
      ['provider_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'esim_profiles_lifecycle_state_idx',
      'esim_profiles',
      ['lifecycle_state']
    )
    await createIndexIfNotExists(
      queryInterface,
      'esim_profiles_expires_at_idx',
      'esim_profiles',
      ['expires_at']
    )
    await createIndexIfNotExists(
      queryInterface,
      'esim_profiles_activated_at_idx',
      'esim_profiles',
      ['activated_at']
    )
    await createIndexIfNotExists(
      queryInterface,
      'esim_profiles_last_synced_at_idx',
      'esim_profiles',
      ['last_synced_at']
    )
    await createIndexIfNotExists(
      queryInterface,
      'esim_profiles_created_at_idx',
      'esim_profiles',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('esim_profiles')
  },
}

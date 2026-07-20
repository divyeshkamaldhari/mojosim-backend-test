import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'renewals'))) {
      await queryInterface.createTable('renewals', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        esim_profile_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'esim_profiles', key: 'id' },
          onDelete: 'RESTRICT',
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'orders', key: 'id' },
          onDelete: 'RESTRICT',
        },
        renewal_type: {
          type: 'renewal_type',
          allowNull: false,
        },
        previous_expires_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        new_expires_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        provider_renewal_ref: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        status: {
          type: 'renewal_status',
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
      'renewals_esim_profile_id_idx',
      'renewals',
      ['esim_profile_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'renewals_order_id_idx',
      'renewals',
      ['order_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'renewals_renewal_type_idx',
      'renewals',
      ['renewal_type']
    )
    await createIndexIfNotExists(
      queryInterface,
      'renewals_status_idx',
      'renewals',
      ['status']
    )
    await createIndexIfNotExists(
      queryInterface,
      'renewals_created_at_idx',
      'renewals',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('renewals')
  },
}

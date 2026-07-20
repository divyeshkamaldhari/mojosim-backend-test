import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'usage_records'))) {
      await queryInterface.createTable('usage_records', {
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
          onDelete: 'CASCADE',
        },
        data_used_mb: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        data_remaining_mb: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        source: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        recorded_at: {
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
      'usage_records_esim_profile_id_idx',
      'usage_records',
      ['esim_profile_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'usage_records_source_idx',
      'usage_records',
      ['source']
    )
    await createIndexIfNotExists(
      queryInterface,
      'usage_records_recorded_at_idx',
      'usage_records',
      ['recorded_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('usage_records')
  },
}

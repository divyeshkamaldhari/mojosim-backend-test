import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'provisioning_jobs'))) {
      await queryInterface.createTable('provisioning_jobs', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'orders', key: 'id' },
          onDelete: 'RESTRICT',
        },
        esim_profile_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'esim_profiles', key: 'id' },
          onDelete: 'SET NULL',
        },
        status: {
          type: 'job_status',
          allowNull: false,
        },
        attempt_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        max_attempts: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 5,
        },
        last_error: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        provider_request: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        provider_response: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        next_retry_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        completed_at: {
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
      'provisioning_jobs_order_id_idx',
      'provisioning_jobs',
      ['order_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'provisioning_jobs_esim_profile_id_idx',
      'provisioning_jobs',
      ['esim_profile_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'provisioning_jobs_status_idx',
      'provisioning_jobs',
      ['status']
    )
    await createIndexIfNotExists(
      queryInterface,
      'provisioning_jobs_next_retry_at_idx',
      'provisioning_jobs',
      ['next_retry_at']
    )
    await createIndexIfNotExists(
      queryInterface,
      'provisioning_jobs_created_at_idx',
      'provisioning_jobs',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('provisioning_jobs')
  },
}

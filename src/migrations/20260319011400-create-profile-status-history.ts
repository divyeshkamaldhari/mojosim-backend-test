import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'profile_status_history'))) {
      await queryInterface.createTable('profile_status_history', {
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
        from_state: {
          type: 'esim_state',
          allowNull: true,
        },
        to_state: {
          type: 'esim_state',
          allowNull: false,
        },
        source: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        reason: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        actor_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
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
      'profile_status_history_esim_profile_id_idx',
      'profile_status_history',
      ['esim_profile_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'profile_status_history_actor_id_idx',
      'profile_status_history',
      ['actor_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'profile_status_history_to_state_idx',
      'profile_status_history',
      ['to_state']
    )
    await createIndexIfNotExists(
      queryInterface,
      'profile_status_history_created_at_idx',
      'profile_status_history',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('profile_status_history')
  },
}

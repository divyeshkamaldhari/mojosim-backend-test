import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'support_tickets'))) {
      await queryInterface.createTable('support_tickets', {
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
          onDelete: 'RESTRICT',
        },
        esim_profile_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'esim_profiles', key: 'id' },
          onDelete: 'SET NULL',
        },
        subject: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        status: {
          type: 'ticket_status',
          allowNull: false,
        },
        priority: {
          type: 'ticket_priority',
          allowNull: false,
        },
        assigned_to: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
        },
        resolved_at: {
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
      'support_tickets_user_id_idx',
      'support_tickets',
      ['user_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'support_tickets_esim_profile_id_idx',
      'support_tickets',
      ['esim_profile_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'support_tickets_assigned_to_idx',
      'support_tickets',
      ['assigned_to']
    )
    await createIndexIfNotExists(
      queryInterface,
      'support_tickets_status_idx',
      'support_tickets',
      ['status']
    )
    await createIndexIfNotExists(
      queryInterface,
      'support_tickets_priority_idx',
      'support_tickets',
      ['priority']
    )
    await createIndexIfNotExists(
      queryInterface,
      'support_tickets_created_at_idx',
      'support_tickets',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('support_tickets')
  },
}

import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'audit_logs'))) {
      await queryInterface.createTable('audit_logs', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        actor_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
        },
        action: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        entity_type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        entity_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        before_state: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        after_state: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        ip_address: {
          type: DataTypes.STRING,
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
      'audit_logs_actor_id_idx',
      'audit_logs',
      ['actor_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'audit_logs_entity_type_idx',
      'audit_logs',
      ['entity_type']
    )
    await createIndexIfNotExists(
      queryInterface,
      'audit_logs_entity_id_idx',
      'audit_logs',
      ['entity_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'audit_logs_created_at_idx',
      'audit_logs',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('audit_logs')
  },
}

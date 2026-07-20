import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'webhook_events'))) {
      await queryInterface.createTable('webhook_events', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        source: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        event_type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        payload: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        processed: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        processing_error: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        received_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        processed_at: {
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
      'webhook_events_source_idx',
      'webhook_events',
      ['source']
    )
    await createIndexIfNotExists(
      queryInterface,
      'webhook_events_event_type_idx',
      'webhook_events',
      ['event_type']
    )
    await createIndexIfNotExists(
      queryInterface,
      'webhook_events_processed_idx',
      'webhook_events',
      ['processed']
    )
    await createIndexIfNotExists(
      queryInterface,
      'webhook_events_received_at_idx',
      'webhook_events',
      ['received_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('webhook_events')
  },
}

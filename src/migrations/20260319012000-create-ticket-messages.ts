import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'ticket_messages'))) {
      await queryInterface.createTable('ticket_messages', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        ticket_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'support_tickets', key: 'id' },
          onDelete: 'CASCADE',
        },
        sender_id: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        is_internal: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
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
      'ticket_messages_ticket_id_idx',
      'ticket_messages',
      ['ticket_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'ticket_messages_sender_id_idx',
      'ticket_messages',
      ['sender_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'ticket_messages_is_internal_idx',
      'ticket_messages',
      ['is_internal']
    )
    await createIndexIfNotExists(
      queryInterface,
      'ticket_messages_created_at_idx',
      'ticket_messages',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('ticket_messages')
  },
}

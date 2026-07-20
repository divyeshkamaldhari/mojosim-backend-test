import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'notifications'))) {
      await queryInterface.createTable('notifications', {
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
          onDelete: 'CASCADE',
        },
        channel: {
          type: 'notif_channel',
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        subject: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        body: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        meta: {
          type: DataTypes.JSONB,
          allowNull: true,
        },
        sent_at: {
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
      'notifications_user_id_idx',
      'notifications',
      ['user_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'notifications_channel_idx',
      'notifications',
      ['channel']
    )
    await createIndexIfNotExists(
      queryInterface,
      'notifications_type_idx',
      'notifications',
      ['type']
    )
    await createIndexIfNotExists(
      queryInterface,
      'notifications_is_read_idx',
      'notifications',
      ['is_read']
    )
    await createIndexIfNotExists(
      queryInterface,
      'notifications_sent_at_idx',
      'notifications',
      ['sent_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('notifications')
  },
}

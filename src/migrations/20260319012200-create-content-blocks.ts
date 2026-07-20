import { DataTypes, QueryInterface } from 'sequelize'

import {
  createIndexIfNotExists,
  createUniqueIndexIfNotExists,
  tableExists,
} from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'content_blocks'))) {
      await queryInterface.createTable('content_blocks', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        key: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        locale: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        type: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        value: {
          type: DataTypes.JSONB,
          allowNull: false,
        },
        is_published: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        updated_by: {
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

    await createUniqueIndexIfNotExists(
      queryInterface,
      'content_blocks_key_locale_unique_idx',
      'content_blocks',
      ['key', 'locale']
    )
    await createIndexIfNotExists(
      queryInterface,
      'content_blocks_updated_by_idx',
      'content_blocks',
      ['updated_by']
    )
    await createIndexIfNotExists(
      queryInterface,
      'content_blocks_is_published_idx',
      'content_blocks',
      ['is_published']
    )
    await createIndexIfNotExists(
      queryInterface,
      'content_blocks_created_at_idx',
      'content_blocks',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('content_blocks')
  },
}

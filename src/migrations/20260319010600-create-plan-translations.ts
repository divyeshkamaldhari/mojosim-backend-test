import { DataTypes, QueryInterface } from 'sequelize'

import {
  createIndexIfNotExists,
  createUniqueIndexIfNotExists,
  tableExists,
} from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'plan_translations'))) {
      await queryInterface.createTable('plan_translations', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        plan_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'plans', key: 'id' },
          onDelete: 'CASCADE',
        },
        locale: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
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
      'plan_translations_plan_id_idx',
      'plan_translations',
      ['plan_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'plan_translations_locale_idx',
      'plan_translations',
      ['locale']
    )
    await createUniqueIndexIfNotExists(
      queryInterface,
      'plan_translations_plan_id_locale_unique_idx',
      'plan_translations',
      ['plan_id', 'locale']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('plan_translations')
  },
}

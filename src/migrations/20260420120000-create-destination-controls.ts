import { DataTypes, QueryInterface } from 'sequelize'

import {
  createIndexIfNotExists,
  createUniqueIndexIfNotExists,
  tableExists,
} from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'destination_controls'))) {
      await queryInterface.createTable('destination_controls', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        country_code: {
          type: DataTypes.CHAR(2),
          allowNull: false,
        },
        country_name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
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
      'destination_controls_country_code_uq',
      'destination_controls',
      ['country_code']
    )
    await createIndexIfNotExists(
      queryInterface,
      'destination_controls_is_active_idx',
      'destination_controls',
      ['is_active']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('destination_controls')
  },
}

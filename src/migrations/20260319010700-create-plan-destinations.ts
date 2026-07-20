import { DataTypes, QueryInterface } from 'sequelize'

import {
  createIndexIfNotExists,
  createUniqueIndexIfNotExists,
  tableExists,
} from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'plan_destinations'))) {
      await queryInterface.createTable('plan_destinations', {
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
        country_code: {
          type: DataTypes.CHAR(2),
          allowNull: false,
        },
        country_name: {
          type: DataTypes.STRING,
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
      'plan_destinations_plan_id_idx',
      'plan_destinations',
      ['plan_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'plan_destinations_country_code_idx',
      'plan_destinations',
      ['country_code']
    )
    await createUniqueIndexIfNotExists(
      queryInterface,
      'plan_destinations_plan_id_country_code_unique_idx',
      'plan_destinations',
      ['plan_id', 'country_code']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('plan_destinations')
  },
}

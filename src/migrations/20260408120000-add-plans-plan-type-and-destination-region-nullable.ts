import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists, createIndexIfNotExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await columnExists(queryInterface, 'plans', 'plan_type'))) {
      await queryInterface.addColumn('plans', 'plan_type', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'local',
      })
    }
    if (!(await columnExists(queryInterface, 'plans', 'flag_url'))) {
      await queryInterface.addColumn('plans', 'flag_url', {
        type: DataTypes.STRING(500),
        allowNull: true,
      })
    }
    if (!(await columnExists(queryInterface, 'plans', 'region_name'))) {
      await queryInterface.addColumn('plans', 'region_name', {
        type: DataTypes.STRING(255),
        allowNull: true,
      })
    }
    await createIndexIfNotExists(
      queryInterface,
      'plans_plan_type_idx',
      'plans',
      ['plan_type']
    )

    if (await columnExists(queryInterface, 'plan_destinations', 'region')) {
      await queryInterface.changeColumn('plan_destinations', 'region', {
        type: DataTypes.STRING,
        allowNull: true,
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await columnExists(queryInterface, 'plan_destinations', 'region')) {
      await queryInterface.sequelize.query(
        `UPDATE plan_destinations SET region = '' WHERE region IS NULL`
      )
      await queryInterface.changeColumn('plan_destinations', 'region', {
        type: DataTypes.STRING,
        allowNull: false,
      })
    }
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "plans_plan_type_idx"`
    )
    if (await columnExists(queryInterface, 'plans', 'region_name')) {
      await queryInterface.removeColumn('plans', 'region_name')
    }
    if (await columnExists(queryInterface, 'plans', 'flag_url')) {
      await queryInterface.removeColumn('plans', 'flag_url')
    }
    if (await columnExists(queryInterface, 'plans', 'plan_type')) {
      await queryInterface.removeColumn('plans', 'plan_type')
    }
  },
}

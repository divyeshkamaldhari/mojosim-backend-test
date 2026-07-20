import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "plan_destinations_region_idx"`
    )
    if (await columnExists(queryInterface, 'plan_destinations', 'region')) {
      await queryInterface.removeColumn('plan_destinations', 'region')
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await columnExists(queryInterface, 'plan_destinations', 'region'))) {
      await queryInterface.addColumn('plan_destinations', 'region', {
        type: DataTypes.STRING,
        allowNull: true,
      })
    }
  },
}

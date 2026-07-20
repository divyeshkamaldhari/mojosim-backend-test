import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists, createIndexIfNotExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await columnExists(queryInterface, 'plans', 'airalo_package_type'))) {
      await queryInterface.addColumn('plans', 'airalo_package_type', {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'other',
      })
    }
    await createIndexIfNotExists(
      queryInterface,
      'plans_airalo_package_type_idx',
      'plans',
      ['airalo_package_type']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "plans_airalo_package_type_idx"`
    )
    if (await columnExists(queryInterface, 'plans', 'airalo_package_type')) {
      await queryInterface.removeColumn('plans', 'airalo_package_type')
    }
  },
}

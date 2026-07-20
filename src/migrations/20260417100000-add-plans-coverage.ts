import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await columnExists(queryInterface, 'plans', 'coverage'))) {
      await queryInterface.addColumn('plans', 'coverage', {
        type: DataTypes.JSONB,
        allowNull: true,
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await columnExists(queryInterface, 'plans', 'coverage')) {
      await queryInterface.removeColumn('plans', 'coverage')
    }
  },
}

import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await columnExists(queryInterface, 'plans', 'data_label'))) {
      await queryInterface.addColumn('plans', 'data_label', {
        type: DataTypes.STRING(255),
        allowNull: true,
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await columnExists(queryInterface, 'plans', 'data_label')) {
      await queryInterface.removeColumn('plans', 'data_label')
    }
  },
}

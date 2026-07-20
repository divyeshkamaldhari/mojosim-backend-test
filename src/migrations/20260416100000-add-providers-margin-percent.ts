import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'providers'))) {
      return
    }

    if (!(await columnExists(queryInterface, 'providers', 'margin_percent'))) {
      await queryInterface.addColumn('providers', 'margin_percent', {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: '20.00',
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      (await tableExists(queryInterface, 'providers')) &&
      (await columnExists(queryInterface, 'providers', 'margin_percent'))
    ) {
      await queryInterface.removeColumn('providers', 'margin_percent')
    }
  },
}

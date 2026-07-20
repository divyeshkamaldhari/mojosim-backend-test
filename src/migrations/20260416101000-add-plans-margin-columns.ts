import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'plans'))) {
      return
    }

    if (
      !(await columnExists(queryInterface, 'plans', 'custom_margin_percent'))
    ) {
      await queryInterface.addColumn('plans', 'custom_margin_percent', {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      })
    }

    if (!(await columnExists(queryInterface, 'plans', 'selling_price'))) {
      await queryInterface.addColumn('plans', 'selling_price', {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: true,
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      (await tableExists(queryInterface, 'plans')) &&
      (await columnExists(queryInterface, 'plans', 'selling_price'))
    ) {
      await queryInterface.removeColumn('plans', 'selling_price')
    }

    if (
      (await tableExists(queryInterface, 'plans')) &&
      (await columnExists(queryInterface, 'plans', 'custom_margin_percent'))
    ) {
      await queryInterface.removeColumn('plans', 'custom_margin_percent')
    }
  },
}

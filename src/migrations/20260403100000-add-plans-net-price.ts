import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await columnExists(queryInterface, 'plans', 'net_price'))) {
      await queryInterface.addColumn('plans', 'net_price', {
        type: DataTypes.DECIMAL(20, 2),
        allowNull: false,
        defaultValue: 0,
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeColumn('plans', 'net_price')
  },
}

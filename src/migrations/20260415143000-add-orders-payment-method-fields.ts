import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'orders'))) {
      return
    }

    if (
      !(await columnExists(queryInterface, 'orders', 'payment_method_type'))
    ) {
      await queryInterface.addColumn('orders', 'payment_method_type', {
        type: DataTypes.STRING,
        allowNull: true,
      })
    }

    if (
      !(await columnExists(queryInterface, 'orders', 'payment_method_brand'))
    ) {
      await queryInterface.addColumn('orders', 'payment_method_brand', {
        type: DataTypes.STRING,
        allowNull: true,
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      (await tableExists(queryInterface, 'orders')) &&
      (await columnExists(queryInterface, 'orders', 'payment_method_brand'))
    ) {
      await queryInterface.removeColumn('orders', 'payment_method_brand')
    }
    if (
      (await tableExists(queryInterface, 'orders')) &&
      (await columnExists(queryInterface, 'orders', 'payment_method_type'))
    ) {
      await queryInterface.removeColumn('orders', 'payment_method_type')
    }
  },
}

import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'orders'))) {
      return
    }

    if (!(await columnExists(queryInterface, 'orders', 'stripe_charge_id'))) {
      await queryInterface.addColumn('orders', 'stripe_charge_id', {
        type: DataTypes.STRING,
        allowNull: true,
      })
    }

    if (!(await columnExists(queryInterface, 'orders', 'stripe_receipt_url'))) {
      await queryInterface.addColumn('orders', 'stripe_receipt_url', {
        type: DataTypes.TEXT,
        allowNull: true,
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      (await tableExists(queryInterface, 'orders')) &&
      (await columnExists(queryInterface, 'orders', 'stripe_receipt_url'))
    ) {
      await queryInterface.removeColumn('orders', 'stripe_receipt_url')
    }
    if (
      (await tableExists(queryInterface, 'orders')) &&
      (await columnExists(queryInterface, 'orders', 'stripe_charge_id'))
    ) {
      await queryInterface.removeColumn('orders', 'stripe_charge_id')
    }
  },
}

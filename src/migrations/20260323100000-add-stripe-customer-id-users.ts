import { DataTypes, QueryInterface } from 'sequelize'

import { columnExists, createIndexIfNotExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await columnExists(queryInterface, 'users', 'stripe_customer_id'))) {
      await queryInterface.addColumn('users', 'stripe_customer_id', {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      })
    }

    await createIndexIfNotExists(
      queryInterface,
      'idx_users_stripe_customer_id',
      'users',
      ['stripe_customer_id']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.removeIndex('users', 'idx_users_stripe_customer_id')
    await queryInterface.removeColumn('users', 'stripe_customer_id')
  },
}

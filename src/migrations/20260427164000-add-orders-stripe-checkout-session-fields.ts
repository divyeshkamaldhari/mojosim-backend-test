import type { QueryInterface } from 'sequelize'

import { columnExists, createIndexIfNotExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      !(await columnExists(
        queryInterface,
        'orders',
        'stripe_checkout_session_id'
      ))
    ) {
      await queryInterface.addColumn('orders', 'stripe_checkout_session_id', {
        type: 'text',
        allowNull: true,
      })
    }

    if (
      !(await columnExists(queryInterface, 'orders', 'checkout_expires_at'))
    ) {
      await queryInterface.addColumn('orders', 'checkout_expires_at', {
        type: 'timestamp',
        allowNull: true,
      })
    }

    if (
      !(await columnExists(queryInterface, 'orders', 'stripe_checkout_url'))
    ) {
      await queryInterface.addColumn('orders', 'stripe_checkout_url', {
        type: 'text',
        allowNull: true,
      })
    }

    await createIndexIfNotExists(
      queryInterface,
      'orders_stripe_checkout_session_id_idx',
      'orders',
      ['stripe_checkout_session_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'orders_checkout_expires_at_idx',
      'orders',
      ['checkout_expires_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await columnExists(queryInterface, 'orders', 'stripe_checkout_url')) {
      await queryInterface.removeColumn('orders', 'stripe_checkout_url')
    }
    if (await columnExists(queryInterface, 'orders', 'checkout_expires_at')) {
      await queryInterface.removeColumn('orders', 'checkout_expires_at')
    }
    if (
      await columnExists(queryInterface, 'orders', 'stripe_checkout_session_id')
    ) {
      await queryInterface.removeColumn('orders', 'stripe_checkout_session_id')
    }
  },
}

import type { QueryInterface } from 'sequelize'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS orders_pending_checkout_reconcile_idx
      ON orders (created_at)
      WHERE status = 'pending' AND stripe_checkout_session_id IS NOT NULL;
    `)
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      DROP INDEX IF EXISTS orders_pending_checkout_reconcile_idx;
    `)
  },
}

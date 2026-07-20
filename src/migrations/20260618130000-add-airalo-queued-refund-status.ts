import { QueryInterface } from 'sequelize'

const REFUND_REQUEST_STATUS = 'refund_request_status'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      `ALTER TYPE ${REFUND_REQUEST_STATUS} ADD VALUE IF NOT EXISTS 'airalo_queued';`
    )
  },

  down: async (_queryInterface: QueryInterface): Promise<void> => {
    // PostgreSQL does not support removing enum values safely.
  },
}

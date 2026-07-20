import type { QueryInterface } from 'sequelize'
import { DataTypes } from 'sequelize'

import { columnExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      !(await columnExists(
        queryInterface,
        'esim_profiles',
        'data_allowance_mb'
      ))
    ) {
      await queryInterface.addColumn('esim_profiles', 'data_allowance_mb', {
        type: DataTypes.INTEGER,
        allowNull: true,
      })
    }

    await queryInterface.sequelize.query(`
      UPDATE esim_profiles ep
      SET data_allowance_mb = sub.total_mb
      FROM (
        SELECT
          ep2.id,
          p.data_mb + COALESCE((
            SELECT SUM(tp.data_mb)
            FROM renewals r
            JOIN orders o ON o.id = r.order_id
            JOIN plans tp ON tp.id = o.plan_id
            WHERE r.esim_profile_id = ep2.id
              AND r.renewal_type = 'topup'
              AND r.status = 'confirmed'
          ), 0) AS total_mb
        FROM esim_profiles ep2
        JOIN orders o ON o.id = ep2.order_id
        JOIN plans p ON p.id = o.plan_id
        WHERE ep2.data_allowance_mb IS NULL
      ) sub
      WHERE ep.id = sub.id
    `)
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      await columnExists(queryInterface, 'esim_profiles', 'data_allowance_mb')
    ) {
      await queryInterface.removeColumn('esim_profiles', 'data_allowance_mb')
    }
  },
}

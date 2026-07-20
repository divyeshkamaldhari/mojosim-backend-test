import type { QueryInterface } from 'sequelize'

import { columnExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      !(await columnExists(
        queryInterface,
        'plan_destinations',
        'country_flag_url'
      ))
    ) {
      await queryInterface.addColumn('plan_destinations', 'country_flag_url', {
        type: 'text',
        allowNull: true,
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      await columnExists(
        queryInterface,
        'plan_destinations',
        'country_flag_url'
      )
    ) {
      await queryInterface.removeColumn('plan_destinations', 'country_flag_url')
    }
  },
}

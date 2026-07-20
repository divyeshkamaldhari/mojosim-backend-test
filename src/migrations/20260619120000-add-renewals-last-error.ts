import type { QueryInterface } from 'sequelize'
import { DataTypes } from 'sequelize'

import { columnExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await columnExists(queryInterface, 'renewals', 'last_error'))) {
      await queryInterface.addColumn('renewals', 'last_error', {
        type: DataTypes.TEXT,
        allowNull: true,
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await columnExists(queryInterface, 'renewals', 'last_error')) {
      await queryInterface.removeColumn('renewals', 'last_error')
    }
  },
}

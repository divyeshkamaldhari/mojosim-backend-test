import type { QueryInterface } from 'sequelize'
import { DataTypes } from 'sequelize'

import { columnExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      !(await columnExists(queryInterface, 'usage_records', 'is_unlimited'))
    ) {
      await queryInterface.addColumn('usage_records', 'is_unlimited', {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      })
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (await columnExists(queryInterface, 'usage_records', 'is_unlimited')) {
      await queryInterface.removeColumn('usage_records', 'is_unlimited')
    }
  },
}

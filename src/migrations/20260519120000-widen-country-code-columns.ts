import type { QueryInterface } from 'sequelize'
import { DataTypes } from 'sequelize'

import { columnExists } from './migration-helpers'

const COUNTRY_CODE_TYPE = DataTypes.STRING(16)

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      await columnExists(queryInterface, 'plan_destinations', 'country_code')
    ) {
      await queryInterface.changeColumn('plan_destinations', 'country_code', {
        type: COUNTRY_CODE_TYPE,
        allowNull: false,
      })
    }

    if (
      await columnExists(queryInterface, 'destination_controls', 'country_code')
    ) {
      await queryInterface.changeColumn(
        'destination_controls',
        'country_code',
        {
          type: COUNTRY_CODE_TYPE,
          allowNull: false,
        }
      )
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      await columnExists(queryInterface, 'plan_destinations', 'country_code')
    ) {
      await queryInterface.changeColumn('plan_destinations', 'country_code', {
        type: DataTypes.CHAR(2),
        allowNull: false,
      })
    }

    if (
      await columnExists(queryInterface, 'destination_controls', 'country_code')
    ) {
      await queryInterface.changeColumn(
        'destination_controls',
        'country_code',
        {
          type: DataTypes.CHAR(2),
          allowNull: false,
        }
      )
    }
  },
}

import type { QueryInterface } from 'sequelize'
import { DataTypes } from 'sequelize'

import { columnExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      !(await columnExists(
        queryInterface,
        'esim_profiles',
        'direct_apple_installation_url'
      ))
    ) {
      await queryInterface.addColumn(
        'esim_profiles',
        'direct_apple_installation_url',
        {
          type: DataTypes.TEXT,
          allowNull: true,
        }
      )
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      await columnExists(
        queryInterface,
        'esim_profiles',
        'direct_apple_installation_url'
      )
    ) {
      await queryInterface.removeColumn(
        'esim_profiles',
        'direct_apple_installation_url'
      )
    }
  },
}

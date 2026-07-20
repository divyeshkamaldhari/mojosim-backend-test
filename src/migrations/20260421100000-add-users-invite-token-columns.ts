import { DataTypes, QueryInterface } from 'sequelize'

import {
  columnExists,
  createIndexIfNotExists,
  tableExists,
} from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'users'))) {
      return
    }

    if (!(await columnExists(queryInterface, 'users', 'invite_token_hash'))) {
      await queryInterface.addColumn('users', 'invite_token_hash', {
        type: DataTypes.STRING,
        allowNull: true,
      })
    }
    if (
      !(await columnExists(queryInterface, 'users', 'invite_token_expires_at'))
    ) {
      await queryInterface.addColumn('users', 'invite_token_expires_at', {
        type: DataTypes.DATE,
        allowNull: true,
      })
    }

    await createIndexIfNotExists(
      queryInterface,
      'users_invite_token_expires_at_idx',
      'users',
      ['invite_token_expires_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    if (
      await columnExists(queryInterface, 'users', 'invite_token_expires_at')
    ) {
      await queryInterface.removeColumn('users', 'invite_token_expires_at')
    }
    if (await columnExists(queryInterface, 'users', 'invite_token_hash')) {
      await queryInterface.removeColumn('users', 'invite_token_hash')
    }
  },
}

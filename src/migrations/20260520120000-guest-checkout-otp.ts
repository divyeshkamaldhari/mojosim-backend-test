import { DataTypes, QueryInterface } from 'sequelize'

import {
  columnExists,
  createIndexIfNotExists,
  createUniqueIndexIfNotExists,
  tableExists,
} from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE auth_method AS ENUM ('password', 'otp');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;
    `)

    if (!(await columnExists(queryInterface, 'carts', 'guest_token'))) {
      await queryInterface.addColumn('carts', 'guest_token', {
        type: DataTypes.STRING(64),
        allowNull: true,
        unique: true,
      })
    }

    await createUniqueIndexIfNotExists(
      queryInterface,
      'carts_guest_token_idx',
      'carts',
      ['guest_token']
    )

    if (!(await columnExists(queryInterface, 'users', 'auth_method'))) {
      await queryInterface.addColumn('users', 'auth_method', {
        type: 'auth_method',
        allowNull: false,
        defaultValue: 'password',
      })
    }

    await queryInterface.changeColumn('users', 'password_hash', {
      type: DataTypes.STRING,
      allowNull: true,
    })

    if (!(await tableExists(queryInterface, 'auth_otps'))) {
      await queryInterface.createTable('auth_otps', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        email: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        code_hash: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        purpose: {
          type: DataTypes.STRING(32),
          allowNull: false,
        },
        attempt_count: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        consumed_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      })
    }

    await createIndexIfNotExists(
      queryInterface,
      'auth_otps_email_purpose_expires_idx',
      'auth_otps',
      ['email', 'purpose', 'expires_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('auth_otps')

    if (await columnExists(queryInterface, 'users', 'auth_method')) {
      await queryInterface.removeColumn('users', 'auth_method')
    }

    if (await columnExists(queryInterface, 'carts', 'guest_token')) {
      await queryInterface.removeColumn('carts', 'guest_token')
    }

    await queryInterface.changeColumn('users', 'password_hash', {
      type: DataTypes.STRING,
      allowNull: false,
    })

    await queryInterface.sequelize.query('DROP TYPE IF EXISTS auth_method;')
  },
}

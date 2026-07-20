import type { QueryInterface } from 'sequelize'
import { DataTypes } from 'sequelize'

import { columnExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (await columnExists(queryInterface, 'esim_profiles', 'iccid')) {
      await queryInterface.changeColumn('esim_profiles', 'iccid', {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      })
    }

    if (await columnExists(queryInterface, 'esim_profiles', 'qr_payload_enc')) {
      await queryInterface.changeColumn('esim_profiles', 'qr_payload_enc', {
        type: DataTypes.TEXT,
        allowNull: true,
      })
    }

    if (
      await columnExists(
        queryInterface,
        'esim_profiles',
        'install_instructions'
      )
    ) {
      await queryInterface.changeColumn(
        'esim_profiles',
        'install_instructions',
        {
          type: DataTypes.TEXT,
          allowNull: true,
        }
      )
    }
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // Placeholders with null provider fields must be removed before restoring NOT NULL.
    await queryInterface.sequelize.query(`
      DELETE FROM esim_profiles
      WHERE iccid IS NULL
         OR qr_payload_enc IS NULL
         OR install_instructions IS NULL
    `)

    if (await columnExists(queryInterface, 'esim_profiles', 'iccid')) {
      await queryInterface.changeColumn('esim_profiles', 'iccid', {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      })
    }

    if (await columnExists(queryInterface, 'esim_profiles', 'qr_payload_enc')) {
      await queryInterface.changeColumn('esim_profiles', 'qr_payload_enc', {
        type: DataTypes.TEXT,
        allowNull: false,
      })
    }

    if (
      await columnExists(
        queryInterface,
        'esim_profiles',
        'install_instructions'
      )
    ) {
      await queryInterface.changeColumn(
        'esim_profiles',
        'install_instructions',
        {
          type: DataTypes.TEXT,
          allowNull: false,
        }
      )
    }
  },
}

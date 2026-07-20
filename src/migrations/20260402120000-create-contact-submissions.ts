import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'contact_submissions'))) {
      await queryInterface.createTable('contact_submissions', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        full_name: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING(25),
          allowNull: true,
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      })
    }

    await createIndexIfNotExists(
      queryInterface,
      'contact_submissions_is_read_idx',
      'contact_submissions',
      ['is_read']
    )
    await createIndexIfNotExists(
      queryInterface,
      'contact_submissions_created_at_idx',
      'contact_submissions',
      ['created_at']
    )
    await createIndexIfNotExists(
      queryInterface,
      'contact_submissions_email_idx',
      'contact_submissions',
      ['email']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('contact_submissions')
  },
}

import { DataTypes, QueryInterface } from 'sequelize'

import {
  createIndexIfNotExists,
  createUniqueIndexIfNotExists,
  tableExists,
} from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    if (!(await tableExists(queryInterface, 'invoices'))) {
      await queryInterface.createTable('invoices', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          unique: true,
          references: { model: 'orders', key: 'id' },
          onDelete: 'RESTRICT',
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'RESTRICT',
        },
        invoice_number: {
          type: DataTypes.STRING,
          allowNull: false,
          unique: true,
        },
        subtotal: {
          type: DataTypes.DECIMAL(20, 2),
          allowNull: false,
        },
        tax_amount: {
          type: DataTypes.DECIMAL(20, 2),
          allowNull: false,
        },
        total_amount: {
          type: DataTypes.DECIMAL(20, 2),
          allowNull: false,
        },
        currency: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        pdf_url: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        issued_at: {
          type: DataTypes.DATE,
          allowNull: false,
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

    await createUniqueIndexIfNotExists(
      queryInterface,
      'invoices_order_id_unique_idx',
      'invoices',
      ['order_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'invoices_user_id_idx',
      'invoices',
      ['user_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'invoices_issued_at_idx',
      'invoices',
      ['issued_at']
    )
    await createIndexIfNotExists(
      queryInterface,
      'invoices_created_at_idx',
      'invoices',
      ['created_at']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.dropTable('invoices')
  },
}

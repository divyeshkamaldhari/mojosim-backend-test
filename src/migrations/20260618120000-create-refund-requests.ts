import { DataTypes, QueryInterface } from 'sequelize'

import { createIndexIfNotExists, tableExists } from './migration-helpers'

const REFUND_REQUEST_STATUS = 'refund_request_status'
const REFUND_FLOW_TYPE = 'refund_flow_type'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      `DO $$ BEGIN
        CREATE TYPE ${REFUND_REQUEST_STATUS} AS ENUM (
          'airalo_pending',
          'airalo_approved',
          'airalo_rejected',
          'stripe_refunded',
          'cancelled'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;`
    )

    await queryInterface.sequelize.query(
      `DO $$ BEGIN
        CREATE TYPE ${REFUND_FLOW_TYPE} AS ENUM (
          'airalo_then_stripe',
          'stripe_only'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END $$;`
    )

    if (!(await tableExists(queryInterface, 'refund_requests'))) {
      await queryInterface.createTable('refund_requests', {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'orders', key: 'id' },
          onDelete: 'RESTRICT',
        },
        status: {
          type: REFUND_REQUEST_STATUS,
          allowNull: false,
        },
        flow_type: {
          type: REFUND_FLOW_TYPE,
          allowNull: false,
        },
        airalo_refund_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        airalo_reason: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        airalo_notes: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        stripe_refund_id: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        internal_notes: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        requested_by: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: { model: 'users', key: 'id' },
          onDelete: 'RESTRICT',
        },
        airalo_approved_by: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
        },
        stripe_processed_by: {
          type: DataTypes.INTEGER,
          allowNull: true,
          references: { model: 'users', key: 'id' },
          onDelete: 'SET NULL',
        },
        requested_at: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        airalo_approved_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        stripe_refunded_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        metadata: {
          type: DataTypes.JSONB,
          allowNull: true,
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
      'refund_requests_order_id_idx',
      'refund_requests',
      ['order_id']
    )
    await createIndexIfNotExists(
      queryInterface,
      'refund_requests_status_idx',
      'refund_requests',
      ['status']
    )

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS refund_requests_one_active_per_order_idx
       ON refund_requests (order_id)
       WHERE status NOT IN ('stripe_refunded', 'cancelled', 'airalo_rejected');`
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS refund_requests_one_active_per_order_idx;'
    )
    await queryInterface.dropTable('refund_requests')
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS ${REFUND_FLOW_TYPE};`
    )
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS ${REFUND_REQUEST_STATUS};`
    )
  },
}

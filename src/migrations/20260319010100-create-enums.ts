import { QueryInterface } from 'sequelize'

const SAFE_IDENTIFIER_RE = /^[a-z_][a-z0-9_]*$/

const assertSafeIdentifier = (value: string, kind: string): string => {
  if (!SAFE_IDENTIFIER_RE.test(value)) {
    throw new Error(`Unsafe ${kind} identifier: ${value}`)
  }
  return value
}

const escapeLiteral = (value: string): string =>
  `'${value.replaceAll("'", "''")}'`

const toEnumValuesSql = (values: readonly string[]): string =>
  values.map((value) => escapeLiteral(value)).join(', ')

const createEnumIfNotExists = async (
  queryInterface: QueryInterface,
  name: string,
  values: readonly string[]
): Promise<void> => {
  const safeName = assertSafeIdentifier(name, 'enum')
  const valuesSql = toEnumValuesSql(values)
  // NOSONAR: enum name/literals are validated/escaped before interpolation.
  await queryInterface.sequelize.query(
    `DO $$ BEGIN
      CREATE TYPE ${safeName} AS ENUM (${valuesSql});
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;`
  )
}

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await createEnumIfNotExists(queryInterface, 'user_role', [
      'customer',
      'manager',
      'admin',
    ])
    await createEnumIfNotExists(queryInterface, 'cart_status', [
      'active',
      'converted',
      'abandoned',
    ])
    await createEnumIfNotExists(queryInterface, 'order_type', [
      'new',
      'renewal',
      'topup',
    ])
    await createEnumIfNotExists(queryInterface, 'order_status', [
      'pending',
      'confirmed',
      'failed',
      'refunded',
      'cancelled',
    ])
    await createEnumIfNotExists(queryInterface, 'payment_status', [
      'pending',
      'paid',
      'failed',
      'refunded',
    ])
    await createEnumIfNotExists(queryInterface, 'esim_state', [
      'created',
      'assigned',
      'activated',
      'suspended',
      'expired',
      'deactivated',
    ])
    await createEnumIfNotExists(queryInterface, 'job_status', [
      'queued',
      'processing',
      'success',
      'failed',
      'dead',
    ])
    await createEnumIfNotExists(queryInterface, 'renewal_type', [
      'renewal',
      'topup',
    ])
    await createEnumIfNotExists(queryInterface, 'renewal_status', [
      'pending',
      'confirmed',
      'failed',
    ])
    await createEnumIfNotExists(queryInterface, 'notif_channel', [
      'email',
      'in_app',
      'sms',
    ])
    await createEnumIfNotExists(queryInterface, 'ticket_status', [
      'open',
      'in_progress',
      'resolved',
      'closed',
    ])
    await createEnumIfNotExists(queryInterface, 'ticket_priority', [
      'low',
      'normal',
      'high',
      'urgent',
    ])
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    // NOSONAR: static SQL statements with fixed enum identifiers.
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS ticket_priority;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS ticket_status;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS notif_channel;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS renewal_status;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS renewal_type;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS job_status;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS esim_state;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS payment_status;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS order_status;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS order_type;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS cart_status;`)
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS user_role;`)
  },
}

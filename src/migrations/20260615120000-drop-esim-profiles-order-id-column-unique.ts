import { QueryInterface } from 'sequelize'

import { createIndexIfNotExists } from './migration-helpers'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      `ALTER TABLE "esim_profiles" DROP CONSTRAINT IF EXISTS "esim_profiles_order_id_key";`
    )
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "esim_profiles_order_id_unique_idx";`
    )
    await createIndexIfNotExists(
      queryInterface,
      'esim_profiles_order_id_idx',
      'esim_profiles',
      ['order_id']
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      `DROP INDEX IF EXISTS "esim_profiles_order_id_idx";`
    )
    await queryInterface.sequelize.query(
      `ALTER TABLE "esim_profiles" ADD CONSTRAINT "esim_profiles_order_id_key" UNIQUE ("order_id");`
    )
  },
}

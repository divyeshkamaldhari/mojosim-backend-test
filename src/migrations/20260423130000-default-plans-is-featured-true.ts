import type { QueryInterface } from 'sequelize'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      ALTER TABLE plans
      ALTER COLUMN is_featured SET DEFAULT true;
    `)
    await queryInterface.sequelize.query(`
      UPDATE plans
      SET is_featured = false
      WHERE is_active = false AND is_featured = true;
    `)
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(`
      ALTER TABLE plans
      ALTER COLUMN is_featured SET DEFAULT false;
    `)
  },
}

import { QueryInterface } from 'sequelize'

export default {
  up: async (queryInterface: QueryInterface): Promise<void> => {
    // Set DB defaults so locale/currency can be omitted in requests.
    await queryInterface.sequelize.query(
      "ALTER TABLE users ALTER COLUMN locale SET DEFAULT 'en'"
    )
    await queryInterface.sequelize.query(
      "ALTER TABLE users ALTER COLUMN currency SET DEFAULT 'USD'"
    )
  },

  down: async (queryInterface: QueryInterface): Promise<void> => {
    await queryInterface.sequelize.query(
      'ALTER TABLE users ALTER COLUMN locale DROP DEFAULT'
    )
    await queryInterface.sequelize.query(
      'ALTER TABLE users ALTER COLUMN currency DROP DEFAULT'
    )
  },
}

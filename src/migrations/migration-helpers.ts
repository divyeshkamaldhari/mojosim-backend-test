import type { QueryInterface } from 'sequelize'

const SAFE_IDENTIFIER_RE = /^[a-z_][a-z0-9_]*$/i

const assertSafeIdentifier = (value: string, kind: string): string => {
  if (!SAFE_IDENTIFIER_RE.test(value)) {
    throw new Error(`Unsafe ${kind} identifier: ${value}`)
  }
  return value
}

const quoteIdentifier = (value: string): string =>
  `"${assertSafeIdentifier(value, 'sql').replaceAll('"', '""')}"`

export async function columnExists(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     LIMIT 1`,
    { bind: [tableName, columnName] }
  )
  return Array.isArray(rows) && rows.length > 0
}

export async function tableExists(
  queryInterface: QueryInterface,
  tableName: string
): Promise<boolean> {
  const tables = await queryInterface.showAllTables()
  const lower = tableName.toLowerCase()
  return tables.some((t) => t.toLowerCase() === lower)
}

export async function createIndexIfNotExists(
  queryInterface: QueryInterface,
  indexName: string,
  tableName: string,
  columnNames: string[]
): Promise<void> {
  const safeIndexName = quoteIdentifier(indexName)
  const safeTableName = quoteIdentifier(tableName)
  const cols = columnNames.map((c) => quoteIdentifier(c)).join(', ')
  // NOSONAR: all interpolated identifiers are allow-listed and quoted.
  await queryInterface.sequelize.query(
    `CREATE INDEX IF NOT EXISTS ${safeIndexName} ON ${safeTableName} (${cols});`
  )
}

export async function createUniqueIndexIfNotExists(
  queryInterface: QueryInterface,
  indexName: string,
  tableName: string,
  columnNames: string[]
): Promise<void> {
  const safeIndexName = quoteIdentifier(indexName)
  const safeTableName = quoteIdentifier(tableName)
  const cols = columnNames.map((c) => quoteIdentifier(c)).join(', ')
  // NOSONAR: all interpolated identifiers are allow-listed and quoted.
  await queryInterface.sequelize.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS ${safeIndexName} ON ${safeTableName} (${cols});`
  )
}

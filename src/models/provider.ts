import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript'

@Table({
  tableName: 'providers',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Provider extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.STRING, allowNull: false, field: 'name' })
  declare name: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    field: 'slug',
  })
  declare slug: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'api_base_url' })
  declare apiBaseUrl: string

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'api_credentials_enc',
  })
  declare apiCredentialsEnc: string

  /** Set only on SELECTs that add this computed attribute (never persisted). */
  declare apiCredentialsConfigured?: boolean

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  declare isActive: boolean

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'priority',
  })
  declare priority: number

  @Column({ type: DataType.JSONB, allowNull: false, field: 'capabilities' })
  declare capabilities: unknown

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: '20.00',
    field: 'margin_percent',
  })
  declare marginPercent: string

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

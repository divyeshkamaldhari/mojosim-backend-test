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
  tableName: 'compatible_devices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class CompatibleDevice extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'provider_id' })
  declare providerId: number

  @Column({ type: DataType.STRING, allowNull: false })
  declare os: string

  @Column({ type: DataType.STRING, allowNull: false })
  declare brand: string

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  declare isActive: boolean

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'synced_at',
  })
  declare syncedAt: Date

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

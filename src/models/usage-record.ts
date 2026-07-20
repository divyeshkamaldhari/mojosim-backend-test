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
  tableName: 'usage_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class UsageRecord extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'esim_profile_id',
  })
  declare esimProfileId: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'data_used_mb' })
  declare dataUsedMb: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'data_remaining_mb',
  })
  declare dataRemainingMb: number

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_unlimited',
  })
  declare isUnlimited: boolean

  @Column({ type: DataType.STRING, allowNull: false })
  declare source: string

  @Column({ type: DataType.DATE, allowNull: false, field: 'recorded_at' })
  declare recordedAt: Date

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

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
  tableName: 'plan_destinations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class PlanDestination extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'plan_id' })
  declare planId: number

  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    field: 'country_code',
  })
  declare countryCode: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'country_name' })
  declare countryName: string

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'country_flag_url',
  })
  declare countryFlagUrl: string | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

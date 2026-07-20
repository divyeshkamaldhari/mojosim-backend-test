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
  tableName: 'destination_controls',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class DestinationControl extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({
    type: DataType.STRING(16),
    allowNull: false,
    unique: true,
    field: 'country_code',
  })
  declare countryCode: string

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'country_name',
  })
  declare countryName: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'is_active',
    defaultValue: true,
  })
  declare isActive: boolean

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

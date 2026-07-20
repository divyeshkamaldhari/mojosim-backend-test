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
  tableName: 'plan_translations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class PlanTranslation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'plan_id' })
  declare planId: number

  @Column({ type: DataType.STRING, allowNull: false })
  declare locale: string

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

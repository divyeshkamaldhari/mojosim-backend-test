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
  tableName: 'cart_items',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class CartItem extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'cart_id' })
  declare cartId: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'plan_id' })
  declare planId: number

  @Column({ type: DataType.INTEGER, allowNull: false, defaultValue: 1 })
  declare quantity: number

  @Column({
    type: DataType.DECIMAL(20, 2),
    allowNull: false,
    field: 'unit_price',
  })
  declare unitPrice: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'currency' })
  declare currency: string

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

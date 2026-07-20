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
  tableName: 'carts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Cart extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'user_id' })
  declare userId: number | null

  @Column({
    type: DataType.STRING(64),
    allowNull: true,
    unique: true,
    field: 'guest_token',
  })
  declare guestToken: string | null

  @Column({
    type: 'cart_status',
    allowNull: false,
  })
  declare status: 'active' | 'converted' | 'abandoned'

  @Column({ type: DataType.DATE, allowNull: false, field: 'expires_at' })
  declare expiresAt: Date

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

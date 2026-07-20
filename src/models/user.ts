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
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare email: string

  @Column({ type: DataType.STRING, allowNull: true, field: 'password_hash' })
  declare passwordHash: string | null

  @Column({
    type: 'auth_method',
    allowNull: false,
    defaultValue: 'password',
    field: 'auth_method',
  })
  declare authMethod: 'password' | 'otp'

  @Column({ type: DataType.STRING, allowNull: false, field: 'first_name' })
  declare firstName: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'last_name' })
  declare lastName: string

  @Column({ type: DataType.STRING, allowNull: true, field: 'avatar_url' })
  declare avatarUrl: string | null

  @Column({ type: DataType.STRING, allowNull: true })
  declare phone: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'stripe_customer_id',
  })
  declare stripeCustomerId: string | null

  @Column({ type: DataType.STRING, allowNull: false })
  declare locale: string

  @Column({ type: DataType.STRING, allowNull: false })
  declare currency: string

  @Column({
    type: 'user_role',
    allowNull: false,
  })
  declare role: 'customer' | 'manager' | 'admin'

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  declare isActive: boolean

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'email_verified',
  })
  declare emailVerified: boolean

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'invite_token_hash',
  })
  declare inviteTokenHash: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'invite_token_expires_at',
  })
  declare inviteTokenExpiresAt: Date | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

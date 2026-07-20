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
  tableName: 'user_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class UserSession extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  declare userId: number

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    field: 'token_hash',
  })
  declare tokenHash: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'ip_address' })
  declare ipAddress: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'user_agent' })
  declare userAgent: string

  @Column({ type: DataType.DATE, allowNull: false, field: 'expires_at' })
  declare expiresAt: Date

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

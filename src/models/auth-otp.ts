import {
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript'

@Table({
  tableName: 'auth_otps',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
})
export class AuthOtp extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.STRING, allowNull: false })
  declare email: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'code_hash' })
  declare codeHash: string

  @Column({ type: DataType.STRING(32), allowNull: false })
  declare purpose: string

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'attempt_count',
  })
  declare attemptCount: number

  @Column({ type: DataType.DATE, allowNull: false, field: 'expires_at' })
  declare expiresAt: Date

  @Column({ type: DataType.DATE, allowNull: true, field: 'consumed_at' })
  declare consumedAt: Date | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date
}

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
  tableName: 'provisioning_jobs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ProvisioningJob extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'order_id' })
  declare orderId: number

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'esim_profile_id' })
  declare esimProfileId: number | null

  @Column({
    type: 'job_status',
    allowNull: false,
    field: 'status',
  })
  declare status: 'queued' | 'processing' | 'success' | 'failed' | 'dead'

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'attempt_count',
  })
  declare attemptCount: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 5,
    field: 'max_attempts',
  })
  declare maxAttempts: number

  @Column({ type: DataType.TEXT, allowNull: true, field: 'last_error' })
  declare lastError: string | null

  @Column({ type: DataType.JSONB, allowNull: false, field: 'provider_request' })
  declare providerRequest: unknown

  @Column({ type: DataType.JSONB, allowNull: true, field: 'provider_response' })
  declare providerResponse: Record<string, unknown> | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'next_retry_at' })
  declare nextRetryAt: Date | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'completed_at' })
  declare completedAt: Date | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

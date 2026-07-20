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
  tableName: 'webhook_events',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class WebhookEvent extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.STRING, allowNull: false })
  declare source: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'event_type' })
  declare eventType: string

  @Column({ type: DataType.JSONB, allowNull: false })
  declare payload: unknown

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare processed: boolean

  @Column({ type: DataType.TEXT, allowNull: true, field: 'processing_error' })
  declare processingError: string | null

  @Column({ type: DataType.DATE, allowNull: false, field: 'received_at' })
  declare receivedAt: Date

  @Column({ type: DataType.DATE, allowNull: true, field: 'processed_at' })
  declare processedAt: Date | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

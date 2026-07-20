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
  tableName: 'audit_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class AuditLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'actor_id' })
  declare actorId: number | null

  @Column({ type: DataType.STRING, allowNull: false })
  declare action: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'entity_type' })
  declare entityType: string

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'entity_id' })
  declare entityId: number

  @Column({ type: DataType.JSONB, allowNull: true, field: 'before_state' })
  declare beforeState: Record<string, unknown> | null

  @Column({ type: DataType.JSONB, allowNull: true, field: 'after_state' })
  declare afterState: Record<string, unknown> | null

  @Column({ type: DataType.STRING, allowNull: true, field: 'ip_address' })
  declare ipAddress: string | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

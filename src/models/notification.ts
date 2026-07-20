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
  tableName: 'notifications',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Notification extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  declare userId: number

  @Column({
    type: 'notif_channel',
    allowNull: false,
    field: 'channel',
  })
  declare channel: 'email' | 'in_app' | 'sms'

  @Column({ type: DataType.STRING, allowNull: false, field: 'type' })
  declare type: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'subject' })
  declare subject: string

  @Column({ type: DataType.TEXT, allowNull: false, field: 'body' })
  declare body: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read',
  })
  declare isRead: boolean

  @Column({ type: DataType.JSONB, allowNull: true, field: 'meta' })
  declare meta: Record<string, unknown> | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'sent_at' })
  declare sentAt: Date | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

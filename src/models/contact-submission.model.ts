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
  tableName: 'contact_submissions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ContactSubmission extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'full_name' })
  declare fullName: string

  @Column({ type: DataType.STRING(255), allowNull: false, field: 'email' })
  declare email: string

  @Column({ type: DataType.STRING(25), allowNull: true, field: 'phone' })
  declare phone: string | null

  @Column({ type: DataType.TEXT, allowNull: false, field: 'message' })
  declare message: string

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_read',
  })
  declare isRead: boolean

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

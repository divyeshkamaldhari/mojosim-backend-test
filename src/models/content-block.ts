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
  tableName: 'content_blocks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ContentBlock extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.STRING, allowNull: false, field: 'key' })
  declare key: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'locale' })
  declare locale: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'type' })
  declare type: string

  @Column({ type: DataType.JSONB, allowNull: false, field: 'value' })
  declare value: unknown

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_published',
  })
  declare isPublished: boolean

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'updated_by' })
  declare updatedBy: number | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

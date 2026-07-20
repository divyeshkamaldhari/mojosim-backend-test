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
  tableName: 'invoices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Invoice extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
    field: 'order_id',
  })
  declare orderId: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  declare userId: number

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    field: 'invoice_number',
  })
  declare invoiceNumber: string

  @Column({
    type: DataType.DECIMAL(20, 2),
    allowNull: false,
    field: 'subtotal',
  })
  declare subtotal: string

  @Column({
    type: DataType.DECIMAL(20, 2),
    allowNull: false,
    field: 'tax_amount',
  })
  declare taxAmount: string

  @Column({
    type: DataType.DECIMAL(20, 2),
    allowNull: false,
    field: 'total_amount',
  })
  declare totalAmount: string

  @Column({ type: DataType.STRING, allowNull: false })
  declare currency: string

  @Column({ type: DataType.STRING, allowNull: true, field: 'pdf_url' })
  declare pdfUrl: string | null

  @Column({ type: DataType.DATE, allowNull: false, field: 'issued_at' })
  declare issuedAt: Date

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

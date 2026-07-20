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
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Order extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'user_id' })
  declare userId: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'plan_id' })
  declare planId: number

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'cart_id' })
  declare cartId: number | null

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    field: 'idempotency_key',
  })
  declare idempotencyKey: string

  @Column({
    type: 'order_type',
    allowNull: false,
    field: 'order_type',
  })
  declare orderType: 'new' | 'renewal' | 'topup'

  @Column({
    type: 'order_status',
    allowNull: false,
  })
  declare status: 'pending' | 'confirmed' | 'failed' | 'refunded' | 'cancelled'

  @Column({ type: DataType.DECIMAL(20, 2), allowNull: false })
  declare amount: string

  @Column({ type: DataType.STRING, allowNull: false })
  declare currency: string

  @Column({ type: DataType.STRING, allowNull: false, field: 'payment_gateway' })
  declare paymentGateway: string

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'payment_method_type',
  })
  declare paymentMethodType: string | null

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'payment_method_brand',
  })
  declare paymentMethodBrand: string | null

  @Column({ type: DataType.STRING, allowNull: true, field: 'payment_ref' })
  declare paymentRef: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'stripe_checkout_session_id',
  })
  declare stripeCheckoutSessionId: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'stripe_checkout_url',
  })
  declare stripeCheckoutUrl: string | null

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'checkout_expires_at',
  })
  declare checkoutExpiresAt: Date | null

  @Column({ type: DataType.STRING, allowNull: true, field: 'stripe_charge_id' })
  declare stripeChargeId: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'stripe_receipt_url' })
  declare stripeReceiptUrl: string | null

  @Column({
    type: 'payment_status',
    allowNull: false,
    field: 'payment_status',
  })
  declare paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'

  @Column({ type: DataType.JSONB, allowNull: false, field: 'billing_snapshot' })
  declare billingSnapshot: unknown

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

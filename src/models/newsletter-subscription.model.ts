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

export type NewsletterSubscriptionStatus = 'active' | 'used' | 'expired'

@Table({
  tableName: 'newsletter_subscriptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class NewsletterSubscription extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.STRING(255), allowNull: false, unique: true })
  declare email: string

  @Column({
    type: DataType.STRING(32),
    allowNull: false,
    unique: true,
    field: 'promo_code',
  })
  declare promoCode: string

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: '10.00',
    field: 'discount_percent',
  })
  declare discountPercent: string

  @Column({
    type: 'newsletter_subscription_status',
    allowNull: false,
    defaultValue: 'active',
  })
  declare status: NewsletterSubscriptionStatus

  @Column({ type: DataType.DATE, allowNull: false, field: 'expires_at' })
  declare expiresAt: Date

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'terms_accepted_at',
  })
  declare termsAcceptedAt: Date

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'used_order_id',
  })
  declare usedOrderId: number | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'used_at' })
  declare usedAt: Date | null

  @Column({
    type: DataType.DATE,
    allowNull: false,
    field: 'subscribed_at',
  })
  declare subscribedAt: Date

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

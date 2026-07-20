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
import type { ProviderCoverage } from '../modules/providers/provider.interface'

@Table({
  tableName: 'plans',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class Plan extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'provider_id' })
  declare providerId: number

  @Column({ type: DataType.STRING, allowNull: false, field: 'provider_sku' })
  declare providerSku: string

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string

  @Column({ type: DataType.TEXT, allowNull: false })
  declare description: string

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'data_mb' })
  declare dataMb: number

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: 'data_label',
  })
  declare dataLabel: string | null

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'validity_days' })
  declare validityDays: number

  @Column({ type: DataType.STRING, allowNull: false })
  declare currency: string

  @Column({
    type: DataType.DECIMAL(20, 2),
    allowNull: false,
  })
  declare price: string

  @Column({
    type: DataType.DECIMAL(20, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'net_price',
  })
  declare netPrice: string

  @Column({
    type: DataType.DECIMAL(5, 2),
    allowNull: true,
    field: 'custom_margin_percent',
  })
  declare customMarginPercent: string | null

  @Column({
    type: DataType.DECIMAL(20, 2),
    allowNull: true,
    field: 'selling_price',
  })
  declare sellingPrice: string | null

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  declare isActive: boolean

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_featured',
  })
  declare isFeatured: boolean

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'local',
    field: 'plan_type',
  })
  declare planType: string

  @Column({ type: DataType.STRING(500), allowNull: true, field: 'flag_url' })
  declare flagUrl: string | null

  @Column({ type: DataType.STRING(255), allowNull: true, field: 'region_name' })
  declare regionName: string | null

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
    defaultValue: 'other',
    field: 'airalo_package_type',
  })
  declare airaloPackageType: string

  @Column({ type: DataType.JSONB, allowNull: true })
  declare metadata: unknown

  @Column({ type: DataType.JSONB, allowNull: true, field: 'coverage' })
  declare coverage: ProviderCoverage[] | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'synced_at' })
  declare syncedAt: Date | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

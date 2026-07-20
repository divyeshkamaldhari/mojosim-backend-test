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
  tableName: 'esim_profiles',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class EsimProfile extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'order_id' })
  declare orderId: number

  @Column({ type: DataType.INTEGER, allowNull: false, field: 'provider_id' })
  declare providerId: number

  @Column({ type: DataType.STRING, allowNull: true, unique: true })
  declare iccid: string | null

  @Column({ type: DataType.STRING, allowNull: true })
  declare ean: string | null

  @Column({ type: DataType.TEXT, allowNull: true, field: 'qr_payload_enc' })
  declare qrPayloadEnc: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'install_instructions',
  })
  declare installInstructions: string | null

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    field: 'direct_apple_installation_url',
  })
  declare directAppleInstallationUrl: string | null

  @Column({
    type: 'esim_state',
    allowNull: false,
    field: 'lifecycle_state',
  })
  declare lifecycleState:
    | 'created'
    | 'assigned'
    | 'activated'
    | 'suspended'
    | 'expired'
    | 'deactivated'

  @Column({ type: DataType.DATE, allowNull: true, field: 'activated_at' })
  declare activatedAt: Date | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'expires_at' })
  declare expiresAt: Date | null

  @Column({ type: DataType.DATE, allowNull: true, field: 'last_synced_at' })
  declare lastSyncedAt: Date | null

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: 'data_allowance_mb',
  })
  declare dataAllowanceMb: number | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

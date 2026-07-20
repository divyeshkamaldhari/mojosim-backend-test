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
  tableName: 'profile_status_history',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})
export class ProfileStatusHistory extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'esim_profile_id',
  })
  declare esimProfileId: number

  @Column({
    type: 'esim_state',
    allowNull: true,
    field: 'from_state',
  })
  declare fromState:
    | 'created'
    | 'assigned'
    | 'activated'
    | 'suspended'
    | 'expired'
    | 'deactivated'
    | null

  @Column({
    type: 'esim_state',
    allowNull: false,
    field: 'to_state',
  })
  declare toState:
    | 'created'
    | 'assigned'
    | 'activated'
    | 'suspended'
    | 'expired'
    | 'deactivated'

  @Column({ type: DataType.STRING, allowNull: false })
  declare source: string

  @Column({ type: DataType.TEXT, allowNull: false })
  declare reason: string

  @Column({ type: DataType.INTEGER, allowNull: true, field: 'actor_id' })
  declare actorId: number | null

  @CreatedAt
  @Column({ type: DataType.DATE, field: 'created_at' })
  declare createdAt: Date

  @UpdatedAt
  @Column({ type: DataType.DATE, field: 'updated_at' })
  declare updatedAt: Date
}

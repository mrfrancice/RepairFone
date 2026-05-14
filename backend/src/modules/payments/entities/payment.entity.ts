import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { RepairerProfile } from '../../users/entities/repairer-profile.entity';
import { RepairRequest } from '../../requests/entities/repair-request.entity';

export enum PaymentMethod {
  ORANGE_MONEY = 'orange_money',
  MTN_MONEY = 'mtn_money',
  WAVE = 'wave',
  CARD = 'card',
  CASH = 'cash',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  BLOCKED = 'blocked',
  CANCELLED = 'cancelled',
}

export enum PaymentType {
  DEPOSIT = 'deposit',
  BALANCE = 'balance',
  FULL = 'full',
  REFUND = 'refund',
}

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ name: 'payment_number', type: 'varchar', length: 30, unique: true })
  @Index()
  paymentNumber: string;

  @ManyToOne(() => RepairRequest)
  @JoinColumn({ name: 'request_id' })
  request: RepairRequest;

  @Column({ name: 'request_id', type: 'uuid' })
  @Index()
  requestId: string;

  @Column({ name: 'quote_id', type: 'uuid' })
  quoteId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'client_id', type: 'uuid' })
  @Index()
  clientId: string;

  @ManyToOne(() => RepairerProfile)
  @JoinColumn({ name: 'repairer_id' })
  repairer: RepairerProfile;

  @Column({ name: 'repairer_id', type: 'uuid' })
  @Index()
  repairerId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'platform_fee', type: 'decimal', precision: 10, scale: 2 })
  platformFee: number;

  @Column({
    name: 'platform_fee_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 5,
  })
  platformFeePercent: number;

  @Column({ name: 'repairer_amount', type: 'decimal', precision: 10, scale: 2 })
  repairerAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  currency: string;

  @Column({
    name: 'payment_type',
    type: 'enum',
    enum: PaymentType,
    default: PaymentType.FULL,
  })
  paymentType: PaymentType;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod?: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  @Index()
  status: PaymentStatus;

  @Column({ name: 'phone_number', type: 'varchar', length: 20, nullable: true })
  phoneNumber?: string;

  @Column({
    name: 'transaction_ref',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  @Index()
  transactionRef?: string;

  @Column({
    name: 'external_ref',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  externalRef?: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true })
  failedAt?: Date;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;

  @Column({ name: 'refunded_at', type: 'timestamptz', nullable: true })
  refundedAt?: Date;

  @Column({ name: 'refund_reason', type: 'text', nullable: true })
  refundReason?: string;

  @Column({ name: 'blocked_at', type: 'timestamptz', nullable: true })
  blockedAt?: Date;

  @Column({ name: 'block_reason', type: 'text', nullable: true })
  blockReason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;
}

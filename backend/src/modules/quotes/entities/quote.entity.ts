import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RepairerProfile } from '../../users/entities/repairer-profile.entity';
import { RepairRequest } from '../../requests/entities/repair-request.entity';

export enum QuoteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export interface QuotePart {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

@Entity('quotes')
export class Quote extends BaseEntity {
  @ManyToOne(() => RepairRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: RepairRequest;

  @Column({ name: 'request_id', type: 'uuid' })
  @Index()
  requestId: string;

  @ManyToOne(() => RepairerProfile)
  @JoinColumn({ name: 'repairer_id' })
  repairer: RepairerProfile;

  @Column({ name: 'repairer_id', type: 'uuid' })
  @Index()
  repairerId: string;

  @Column({ name: 'labor_cost', type: 'decimal', precision: 10, scale: 2 })
  laborCost: number;

  @Column({
    name: 'parts_cost',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  partsCost: number;

  @Column({
    name: 'urgency_supplement',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  urgencySupplement: number;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  currency: string;

  @Column({ name: 'estimated_duration', type: 'varchar', length: 100 })
  estimatedDuration: string;

  @Column({ type: 'jsonb', default: [] })
  parts: QuotePart[];

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({
    type: 'enum',
    enum: QuoteStatus,
    default: QuoteStatus.PENDING,
  })
  @Index()
  status: QuoteStatus;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt?: Date;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({
    name: 'client_proposed_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  clientProposedPrice?: number;
}

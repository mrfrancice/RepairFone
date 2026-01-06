import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { RepairerProfile } from '../../users/entities/repairer-profile.entity';
import { RepairRequest } from '../../requests/entities/repair-request.entity';

export enum DisputeReason {
  NON_CONFORMING_REPAIR = 'non_conforming_repair',
  DELAY = 'delay',
  PRICE_NOT_RESPECTED = 'price_not_respected',
  DAMAGE = 'damage',
  POOR_QUALITY = 'poor_quality',
  COMMUNICATION = 'communication',
  OTHER = 'other',
}

export enum DisputeStatus {
  OPEN = 'open',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

export enum DisputeResolution {
  REFUND_FULL = 'refund_full',
  REFUND_PARTIAL = 'refund_partial',
  REDO_REPAIR = 'redo_repair',
  NO_ACTION = 'no_action',
  OTHER = 'other',
}

@Entity('disputes')
export class Dispute extends BaseEntity {
  @ManyToOne(() => RepairRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: RepairRequest;

  @Column({ name: 'request_id', type: 'uuid' })
  @Index()
  requestId: string;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId?: string;

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

  @Column({
    type: 'enum',
    enum: DisputeReason,
  })
  reason: DisputeReason;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'evidence_photos', type: 'jsonb', default: [] })
  evidencePhotos: string[];

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  @Index()
  status: DisputeStatus;

  @Column({
    type: 'enum',
    enum: DisputeResolution,
    nullable: true,
  })
  resolution?: DisputeResolution;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes?: string;

  @Column({ name: 'refund_amount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  refundAmount?: number;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'resolved_by', type: 'uuid', nullable: true })
  resolvedBy?: string;

  @OneToMany('DisputeMessage', 'dispute')
  messages: any[];
}

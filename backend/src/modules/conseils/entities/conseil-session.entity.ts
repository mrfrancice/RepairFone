import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Expert, ConseilType, ConseilFormat } from './expert.entity';

export enum ConseilSessionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
}

@Entity('conseil_sessions')
export class ConseilSession extends BaseEntity {
  @Column({ name: 'session_number', type: 'varchar', length: 30, unique: true })
  @Index()
  sessionNumber: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'client_id', type: 'uuid' })
  @Index()
  clientId: string;

  @ManyToOne(() => Expert)
  @JoinColumn({ name: 'expert_id' })
  expert: Expert;

  @Column({ name: 'expert_id', type: 'uuid' })
  @Index()
  expertId: string;

  @Column({
    type: 'enum',
    enum: ConseilType,
  })
  type: ConseilType;

  @Column({
    type: 'enum',
    enum: ConseilFormat,
  })
  format: ConseilFormat;

  @Column({
    type: 'enum',
    enum: ConseilSessionStatus,
    default: ConseilSessionStatus.PENDING,
  })
  @Index()
  status: ConseilSessionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subject?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  currency: string;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'ended_at', type: 'timestamptz', nullable: true })
  endedAt?: Date;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ type: 'smallint', nullable: true })
  rating?: number;

  @Column({ name: 'rating_comment', type: 'text', nullable: true })
  ratingComment?: string;

  @Column({ name: 'rated_at', type: 'timestamptz', nullable: true })
  ratedAt?: Date;
}

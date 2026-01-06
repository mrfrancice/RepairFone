import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum ConseilType {
  DIAGNOSTIC = 'diagnostic',
  SOFTWARE = 'software',
  PURCHASE = 'purchase',
  MAINTENANCE = 'maintenance',
}

export enum ConseilFormat {
  CHAT = 'chat',
  CALL = 'call',
}

@Entity('experts')
export class Expert extends BaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ type: 'jsonb', default: [] })
  specialties: string[];

  @Column({ name: 'conseil_types', type: 'jsonb', default: [] })
  conseilTypes: ConseilType[];

  @Column({ name: 'conseil_formats', type: 'jsonb', default: ['chat', 'call'] })
  conseilFormats: ConseilFormat[];

  @Column({
    name: 'rating_avg',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  ratingAvg: number;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @Column({ name: 'response_time', type: 'int', default: 15 })
  responseTime: number; // in minutes

  @Column({ name: 'price_per_session', type: 'decimal', precision: 10, scale: 2, default: 2000 })
  pricePerSession: number;

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  currency: string;

  @Column({ name: 'years_of_experience', type: 'int', default: 1 })
  yearsOfExperience: number;

  @Column({ name: 'total_sessions', type: 'int', default: 0 })
  totalSessions: number;

  @Column({ name: 'is_available', type: 'boolean', default: true })
  @Index()
  isAvailable: boolean;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;
}

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { RepairerProfile } from '../../users/entities/repairer-profile.entity';
import { RepairRequest } from '../../requests/entities/repair-request.entity';

@Entity('reviews')
@Index(['requestId'], { unique: true })
export class Review extends BaseEntity {
  @ManyToOne(() => RepairRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: RepairRequest;

  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => RepairerProfile)
  @JoinColumn({ name: 'repairer_id' })
  repairer: RepairerProfile;

  @Column({ name: 'repairer_id', type: 'uuid' })
  @Index()
  repairerId: string;

  @Column({ type: 'smallint' })
  rating: number;

  @Column({ name: 'quality_rating', type: 'smallint', nullable: true })
  qualityRating?: number;

  @Column({ name: 'communication_rating', type: 'smallint', nullable: true })
  communicationRating?: number;

  @Column({ name: 'timeliness_rating', type: 'smallint', nullable: true })
  timelinessRating?: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ type: 'text', nullable: true })
  response?: string;

  @Column({ name: 'response_at', type: 'timestamptz', nullable: true })
  responseAt?: Date;

  @Column({ name: 'is_visible', default: true })
  isVisible: boolean;
}

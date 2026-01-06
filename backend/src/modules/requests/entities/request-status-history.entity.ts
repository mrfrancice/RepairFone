import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { RepairRequest, RequestStatus } from './repair-request.entity';

@Entity('request_status_history')
export class RequestStatusHistory extends BaseEntity {
  @Column({ name: 'request_id', type: 'uuid' })
  requestId: string;

  @ManyToOne(() => RepairRequest, (request) => request.statusHistory, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: RepairRequest;

  @Column({
    type: 'enum',
    enum: RequestStatus,
  })
  status: RequestStatus;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ nullable: true })
  changedBy: string;
}

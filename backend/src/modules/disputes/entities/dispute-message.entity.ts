import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Dispute } from './dispute.entity';

export enum DisputeMessageSenderType {
  CLIENT = 'client',
  REPAIRER = 'repairer',
  SUPPORT = 'support',
}

@Entity('dispute_messages')
export class DisputeMessage extends BaseEntity {
  @ManyToOne(() => Dispute, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dispute_id' })
  dispute: Dispute;

  @Column({ name: 'dispute_id', type: 'uuid' })
  @Index()
  disputeId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({
    name: 'sender_type',
    type: 'enum',
    enum: DisputeMessageSenderType,
  })
  senderType: DisputeMessageSenderType;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', default: [] })
  attachments: string[];

  @Column({ name: 'is_internal', type: 'boolean', default: false })
  isInternal: boolean; // Only visible to support
}

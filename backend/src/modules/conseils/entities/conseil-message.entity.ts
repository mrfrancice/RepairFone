import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ConseilSession } from './conseil-session.entity';

export enum ConseilMessageSenderType {
  CLIENT = 'client',
  EXPERT = 'expert',
}

@Entity('conseil_messages')
export class ConseilMessage extends BaseEntity {
  @ManyToOne(() => ConseilSession, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session: ConseilSession;

  @Column({ name: 'session_id', type: 'uuid' })
  @Index()
  sessionId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({
    name: 'sender_type',
    type: 'enum',
    enum: ConseilMessageSenderType,
  })
  senderType: ConseilMessageSenderType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: [] })
  attachments: string[];

  @Column({ name: 'is_read', type: 'boolean', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date;
}

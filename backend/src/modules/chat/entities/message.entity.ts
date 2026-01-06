import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Conversation } from './conversation.entity';

export enum SenderType {
  CLIENT = 'client',
  REPAIRER = 'repairer',
  SYSTEM = 'system',
}

export interface MessageAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name?: string;
  size?: number;
}

@Entity('messages')
export class Message extends BaseEntity {
  @ManyToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversation_id' })
  conversation: Conversation;

  @Column({ name: 'conversation_id', type: 'uuid' })
  @Index()
  conversationId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;

  @Column({ name: 'sender_id', type: 'uuid' })
  senderId: string;

  @Column({
    name: 'sender_type',
    type: 'enum',
    enum: SenderType,
  })
  senderType: SenderType;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', default: [] })
  attachments: MessageAttachment[];

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date;

  @Column({ name: 'is_deleted', type: 'boolean', default: false })
  isDeleted: boolean;
}

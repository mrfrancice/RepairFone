import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum NotificationType {
  REQUEST_RECEIVED = 'request_received',
  REQUEST_ACCEPTED = 'request_accepted',
  REQUEST_REJECTED = 'request_rejected',
  REQUEST_CANCELLED = 'request_cancelled',
  REQUEST_DELIVERED = 'request_delivered',
  QUOTE_RECEIVED = 'quote_received',
  QUOTE_ACCEPTED = 'quote_accepted',
  QUOTE_REJECTED = 'quote_rejected',
  REPAIR_STARTED = 'repair_started',
  REPAIR_COMPLETED = 'repair_completed',
  AWAITING_PARTS = 'awaiting_parts',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_SENT = 'payment_sent',
  PAYMENT_REFUNDED = 'payment_refunded',
  PAYMENT_BLOCKED = 'payment_blocked',
  MESSAGE_RECEIVED = 'message_received',
  DISPUTE_OPENED = 'dispute_opened',
  DISPUTE_RESOLVED = 'dispute_resolved',
  REVIEW_RECEIVED = 'review_received',
  SYSTEM = 'system',
}

export enum NotificationChannel {
  PUSH = 'push',
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
}

@Entity('notifications')
export class Notification extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  @Index()
  type: NotificationType;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'jsonb', nullable: true })
  data?: Record<string, any>;

  @Column({ name: 'reference_type', type: 'varchar', length: 50, nullable: true })
  referenceType?: string; // 'request', 'quote', 'payment', 'dispute', etc.

  @Column({ name: 'reference_id', type: 'uuid', nullable: true })
  @Index()
  referenceId?: string;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;

  @Column({ name: 'is_read', type: 'boolean', default: false })
  @Index()
  isRead: boolean;

  @Column({ name: 'read_at', type: 'timestamptz', nullable: true })
  readAt?: Date;

  @Column({ name: 'sent_at', type: 'timestamptz', nullable: true })
  sentAt?: Date;

  @Column({ name: 'is_sent', type: 'boolean', default: false })
  isSent: boolean;

  @Column({ name: 'send_error', type: 'text', nullable: true })
  sendError?: string;
}

import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

@Entity('audit_logs')
export class AuditLog extends BaseEntity {
  @Column({ type: 'varchar', length: 50 })
  @Index()
  action: string; // 'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE'

  @Column({ name: 'entity_type', type: 'varchar', length: 100 })
  @Index()
  entityType: string; // 'User', 'Request', 'Quote', etc.

  @Column({ name: 'entity_id', type: 'uuid', nullable: true })
  @Index()
  entityId?: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: object;
}

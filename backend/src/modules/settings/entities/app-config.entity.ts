import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('app_configs')
export class AppConfig extends BaseEntity {
  @Column({ length: 100, unique: true })
  @Index()
  key: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ length: 50, default: 'string' })
  type: string; // string, number, boolean, json

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, default: 'general' })
  category: string;

  @Column({ default: true })
  isActive: boolean;
}

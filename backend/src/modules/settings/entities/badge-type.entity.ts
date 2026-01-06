import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('badge_types')
export class BadgeType extends BaseEntity {
  @Column({ length: 50, unique: true })
  @Index()
  code: string;

  @Column({ length: 100 })
  label: string;

  @Column({ length: 10, nullable: true })
  icon: string;

  @Column({ length: 20, nullable: true })
  color: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;
}

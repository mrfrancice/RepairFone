import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('business_types')
export class BusinessType extends BaseEntity {
  @Column({ length: 50, unique: true })
  @Index()
  code: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: false })
  requiresRccm: boolean;

  @Column({ default: false })
  requiresTaxId: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;
}

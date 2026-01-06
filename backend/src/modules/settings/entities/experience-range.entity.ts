import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('experience_ranges')
export class ExperienceRange extends BaseEntity {
  @Column({ length: 20, unique: true })
  @Index()
  code: string;

  @Column({ length: 100 })
  label: string;

  @Column({ type: 'int', nullable: true })
  minYears: number;

  @Column({ type: 'int', nullable: true })
  maxYears: number;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;
}

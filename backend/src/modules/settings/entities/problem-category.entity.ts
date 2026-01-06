import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('problem_categories')
export class ProblemCategory extends BaseEntity {
  @Column({ length: 100, unique: true })
  @Index()
  code: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 10, nullable: true })
  icon: string;

  @Column({ length: 50, nullable: true })
  color: string;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;
}

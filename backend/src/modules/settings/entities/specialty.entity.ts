import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export enum SpecialtyCategory {
  BRAND = 'brand',
  DEVICE_TYPE = 'device_type',
  REPAIR_TYPE = 'repair_type',
}

@Entity('specialties')
export class Specialty extends BaseEntity {
  @Column({ length: 100, unique: true })
  @Index()
  code: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 10, nullable: true })
  icon: string;

  @Column({
    type: 'enum',
    enum: SpecialtyCategory,
    default: SpecialtyCategory.REPAIR_TYPE,
  })
  category: SpecialtyCategory;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;
}

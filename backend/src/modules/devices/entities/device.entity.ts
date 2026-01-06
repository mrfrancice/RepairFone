import { Entity, Column, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ServiceType } from './service-type.entity';

export enum DeviceCategory {
  SMARTPHONE = 'smartphone',
  TABLET = 'tablet',
  COMPUTER = 'computer',
  LAPTOP = 'laptop',
  SMARTWATCH = 'smartwatch',
  OTHER = 'other',
}

@Entity('devices')
@Index(['brand', 'model'], { unique: true })
export class Device extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  @Index()
  brand: string;

  @Column({ type: 'varchar', length: 255 })
  model: string;

  @Column({
    type: 'enum',
    enum: DeviceCategory,
  })
  @Index()
  category: DeviceCategory;

  @Column({ name: 'image_url', type: 'varchar', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ name: 'release_year', type: 'smallint', nullable: true })
  releaseYear?: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @OneToMany(() => ServiceType, (serviceType) => serviceType.device)
  serviceTypes: ServiceType[];
}

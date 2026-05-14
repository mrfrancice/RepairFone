import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Device } from './device.entity';

@Entity('service_types')
export class ServiceType extends BaseEntity {
  @Column()
  deviceId: string;

  @ManyToOne(() => Device, (device) => device.serviceTypes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice: number;

  @Column({ type: 'int', default: 60 })
  estimatedDuration: number; // in minutes

  @Column({ default: true })
  isActive: boolean;
}

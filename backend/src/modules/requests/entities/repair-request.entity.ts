import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { RepairerProfile } from '../../users/entities/repairer-profile.entity';
import { Device } from '../../devices/entities/device.entity';
import { ServiceType } from '../../devices/entities/service-type.entity';

export enum RequestStatus {
  PENDING = 'pending',          // En cours d'analyse
  ACCEPTED = 'accepted',        // Acceptée
  REJECTED = 'rejected',        // Rejetée
  IN_PROGRESS = 'in_progress',  // En cours de réparation
  AWAITING_PARTS = 'awaiting_parts', // En attente de pièces
  COMPLETED = 'completed',      // Terminée
  DELIVERED = 'delivered',      // Livrée
  CANCELLED = 'cancelled',      // Annulée
  DISPUTED = 'disputed',        // Litigée
}

export enum DeliveryMode {
  IN_SHOP = 'in_shop',
  AT_HOME = 'at_home',
  POSTAL = 'postal',
}

@Entity('repair_requests')
export class RepairRequest extends BaseEntity {
  @Column({ name: 'request_number', type: 'varchar', length: 20, unique: true })
  @Index()
  requestNumber: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'client_id', type: 'uuid' })
  @Index()
  clientId: string;

  @ManyToOne(() => RepairerProfile, { nullable: true })
  @JoinColumn({ name: 'repairer_id' })
  repairer?: RepairerProfile;

  @Column({ name: 'repairer_id', type: 'uuid', nullable: true })
  @Index()
  repairerId?: string;

  @ManyToOne(() => Device, { nullable: true })
  @JoinColumn({ name: 'device_id' })
  device?: Device;

  @Column({ name: 'device_id', type: 'uuid', nullable: true })
  deviceId?: string;

  @ManyToOne(() => ServiceType, { nullable: true })
  @JoinColumn({ name: 'service_type_id' })
  serviceType?: ServiceType;

  @Column({ name: 'service_type_id', type: 'uuid', nullable: true })
  serviceTypeId?: string;

  @Column({
    type: 'enum',
    enum: RequestStatus,
    default: RequestStatus.PENDING,
  })
  @Index()
  status: RequestStatus;

  @Column({
    name: 'delivery_mode',
    type: 'enum',
    enum: DeliveryMode,
    default: DeliveryMode.IN_SHOP,
  })
  deliveryMode: DeliveryMode;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'device_brand', type: 'varchar', length: 100, nullable: true })
  deviceBrand?: string;

  @Column({ name: 'device_model', type: 'varchar', length: 255, nullable: true })
  deviceModel?: string;

  @Column({ name: 'device_serial_number', type: 'varchar', length: 100, nullable: true })
  deviceSerialNumber?: string;

  @Column({ type: 'jsonb', default: [] })
  images: string[];

  @Column({
    name: 'estimated_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  estimatedPrice?: number;

  @Column({
    name: 'final_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  finalPrice?: number;

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  currency: string;

  @Column({ name: 'preferred_date', type: 'date', nullable: true })
  preferredDate?: Date;

  @Column({ name: 'scheduled_at', type: 'timestamptz', nullable: true })
  scheduledAt?: Date;

  @Column({ name: 'service_address', type: 'text', nullable: true })
  serviceAddress?: string;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ name: 'cancelled_by', type: 'uuid', nullable: true })
  cancelledBy?: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason?: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ name: 'rejected_at', type: 'timestamptz', nullable: true })
  rejectedAt?: Date;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt?: Date;

  @Column({ name: 'preferred_time', type: 'varchar', length: 50, nullable: true })
  preferredTime?: string;

  @Column({ name: 'client_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  clientLatitude?: number;

  @Column({ name: 'client_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  clientLongitude?: number;

  @Column({ name: 'client_address', type: 'text', nullable: true })
  clientAddress?: string;

  @Column({ name: 'estimated_duration', type: 'int', nullable: true })
  estimatedDuration?: number;

  @Column({ name: 'urgency', type: 'varchar', length: 20, default: 'normal' })
  urgency: 'normal' | 'express';

  @Column({ name: 'urgency_supplement', type: 'decimal', precision: 10, scale: 2, nullable: true })
  urgencySupplement?: number;

  @OneToMany('RequestStatusHistory', 'request')
  statusHistory: any[];
}

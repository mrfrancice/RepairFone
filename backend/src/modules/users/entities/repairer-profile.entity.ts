import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from './user.entity';

export enum VerificationStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  SUSPENDED = 'suspended',
}

@Entity('repairer_profiles')
export class RepairerProfile extends BaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  // ===== PERSONAL IDENTIFICATION =====
  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ name: 'national_id_number', type: 'varchar', length: 50, nullable: true })
  nationalIdNumber?: string;

  @Column({ name: 'national_id_front_url', type: 'varchar', length: 500, nullable: true })
  nationalIdFrontUrl?: string;

  @Column({ name: 'national_id_back_url', type: 'varchar', length: 500, nullable: true })
  nationalIdBackUrl?: string;

  @Column({ name: 'personal_address', type: 'text', nullable: true })
  personalAddress?: string;

  // ===== BUSINESS INFORMATION =====
  @Column({ name: 'business_name', type: 'varchar', length: 255 })
  businessName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'business_type', type: 'varchar', length: 100, nullable: true })
  businessType?: string; // 'individual', 'company', 'auto_entrepreneur'

  @Column({ name: 'rccm_number', type: 'varchar', length: 100, nullable: true })
  rccmNumber?: string; // Registre du Commerce et du Crédit Mobilier

  @Column({ name: 'rccm_document_url', type: 'varchar', length: 500, nullable: true })
  rccmDocumentUrl?: string;

  @Column({ name: 'tax_id', type: 'varchar', length: 50, nullable: true })
  taxId?: string;

  @Column({ name: 'business_phone', type: 'varchar', length: 20, nullable: true })
  businessPhone?: string;

  @Column({ name: 'business_email', type: 'varchar', length: 255, nullable: true })
  businessEmail?: string;

  // ===== SHOP LOCATION =====
  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'varchar', length: 100, default: 'Abidjan' })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  commune?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  quarter?: string; // Quartier

  @Column({ type: 'text', nullable: true })
  landmark?: string; // Point de repère

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude?: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude?: number;

  @Column({ name: 'location_verified', default: false })
  locationVerified: boolean;

  // ===== SHOP DETAILS =====
  @Column({ name: 'shop_photo_url', type: 'varchar', length: 500, nullable: true })
  shopPhotoUrl?: string;

  @Column({ type: 'jsonb', default: [] })
  specialties: string[]; // ['iPhone', 'Samsung', 'Huawei', 'Écrans', 'Batteries']

  @Column({ name: 'years_of_experience', type: 'int', nullable: true })
  yearsOfExperience?: number;

  // ===== VERIFICATION & CREDIBILITY =====
  @Column({
    name: 'verification_status',
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.PENDING,
  })
  @Index()
  verificationStatus: VerificationStatus;

  @Column({ name: 'verified_at', type: 'timestamptz', nullable: true })
  verifiedAt?: Date;

  @Column({ name: 'verification_notes', type: 'text', nullable: true })
  verificationNotes?: string;

  @Column({ name: 'id_verified', default: false })
  idVerified: boolean;

  @Column({ name: 'business_verified', default: false })
  businessVerified: boolean;

  @Column({ type: 'jsonb', default: [] })
  certifications: any[];

  // ===== WORKING HOURS & AVAILABILITY =====
  @Column({ name: 'working_hours', type: 'jsonb', default: {} })
  workingHours: Record<string, any>;

  @Column({ name: 'accepts_home_service', default: false })
  acceptsHomeService: boolean;

  @Column({
    name: 'home_service_radius_km',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 10,
  })
  homeServiceRadiusKm: number;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  // ===== STATISTICS =====
  @Column({
    name: 'rating_avg',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
  })
  ratingAvg: number;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @Column({ name: 'total_repairs', default: 0 })
  totalRepairs: number;

  @Column({
    name: 'completion_rate',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  completionRate: number;
}

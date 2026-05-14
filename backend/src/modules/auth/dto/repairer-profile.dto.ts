import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for repairer profile creation during registration
 */
export class RepairerProfileDto {
  // ==========================================
  // Personal Identification
  // ==========================================

  @ApiPropertyOptional({
    description: 'Date of birth (ISO string)',
    example: '1985-06-15',
  })
  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    description: 'National ID number (CNI)',
    example: 'CI12345678',
  })
  @IsOptional()
  @IsString()
  nationalIdNumber?: string;

  @ApiPropertyOptional({
    description: 'Personal home address',
    example: 'Cocody, Riviera 2',
  })
  @IsOptional()
  @IsString()
  personalAddress?: string;

  // ==========================================
  // Business Information
  // ==========================================

  @ApiProperty({
    description: 'Business/shop name',
    example: 'TechFix Abidjan',
  })
  @IsString()
  businessName: string;

  @ApiPropertyOptional({
    description: 'Business description',
    example: 'Specialiste en reparation de smartphones et tablettes',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Type of business (individual, company, etc.)',
    example: 'individual',
  })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({
    description: 'RCCM number (business registration)',
    example: 'RCCM-CI-ABJ-2023-B-12345',
  })
  @IsOptional()
  @IsString()
  rccmNumber?: string;

  @ApiPropertyOptional({
    description: 'Tax identification number',
    example: 'NIF-123456789',
  })
  @IsOptional()
  @IsString()
  taxId?: string;

  @ApiPropertyOptional({
    description: 'Business phone number',
    example: '+2250701020305',
  })
  @IsOptional()
  @IsString()
  businessPhone?: string;

  @ApiPropertyOptional({
    description: 'Business email address',
    example: 'contact@techfix-abidjan.ci',
  })
  @IsOptional()
  @IsString()
  businessEmail?: string;

  // ==========================================
  // Shop Location
  // ==========================================

  @ApiProperty({
    description: 'Shop address',
    example: 'Marcory Zone 4, Rue des Jardins',
  })
  @IsString()
  address: string;

  @ApiPropertyOptional({
    description: 'City',
    example: 'Abidjan',
    default: 'Abidjan',
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({
    description: 'Commune/District',
    example: 'Marcory',
  })
  @IsOptional()
  @IsString()
  commune?: string;

  @ApiPropertyOptional({
    description: 'Quarter/Neighborhood',
    example: 'Zone 4',
  })
  @IsOptional()
  @IsString()
  quarter?: string;

  @ApiPropertyOptional({
    description: 'Nearby landmark for easier location',
    example: 'En face de la pharmacie du quartier',
  })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({
    description: 'GPS latitude coordinate',
    example: 5.3364,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({
    description: 'GPS longitude coordinate',
    example: -3.9614,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  // ==========================================
  // Shop Details
  // ==========================================

  @ApiPropertyOptional({
    description: 'List of repair specialties',
    example: ['smartphones', 'tablets', 'laptops'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({
    description: 'Years of experience in repair',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    description: 'Whether the repairer offers home/mobile service',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  acceptsHomeService?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum distance for home service (km)',
    example: 15,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  homeServiceRadiusKm?: number;
}

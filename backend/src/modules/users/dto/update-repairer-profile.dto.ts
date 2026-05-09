import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  MaxLength,
  MinLength,
  Min,
  Max,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO pour les horaires d'une journée
 */
class DayWorkingHoursDto {
  @IsBoolean()
  isOpen: boolean;

  @IsOptional()
  @IsString()
  openTime?: string;

  @IsOptional()
  @IsString()
  closeTime?: string;

  @IsOptional()
  @IsString()
  breakStart?: string;

  @IsOptional()
  @IsString()
  breakEnd?: string;
}

/**
 * DTO pour les horaires de travail hebdomadaires
 */
class WorkingHoursScheduleDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => DayWorkingHoursDto)
  monday?: DayWorkingHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayWorkingHoursDto)
  tuesday?: DayWorkingHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayWorkingHoursDto)
  wednesday?: DayWorkingHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayWorkingHoursDto)
  thursday?: DayWorkingHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayWorkingHoursDto)
  friday?: DayWorkingHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayWorkingHoursDto)
  saturday?: DayWorkingHoursDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => DayWorkingHoursDto)
  sunday?: DayWorkingHoursDto;
}

/**
 * DTO pour la mise à jour du profil réparateur.
 *
 * SÉCURITÉ: Seuls les champs modifiables par le réparateur sont inclus.
 * Les champs de vérification, statistiques et blocage sont exclus.
 */
export class UpdateRepairerProfileDto {
  // ===== INFORMATIONS BUSINESS =====

  @ApiPropertyOptional({
    description: 'Nom de l\'entreprise ou du commerce',
    example: 'TechRepair Abidjan',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Description de l\'activité',
    example: 'Spécialiste réparation iPhone et Samsung depuis 10 ans',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Type d\'entreprise',
    example: 'individual',
    enum: ['individual', 'company', 'auto_entrepreneur'],
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  businessType?: string;

  @ApiPropertyOptional({
    description: 'Téléphone professionnel',
    example: '+225 07 00 00 00 00',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  businessPhone?: string;

  @ApiPropertyOptional({
    description: 'Email professionnel',
    example: 'contact@techrepair.ci',
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  businessEmail?: string;

  // ===== LOCALISATION =====

  @ApiPropertyOptional({
    description: 'Adresse complète',
    example: 'Rue des Jardins, Immeuble ABC, 2ème étage',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'Ville',
    example: 'Abidjan',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Commune',
    example: 'Cocody',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  commune?: string;

  @ApiPropertyOptional({
    description: 'Quartier',
    example: 'Riviera 2',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  quarter?: string;

  @ApiPropertyOptional({
    description: 'Point de repère',
    example: 'En face de la pharmacie du carrefour',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  landmark?: string;

  @ApiPropertyOptional({
    description: 'Latitude GPS',
    example: 5.3599,
  })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude GPS',
    example: -4.0083,
  })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  // ===== COMPÉTENCES =====

  @ApiPropertyOptional({
    description: 'Spécialités de réparation',
    example: ['iPhone', 'Samsung', 'Écrans', 'Batteries'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  specialties?: string[];

  @ApiPropertyOptional({
    description: 'Années d\'expérience',
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsOfExperience?: number;

  // ===== DISPONIBILITÉ =====

  @ApiPropertyOptional({
    description: 'Horaires de travail',
    type: WorkingHoursScheduleDto,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => WorkingHoursScheduleDto)
  workingHours?: WorkingHoursScheduleDto;

  @ApiPropertyOptional({
    description: 'Accepte les interventions à domicile',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  acceptsHomeService?: boolean;

  @ApiPropertyOptional({
    description: 'Rayon d\'intervention à domicile (km)',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  homeServiceRadiusKm?: number;

  @ApiPropertyOptional({
    description: 'Disponible pour de nouvelles demandes',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

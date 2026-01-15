import { IsOptional, IsString, IsNumber, IsUUID, IsEnum, IsArray, IsIn, IsNotEmpty, MaxLength } from 'class-validator';
import { DeliveryMode } from '../entities/repair-request.entity';
import { IsSafeUrl } from '../../../common/validators';

export class CreateRequestDto {
  @IsUUID()
  @IsNotEmpty()
  repairerId: string;

  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsOptional()
  @IsUUID()
  serviceTypeId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000, { message: 'La description ne peut pas depasser 2000 caracteres' })
  description: string;

  @IsOptional()
  @IsString()
  preferredDate?: string;

  @IsOptional()
  @IsString()
  preferredTime?: string;

  @IsOptional()
  @IsNumber()
  clientLatitude?: number;

  @IsOptional()
  @IsNumber()
  clientLongitude?: number;

  @IsOptional()
  @IsString()
  clientAddress?: string;

  @IsOptional()
  @IsEnum(DeliveryMode)
  deliveryMode?: DeliveryMode;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsSafeUrl({ each: true, message: 'Les URLs d\'images doivent etre securisees (HTTPS ou base64)' })
  images?: string[];

  @IsOptional()
  @IsIn(['normal', 'express'])
  urgency?: 'normal' | 'express';
}

import { IsOptional, IsString, IsNumber, IsUUID, IsEnum, IsArray, IsIn, IsNotEmpty } from 'class-validator';
import { DeliveryMode } from '../entities/repair-request.entity';

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
  images?: string[];

  @IsOptional()
  @IsIn(['normal', 'express'])
  urgency?: 'normal' | 'express';
}

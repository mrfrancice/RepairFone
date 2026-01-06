import { IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus, PaymentType } from '../entities/payment.entity';

export class PaymentFilters {
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

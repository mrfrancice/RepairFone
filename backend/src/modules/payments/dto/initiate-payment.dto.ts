import { IsUUID, IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { PaymentMethod, PaymentType } from '../entities/payment.entity';

export class InitiatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  requestId: string;

  @IsUUID()
  @IsNotEmpty()
  quoteId: string;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @IsEnum(PaymentType)
  @IsNotEmpty()
  paymentType: PaymentType;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

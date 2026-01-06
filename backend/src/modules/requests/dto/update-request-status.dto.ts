import { IsOptional, IsString, IsEnum, IsNotEmpty } from 'class-validator';
import { RequestStatus } from '../entities/repair-request.entity';

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  @IsNotEmpty()
  status: RequestStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;  // Motif de rejet (obligatoire si status = rejected)
}

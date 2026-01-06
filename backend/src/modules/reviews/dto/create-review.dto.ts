import { IsOptional, IsNumber, IsString, IsUUID, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsUUID()
  @IsNotEmpty()
  requestId: string;

  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

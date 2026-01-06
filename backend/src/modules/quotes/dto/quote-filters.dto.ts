import { IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteStatus } from '../entities/quote.entity';

export class QuoteFilters {
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

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

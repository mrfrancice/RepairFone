import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReviewFilters {
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

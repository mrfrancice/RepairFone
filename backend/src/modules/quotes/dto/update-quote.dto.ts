import {
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuoteStatus } from '../entities/quote.entity';
import { CreateQuotePartDto } from './create-quote-part.dto';

export class UpdateQuoteDto {
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  laborCost?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotePartDto)
  parts?: CreateQuotePartDto[];

  @IsOptional()
  @IsString()
  estimatedDuration?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

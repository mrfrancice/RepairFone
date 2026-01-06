import { IsUUID, IsNumber, IsString, IsOptional, IsArray, ValidateNested, Min, IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateQuotePartDto } from './create-quote-part.dto';

export class CreateQuoteDto {
  @IsUUID()
  @IsNotEmpty()
  requestId: string;

  @IsNumber()
  @Min(0)
  laborCost: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuotePartDto)
  parts?: CreateQuotePartDto[];

  @IsString()
  @IsNotEmpty()
  estimatedDuration: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  validDays?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

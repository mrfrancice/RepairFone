import { IsString, IsNumber, IsOptional, IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateQuotePartDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  description?: string;
}

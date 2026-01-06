import { IsEnum, IsNumber, IsNotEmpty, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { RatingCategory } from '../entities/step-rating.entity';

// DTO pour une note individuelle par categorie
export class StepRatingItemDto {
  @IsEnum(RatingCategory)
  @IsNotEmpty()
  category: RatingCategory;

  @IsNumber()
  @Type(() => Number)
  @Min(-5)
  @Max(5)
  rating: number; // -5 a 5
}

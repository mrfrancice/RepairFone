import {
  IsUUID,
  IsEnum,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { RatingStep } from '../entities/step-rating.entity';
import { StepRatingItemDto } from './step-rating-item.dto';

// DTO pour creer des notes par etape
export class CreateStepRatingDto {
  @IsUUID()
  @IsNotEmpty()
  requestId: string;

  @IsEnum(RatingStep)
  @IsNotEmpty()
  step: RatingStep;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StepRatingItemDto)
  ratings: StepRatingItemDto[];

  @IsOptional()
  @IsString()
  comment?: string;
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { StepRating } from './entities/step-rating.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { RequestsModule } from '../requests/requests.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, StepRating]),
    RequestsModule,
    UsersModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

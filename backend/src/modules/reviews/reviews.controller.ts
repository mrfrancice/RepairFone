import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService, CreateReviewDto, ReviewFilters, CreateStepRatingDto } from './reviews.service';
import { RatingStep } from './entities/step-rating.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer un avis (client)' })
  create(@CurrentUser() user: User, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.id, dto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes avis' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findMy(@CurrentUser() user: User, @Query() filters: ReviewFilters) {
    if (user.role === 'repairer') {
      return this.reviewsService.findByRepairer(user.id, filters);
    }
    return this.reviewsService.findByClient(user.id, filters);
  }

  @Get('repairer/:repairerId')
  @Public()
  @ApiOperation({ summary: 'Avis d\'un réparateur' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findByRepairer(
    @Param('repairerId', ParseUUIDPipe) repairerId: string,
    @Query() filters: ReviewFilters,
  ) {
    return this.reviewsService.findByRepairer(repairerId, filters);
  }

  @Get('repairer/:repairerId/stats')
  @Public()
  @ApiOperation({ summary: 'Statistiques des avis d\'un réparateur' })
  getRepairerStats(@Param('repairerId', ParseUUIDPipe) repairerId: string) {
    return this.reviewsService.getRepairerStats(repairerId);
  }

  @Get('request/:requestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Avis d\'une demande' })
  findByRequest(@Param('requestId', ParseUUIDPipe) requestId: string) {
    return this.reviewsService.findByRequest(requestId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Détails d\'un avis' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findOne(id);
  }

  // ============ Step Ratings Endpoints ============

  @Post('step-ratings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer des notes par étape (client)' })
  createStepRating(@CurrentUser() user: User, @Body() dto: CreateStepRatingDto) {
    return this.reviewsService.createStepRating(user.id, dto);
  }

  @Get('step-ratings/request/:requestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Notes par étape d\'une demande' })
  getStepRatingsForRequest(@Param('requestId', ParseUUIDPipe) requestId: string) {
    return this.reviewsService.getStepRatingsForRequest(requestId);
  }

  @Get('step-ratings/can-rate/:requestId/:step')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vérifier si le client peut noter à une étape' })
  canRateAtStep(
    @CurrentUser() user: User,
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @Param('step') step: RatingStep,
  ) {
    return this.reviewsService.canRateAtStep(user.id, requestId, step);
  }

  @Get('step-ratings/repairer/:repairerId/stats')
  @Public()
  @ApiOperation({ summary: 'Statistiques de notes par étape d\'un réparateur' })
  getRepairerStepRatingStats(@Param('repairerId', ParseUUIDPipe) repairerId: string) {
    return this.reviewsService.getRepairerStepRatingStats(repairerId);
  }
}

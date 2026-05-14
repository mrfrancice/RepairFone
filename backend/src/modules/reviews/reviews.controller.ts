import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ReviewFilters, CreateStepRatingDto } from './dto';
import { RatingStep } from './entities/step-rating.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User, UserRole } from '../users/entities/user.entity';

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
    if (user.role === UserRole.REPAIRER) {
      return this.reviewsService.findByRepairer(user.id, filters);
    }
    return this.reviewsService.findByClient(user.id, filters);
  }

  @Get('repairer/:repairerId')
  @Public()
  @ApiOperation({ summary: "Avis d'un réparateur" })
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
  @ApiOperation({ summary: "Statistiques des avis d'un réparateur" })
  getRepairerStats(@Param('repairerId', ParseUUIDPipe) repairerId: string) {
    return this.reviewsService.getRepairerStats(repairerId);
  }

  @Get('request/:requestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Avis d'une demande" })
  async findByRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() user: User,
  ) {
    const review = await this.reviewsService.findByRequest(requestId);

    if (!review) {
      return null;
    }

    // Authorization: User must be the client, the repairer, or an admin
    // Need to fetch the request to check ownership
    const isClient = review.clientId === user.id;
    const isRepairer = review.repairer?.userId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isClient && !isRepairer && !isAdmin) {
      throw new ForbiddenException("Vous n'avez pas accès à cet avis");
    }

    return review;
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: "Détails d'un avis" })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findOne(id);
  }

  // ============ Step Ratings Endpoints ============

  @Post('step-ratings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer des notes par étape (client)' })
  createStepRating(
    @CurrentUser() user: User,
    @Body() dto: CreateStepRatingDto,
  ) {
    return this.reviewsService.createStepRating(user.id, dto);
  }

  @Get('step-ratings/request/:requestId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Notes par étape d'une demande" })
  async getStepRatingsForRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() user: User,
  ) {
    const result =
      await this.reviewsService.getStepRatingsForRequest(requestId);

    if (!result.ratings || result.ratings.length === 0) {
      return result;
    }

    // Authorization: User must be the client, the repairer, or an admin
    const firstRating = result.ratings[0];
    const isClient = firstRating.clientId === user.id;
    const isRepairer = firstRating.repairerId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isClient && !isRepairer && !isAdmin) {
      throw new ForbiddenException("Vous n'avez pas accès à ces notes");
    }

    return result;
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
  @ApiOperation({ summary: "Statistiques de notes par étape d'un réparateur" })
  getRepairerStepRatingStats(
    @Param('repairerId', ParseUUIDPipe) repairerId: string,
  ) {
    return this.reviewsService.getRepairerStepRatingStats(repairerId);
  }
}

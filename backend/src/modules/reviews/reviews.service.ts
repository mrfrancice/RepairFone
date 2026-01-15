import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Review } from './entities/review.entity';
import { StepRating, RatingStep, RatingCategory } from './entities/step-rating.entity';
import { RequestsService } from '../requests/requests.service';
import { RepairersService } from '../users/repairers.service';
import { RequestStatus } from '../requests/entities/repair-request.entity';
import { CreateReviewDto, ReviewFilters, CreateStepRatingDto } from './dto';
import { ReviewCreatedEvent, EventNames } from '../../common/events';

// Re-export DTOs for backward compatibility
export { CreateReviewDto, ReviewFilters, StepRatingItemDto, CreateStepRatingDto } from './dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(StepRating)
    private readonly stepRatingRepository: Repository<StepRating>,
    private readonly requestsService: RequestsService,
    private readonly repairersService: RepairersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createReview(clientId: string, dto: CreateReviewDto): Promise<Review> {
    // Verify request exists and is completed
    const request = await this.requestsService.findOne(dto.requestId);

    if (request.clientId !== clientId) {
      throw new ForbiddenException('Vous ne pouvez noter que vos propres demandes');
    }

    // BIZ-110: Reviews autorisées uniquement après livraison
    if (request.status !== RequestStatus.DELIVERED) {
      throw new BadRequestException('Vous ne pouvez noter que les réparations livrées');
    }

    // Check if already reviewed
    const existingReview = await this.reviewRepository.findOne({
      where: { requestId: dto.requestId },
    });

    if (existingReview) {
      throw new BadRequestException('Vous avez déjà noté cette réparation');
    }

    // Validate rating
    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('La note doit être entre 1 et 5');
    }

    // Create review
    const review = this.reviewRepository.create({
      requestId: dto.requestId,
      clientId,
      repairerId: request.repairerId,
      rating: dto.rating,
      comment: dto.comment,
    });

    const savedReview = await this.reviewRepository.save(review);

    // Update repairer rating
    if (request.repairerId) {
      await this.updateRepairerRating(request.repairerId);
    }

    // Emit review created event
    const reviewCreatedEvent = new ReviewCreatedEvent(
      savedReview.id,
      savedReview.requestId,
      savedReview.clientId,
      savedReview.repairerId,
      savedReview.rating,
      savedReview.comment,
    );
    this.eventEmitter.emit(EventNames.REVIEW_CREATED, reviewCreatedEvent);

    return this.findOne(savedReview.id);
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['client', 'repairer', 'request'],
    });

    if (!review) {
      throw new NotFoundException('Avis non trouvé');
    }

    return review;
  }

  async findByRepairer(repairerIdOrUserId: string, filters: ReviewFilters): Promise<{ data: Review[]; total: number; average: number }> {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Try to get profile ID from user ID first
    let profileId = repairerIdOrUserId;
    const profile = await this.repairersService.findByUserId(repairerIdOrUserId);
    if (profile) {
      profileId = profile.id;
    }

    const [data, total] = await this.reviewRepository.findAndCount({
      where: { repairerId: profileId },
      relations: ['client', 'request', 'request.device', 'request.serviceType'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    // Calculate average
    const avgResult = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .where('review.repairerId = :repairerId', { repairerId: profileId })
      .getRawOne();

    const average = parseFloat(avgResult?.average) || 0;

    return { data, total, average: Math.round(average * 10) / 10 };
  }

  async findByClient(clientId: string, filters: ReviewFilters): Promise<{ data: Review[]; total: number }> {
    const { page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepository.findAndCount({
      where: { clientId },
      relations: ['repairer', 'repairer.repairerProfile', 'request', 'request.device'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findByRequest(requestId: string): Promise<Review | null> {
    return this.reviewRepository.findOne({
      where: { requestId },
      relations: ['client'],
    });
  }

  private async updateRepairerRating(repairerId: string): Promise<void> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('review.repairerId = :repairerId', { repairerId })
      .getRawOne();

    const rating = parseFloat(result?.average) || 0;
    const reviewCount = parseInt(result?.count, 10) || 0;

    await this.repairersService.updateRating(repairerId, rating, reviewCount);
  }

  async getRepairerStats(repairerIdOrUserId: string): Promise<{
    average: number;
    total: number;
    distribution: { rating: number; count: number }[];
  }> {
    // Try to get profile ID from user ID first
    let profileId = repairerIdOrUserId;
    const profile = await this.repairersService.findByUserId(repairerIdOrUserId);
    if (profile) {
      profileId = profile.id;
    }

    const avgResult = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(*)', 'total')
      .where('review.repairerId = :repairerId', { repairerId: profileId })
      .getRawOne();

    const distribution = await this.reviewRepository
      .createQueryBuilder('review')
      .select('review.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('review.repairerId = :repairerId', { repairerId: profileId })
      .groupBy('review.rating')
      .orderBy('review.rating', 'DESC')
      .getRawMany();

    return {
      average: Math.round((parseFloat(avgResult?.average) || 0) * 10) / 10,
      total: parseInt(avgResult?.total, 10) || 0,
      distribution: distribution.map((d) => ({
        rating: d.rating,
        count: parseInt(d.count, 10),
      })),
    };
  }

  // ============ Step Ratings Methods ============

  /**
   * Créer des notes par étape pour une demande
   */
  async createStepRating(clientId: string, dto: CreateStepRatingDto): Promise<StepRating[]> {
    const request = await this.requestsService.findOne(dto.requestId);

    if (request.clientId !== clientId) {
      throw new ForbiddenException('Vous ne pouvez noter que vos propres demandes');
    }

    // Vérifier qu'un réparateur est assigné à la demande
    if (!request.repairerId) {
      throw new BadRequestException('Aucun réparateur n\'est assigné à cette demande');
    }

    // Vérifier que le statut permet cette étape de notation
    const allowedStatuses = this.getAllowedStatusesForStep(dto.step);
    if (!allowedStatuses.includes(request.status)) {
      throw new BadRequestException(`Vous ne pouvez pas noter à cette étape. Statut actuel: ${request.status}`);
    }

    const savedRatings: StepRating[] = [];

    for (const ratingItem of dto.ratings) {
      // Valider la note (-5 à 5)
      if (ratingItem.rating < -5 || ratingItem.rating > 5) {
        throw new BadRequestException('La note doit être entre -5 et 5');
      }

      // Vérifier si déjà noté pour cette étape et catégorie
      const existing = await this.stepRatingRepository.findOne({
        where: {
          requestId: dto.requestId,
          step: dto.step,
          category: ratingItem.category,
        },
      });

      if (existing) {
        // Mettre à jour la note existante
        existing.rating = ratingItem.rating;
        existing.comment = dto.comment;
        await this.stepRatingRepository.save(existing);
        savedRatings.push(existing);
      } else {
        // Créer une nouvelle note
        const stepRating = this.stepRatingRepository.create({
          requestId: dto.requestId,
          clientId,
          repairerId: request.repairerId,
          step: dto.step,
          category: ratingItem.category,
          rating: ratingItem.rating,
          comment: dto.comment,
        });
        const saved = await this.stepRatingRepository.save(stepRating);
        savedRatings.push(saved);
      }
    }

    // Mettre à jour les statistiques du réparateur
    if (request.repairerId) {
      await this.updateRepairerStepRatingStats(request.repairerId);
    }

    return savedRatings;
  }

  /**
   * Obtenir les notes par étape pour une demande
   */
  async getStepRatingsForRequest(requestId: string): Promise<{
    ratings: StepRating[];
    byStep: Record<string, StepRating[]>;
  }> {
    const ratings = await this.stepRatingRepository.find({
      where: { requestId },
      order: { createdAt: 'ASC' },
    });

    // Grouper par étape
    const byStep: Record<string, StepRating[]> = {};
    for (const rating of ratings) {
      if (!byStep[rating.step]) {
        byStep[rating.step] = [];
      }
      byStep[rating.step].push(rating);
    }

    return { ratings, byStep };
  }

  /**
   * Vérifier si le client peut noter à une étape donnée
   */
  async canRateAtStep(clientId: string, requestId: string, step: RatingStep): Promise<{
    canRate: boolean;
    alreadyRated: boolean;
    reason?: string;
  }> {
    const request = await this.requestsService.findOne(requestId);

    if (request.clientId !== clientId) {
      return { canRate: false, alreadyRated: false, reason: 'Ce n\'est pas votre demande' };
    }

    const allowedStatuses = this.getAllowedStatusesForStep(step);
    if (!allowedStatuses.includes(request.status)) {
      return { canRate: false, alreadyRated: false, reason: `Statut actuel (${request.status}) ne permet pas cette notation` };
    }

    // Vérifier si déjà noté (au moins une catégorie)
    const existingRating = await this.stepRatingRepository.findOne({
      where: { requestId, step, clientId },
    });

    return {
      canRate: !existingRating,
      alreadyRated: !!existingRating,
      reason: existingRating ? 'Vous avez déjà noté cette étape' : undefined,
    };
  }

  /**
   * Obtenir les statistiques de notes par étape pour un réparateur
   */
  async getRepairerStepRatingStats(repairerIdOrUserId: string): Promise<{
    overall: { average: number; count: number };
    byCategory: Record<string, { average: number; count: number }>;
    byStep: Record<string, { average: number; count: number }>;
    recentRatings: StepRating[];
  }> {
    let profileId = repairerIdOrUserId;
    const profile = await this.repairersService.findByUserId(repairerIdOrUserId);
    if (profile) {
      profileId = profile.id;
    }

    // Moyenne globale
    const overallResult = await this.stepRatingRepository
      .createQueryBuilder('sr')
      .select('AVG(sr.rating)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('sr.repairerId = :repairerId', { repairerId: profileId })
      .getRawOne();

    // Par catégorie
    const byCategoryResult = await this.stepRatingRepository
      .createQueryBuilder('sr')
      .select('sr.category', 'category')
      .addSelect('AVG(sr.rating)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('sr.repairerId = :repairerId', { repairerId: profileId })
      .groupBy('sr.category')
      .getRawMany();

    // Par étape
    const byStepResult = await this.stepRatingRepository
      .createQueryBuilder('sr')
      .select('sr.step', 'step')
      .addSelect('AVG(sr.rating)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('sr.repairerId = :repairerId', { repairerId: profileId })
      .groupBy('sr.step')
      .getRawMany();

    // Notes récentes
    const recentRatings = await this.stepRatingRepository.find({
      where: { repairerId: profileId },
      relations: ['client', 'request'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const byCategory: Record<string, { average: number; count: number }> = {};
    for (const item of byCategoryResult) {
      byCategory[item.category] = {
        average: Math.round((parseFloat(item.average) || 0) * 10) / 10,
        count: parseInt(item.count, 10) || 0,
      };
    }

    const byStep: Record<string, { average: number; count: number }> = {};
    for (const item of byStepResult) {
      byStep[item.step] = {
        average: Math.round((parseFloat(item.average) || 0) * 10) / 10,
        count: parseInt(item.count, 10) || 0,
      };
    }

    return {
      overall: {
        average: Math.round((parseFloat(overallResult?.average) || 0) * 10) / 10,
        count: parseInt(overallResult?.count, 10) || 0,
      },
      byCategory,
      byStep,
      recentRatings,
    };
  }

  /**
   * Mettre à jour les statistiques de notation du réparateur
   */
  private async updateRepairerStepRatingStats(repairerId: string): Promise<void> {
    const result = await this.stepRatingRepository
      .createQueryBuilder('sr')
      .select('AVG(sr.rating)', 'average')
      .addSelect('COUNT(*)', 'count')
      .where('sr.repairerId = :repairerId', { repairerId })
      .getRawOne();

    const avgRating = parseFloat(result?.average) || 0;
    const ratingCount = parseInt(result?.count, 10) || 0;

    // Mettre à jour le profil du réparateur
    await this.repairersService.updateRating(repairerId, avgRating, ratingCount);
  }

  /**
   * Retourne les statuts autorisés pour chaque étape de notation
   */
  private getAllowedStatusesForStep(step: RatingStep): RequestStatus[] {
    switch (step) {
      case RatingStep.QUOTE_ACCEPTED:
        return [RequestStatus.ACCEPTED, RequestStatus.COMPLETED, RequestStatus.DELIVERED];
      case RatingStep.IN_PROGRESS:
        return [RequestStatus.ACCEPTED, RequestStatus.COMPLETED, RequestStatus.DELIVERED];
      case RatingStep.COMPLETED:
        return [RequestStatus.COMPLETED, RequestStatus.DELIVERED];
      case RatingStep.DELIVERED:
        return [RequestStatus.DELIVERED];
      default:
        return [];
    }
  }
}

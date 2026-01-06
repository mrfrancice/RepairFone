import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsOptional, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { Review } from './entities/review.entity';
import { RequestsService } from '../requests/requests.service';
import { RepairersService } from '../users/repairers.service';
import { RequestStatus } from '../requests/entities/repair-request.entity';

export class CreateReviewDto {
  @IsString()
  requestId: string;

  @IsNumber()
  @Type(() => Number)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;
}

export class ReviewFilters {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly requestsService: RequestsService,
    private readonly repairersService: RepairersService,
  ) {}

  async createReview(clientId: string, dto: CreateReviewDto): Promise<Review> {
    // Verify request exists and is completed
    const request = await this.requestsService.findOne(dto.requestId);

    if (request.clientId !== clientId) {
      throw new ForbiddenException('Vous ne pouvez noter que vos propres demandes');
    }

    if (request.status !== RequestStatus.ACCEPTED) {
      throw new BadRequestException('Vous ne pouvez noter que les demandes acceptées');
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
}

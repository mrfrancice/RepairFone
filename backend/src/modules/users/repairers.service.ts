import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { RepairerProfile, VerificationStatus } from './entities/repairer-profile.entity';

/**
 * CODE-010: Typed interface for repairer search results
 */
export interface RepairerSearchResultItem {
  id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  avatarUrl?: string;
  distance?: number;
  repairerProfile: {
    id: string;
    businessName?: string;
    description?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    rating: number;
    reviewCount: number;
    isAvailable: boolean;
    specialties: string[];
    isVerified: boolean;
    responseTime: number;
    completedRepairs: number;
    yearsOfExperience: number;
    acceptanceRate: number;
    serviceRadius: number;
  };
}

export interface RepairerSearchResponse {
  data: RepairerSearchResultItem[];
  total: number;
  page: number;
  limit: number;
}

export class SearchRepairersParams {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radius?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  radiusKm?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minRating?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  serviceTypeId?: string;

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
export class RepairersService {
  constructor(
    @InjectRepository(RepairerProfile)
    private readonly repairerRepository: Repository<RepairerProfile>,
  ) {}

  async findById(id: string): Promise<RepairerProfile> {
    const repairer = await this.repairerRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!repairer) {
      throw new NotFoundException('Réparateur non trouvé');
    }
    return repairer;
  }

  async findByIdOrNull(id: string): Promise<RepairerProfile | null> {
    return this.repairerRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string): Promise<RepairerProfile | null> {
    return this.repairerRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async search(params: SearchRepairersParams): Promise<RepairerSearchResponse> {
    const {
      latitude,
      longitude,
      radius,
      radiusKm,
      city,
      minRating = 0,
      isAvailable,
      page = 1,
      limit = 20,
    } = params;
    const searchRadius = radiusKm ?? radius ?? 10;

    const queryBuilder = this.repairerRepository
      .createQueryBuilder('repairer')
      .leftJoinAndSelect('repairer.user', 'user')
      .where('repairer.verificationStatus NOT IN (:...excludedStatuses)', {
        excludedStatuses: [VerificationStatus.REJECTED, VerificationStatus.SUSPENDED],
      })
      .andWhere('repairer.isBlocked = false')
      .andWhere('repairer.ratingAvg >= :minRating', { minRating });

    if (isAvailable === true) {
      queryBuilder.andWhere('repairer.isAvailable = true');
    }

    if (city) {
      queryBuilder.andWhere('repairer.city = :city', { city });
    }

    // Use bounding box filter for geolocation (simpler and faster)
    // Include repairers without coordinates OR within the search radius
    if (latitude && longitude) {
      // Approximate bounding box (1 degree ≈ 111 km)
      const latDelta = searchRadius / 111;
      const lngDelta = searchRadius / (111 * Math.cos(latitude * Math.PI / 180));

      queryBuilder.andWhere(
        '(repairer.latitude IS NULL OR repairer.longitude IS NULL OR ' +
        '(repairer.latitude BETWEEN :minLat AND :maxLat AND repairer.longitude BETWEEN :minLng AND :maxLng))',
        {
          minLat: latitude - latDelta,
          maxLat: latitude + latDelta,
          minLng: longitude - lngDelta,
          maxLng: longitude + lngDelta,
        },
      );
    }

    // Ranking : prioriser les réparateurs avec avis (ratingCount > 0),
    // puis trier par note décroissante. Évite que des comptes neufs
    // sans aucun avis polluent le haut du classement à égalité.
    queryBuilder
      .addSelect('CASE WHEN repairer.ratingCount > 0 THEN 1 ELSE 0 END', 'has_reviews')
      .orderBy('has_reviews', 'DESC')
      .addOrderBy('repairer.ratingAvg', 'DESC')
      .addOrderBy('repairer.totalRepairs', 'DESC');

    const total = await queryBuilder.getCount();
    const profiles = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Calculate distance and transform to frontend format
    const data = profiles.map((profile) => {
      let distance: number | undefined;
      if (latitude && longitude && profile.latitude && profile.longitude) {
        distance = this.calculateDistance(
          latitude,
          longitude,
          Number(profile.latitude),
          Number(profile.longitude),
        );
      }

      return {
        id: profile.user?.id || profile.userId,
        firstName: profile.user?.firstName,
        lastName: profile.user?.lastName,
        phone: profile.user?.phone || '',
        avatarUrl: profile.user?.avatarUrl,
        distance,
        repairerProfile: {
          id: profile.id,
          businessName: profile.businessName,
          description: profile.description,
          address: profile.address,
          latitude: profile.latitude,
          longitude: profile.longitude,
          rating: Number(profile.ratingAvg) || 0,
          reviewCount: profile.ratingCount || 0,
          isAvailable: profile.isAvailable,
          specialties: [],
          isVerified: profile.verificationStatus === VerificationStatus.VERIFIED,
          responseTime: 15,
          completedRepairs: profile.totalRepairs || 0,
          yearsOfExperience: 0,
          acceptanceRate: profile.completionRate || 0,
          serviceRadius: profile.homeServiceRadiusKm || 10,
        },
      };
    });

    // Sort by distance if location provided (repairers without coordinates at the end)
    if (latitude && longitude) {
      data.sort((a, b) => {
        // Repairers with coordinates first, then by distance
        if (a.distance === undefined && b.distance === undefined) return 0;
        if (a.distance === undefined) return 1;
        if (b.distance === undefined) return -1;
        return a.distance - b.distance;
      });
    }

    return { data, total, page, limit };
  }

  // Haversine formula for distance calculation
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async create(userId: string, data: Partial<RepairerProfile>): Promise<RepairerProfile> {
    const repairer = this.repairerRepository.create({
      ...data,
      userId,
    });
    return this.repairerRepository.save(repairer);
  }

  async update(id: string, data: Partial<RepairerProfile>): Promise<RepairerProfile> {
    const repairer = await this.findById(id);
    Object.assign(repairer, data);
    return this.repairerRepository.save(repairer);
  }

  async toggleAvailability(id: string): Promise<RepairerProfile> {
    const repairer = await this.findById(id);
    repairer.isAvailable = !repairer.isAvailable;
    return this.repairerRepository.save(repairer);
  }

  async verify(id: string): Promise<RepairerProfile> {
    const repairer = await this.findById(id);
    repairer.verificationStatus = VerificationStatus.VERIFIED;
    repairer.verifiedAt = new Date();
    return this.repairerRepository.save(repairer);
  }

  async updateRating(repairerId: string, rating: number, reviewCount: number): Promise<void> {
    const roundedRating = Math.round(rating * 100) / 100;

    // Vérifier si le réparateur doit être bloqué (note cumulée <= -10)
    const shouldBlock = roundedRating <= -10;

    if (shouldBlock) {
      await this.repairerRepository.update(repairerId, {
        ratingAvg: roundedRating,
        ratingCount: reviewCount,
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: 'Note cumulée inférieure ou égale à -10',
      });
    } else {
      await this.repairerRepository.update(repairerId, {
        ratingAvg: roundedRating,
        ratingCount: reviewCount,
      });
    }
  }

  async blockRepairer(repairerId: string, reason: string): Promise<RepairerProfile> {
    const repairer = await this.findById(repairerId);
    repairer.isBlocked = true;
    repairer.blockedAt = new Date();
    repairer.blockedReason = reason;
    return this.repairerRepository.save(repairer);
  }

  async unblockRepairer(repairerId: string): Promise<RepairerProfile> {
    const repairer = await this.findById(repairerId);
    repairer.isBlocked = false;
    repairer.blockedAt = undefined;
    repairer.blockedReason = undefined;
    return this.repairerRepository.save(repairer);
  }
}

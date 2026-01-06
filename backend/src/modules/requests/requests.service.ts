import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { IsOptional, IsString, IsNumber, IsUUID, IsEnum, IsDateString, IsArray, IsIn } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { RepairRequest, RequestStatus, DeliveryMode } from './entities/repair-request.entity';
import { RequestStatusHistory } from './entities/request-status-history.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';

export class CreateRequestDto {
  @IsUUID()
  repairerId: string;

  @IsOptional()
  @IsUUID()
  deviceId?: string;

  @IsOptional()
  @IsUUID()
  serviceTypeId?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  preferredDate?: string;

  @IsOptional()
  @IsString()
  preferredTime?: string;

  @IsOptional()
  @IsNumber()
  clientLatitude?: number;

  @IsOptional()
  @IsNumber()
  clientLongitude?: number;

  @IsOptional()
  @IsString()
  clientAddress?: string;

  @IsOptional()
  @IsEnum(DeliveryMode)
  deliveryMode?: DeliveryMode;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsIn(['normal', 'express'])
  urgency?: 'normal' | 'express';
}

export class UpdateRequestStatusDto {
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;  // Motif de rejet (obligatoire si status = rejected)
}

export class RequestFilters {
  @IsOptional()
  status?: string | string[];

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
export class RequestsService {
  constructor(
    @InjectRepository(RepairRequest)
    private readonly requestRepository: Repository<RepairRequest>,
    @InjectRepository(RequestStatusHistory)
    private readonly statusHistoryRepository: Repository<RequestStatusHistory>,
    @InjectRepository(RepairerProfile)
    private readonly repairerProfileRepository: Repository<RepairerProfile>,
  ) {}

  async createRequest(clientId: string, dto: CreateRequestDto): Promise<RepairRequest> {
    // Générer un numéro de demande unique
    const requestNumber = await this.generateRequestNumber();

    // Résoudre le repairerId (peut être l'ID du profil ou l'ID de l'utilisateur)
    let repairerProfileId = dto.repairerId;

    // Vérifier si c'est un ID de profil existant
    let profile = await this.repairerProfileRepository.findOne({ where: { id: dto.repairerId } });

    // Si non trouvé, chercher par userId
    if (!profile) {
      profile = await this.repairerProfileRepository.findOne({ where: { userId: dto.repairerId } });
      if (profile) {
        repairerProfileId = profile.id;
      } else {
        throw new BadRequestException('Réparateur non trouvé');
      }
    }

    const request = this.requestRepository.create({
      requestNumber,
      clientId,
      repairerId: repairerProfileId,
      deviceId: dto.deviceId,
      serviceTypeId: dto.serviceTypeId,
      description: dto.description,
      preferredDate: dto.preferredDate ? new Date(dto.preferredDate) : undefined,
      preferredTime: dto.preferredTime,
      clientLatitude: dto.clientLatitude,
      clientLongitude: dto.clientLongitude,
      clientAddress: dto.clientAddress,
      deliveryMode: dto.deliveryMode || DeliveryMode.IN_SHOP,
      images: dto.images || [],
      urgency: dto.urgency || 'normal',
      status: RequestStatus.PENDING,
    });

    const savedRequest = await this.requestRepository.save(request);

    // Create initial status history
    await this.addStatusHistory(savedRequest.id, RequestStatus.PENDING, 'Demande créée', clientId);

    return this.findOne(savedRequest.id);
  }

  async findOne(id: string): Promise<any> {
    const request = await this.findOneEntity(id);
    // Transform to match frontend expected format
    return this.transformRequest(request);
  }

  // Internal method to get raw entity (for updates)
  private async findOneEntity(id: string): Promise<RepairRequest> {
    const request = await this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.client', 'client')
      .leftJoinAndSelect('request.repairer', 'repairer')
      .leftJoinAndSelect('repairer.user', 'repairerUser')
      .leftJoinAndSelect('request.device', 'device')
      .leftJoinAndSelect('request.serviceType', 'serviceType')
      .leftJoinAndSelect('request.statusHistory', 'statusHistory')
      .where('request.id = :id', { id })
      .getOne();

    if (!request) {
      throw new NotFoundException('Demande de réparation non trouvée');
    }

    return request;
  }

  private transformRequest(request: RepairRequest): any {
    const repairerProfile = request.repairer;
    const repairerUser = repairerProfile?.user;

    return {
      ...request,
      repairer: repairerProfile
        ? {
            id: repairerUser?.id || repairerProfile.userId,
            userId: repairerProfile.userId, // Keep userId for permission checks
            firstName: repairerUser?.firstName,
            lastName: repairerUser?.lastName,
            phone: repairerUser?.phone,
            avatarUrl: repairerUser?.avatarUrl,
            repairerProfile: {
              id: repairerProfile.id,
              businessName: repairerProfile.businessName,
              rating: Number(repairerProfile.ratingAvg) || 0,
              reviewCount: repairerProfile.ratingCount || 0,
              address: repairerProfile.address,
              latitude: repairerProfile.latitude,
              longitude: repairerProfile.longitude,
              isAvailable: repairerProfile.isAvailable,
            },
          }
        : null,
      client: request.client
        ? {
            id: request.client.id,
            firstName: request.client.firstName,
            lastName: request.client.lastName,
            phone: request.client.phone,
            avatarUrl: request.client.avatarUrl,
          }
        : null,
    };
  }

  async findByClient(clientId: string, filters: RequestFilters): Promise<{ data: any[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.repairer', 'repairer')
      .leftJoinAndSelect('repairer.user', 'repairerUser')
      .leftJoinAndSelect('request.device', 'device')
      .leftJoinAndSelect('request.serviceType', 'serviceType')
      .where('request.clientId = :clientId', { clientId });

    if (status) {
      // Handle comma-separated string or array
      const statuses = Array.isArray(status) ? status : status.split(',').map(s => s.trim());
      if (statuses.length > 1) {
        queryBuilder.andWhere('request.status IN (:...statuses)', { statuses });
      } else {
        queryBuilder.andWhere('request.status = :status', { status: statuses[0] });
      }
    }

    const [requests, total] = await queryBuilder
      .orderBy('request.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Transform data to match frontend expected format
    const data = requests.map((request) => this.transformRequestForClient(request));

    return { data, total };
  }

  private transformRequestForClient(request: RepairRequest): any {
    const repairerProfile = request.repairer;
    const repairerUser = repairerProfile?.user;

    return {
      ...request,
      repairer: repairerProfile
        ? {
            id: repairerUser?.id || repairerProfile.userId,
            firstName: repairerUser?.firstName,
            lastName: repairerUser?.lastName,
            phone: repairerUser?.phone,
            avatarUrl: repairerUser?.avatarUrl,
            repairerProfile: {
              id: repairerProfile.id,
              businessName: repairerProfile.businessName,
              rating: Number(repairerProfile.ratingAvg) || 0,
              reviewCount: repairerProfile.ratingCount || 0,
              address: repairerProfile.address,
              isAvailable: repairerProfile.isAvailable,
            },
          }
        : null,
    };
  }

  async findByRepairer(userId: string, filters: RequestFilters): Promise<{ data: any[]; total: number }> {
    const { status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.client', 'client')
      .leftJoinAndSelect('request.device', 'device')
      .leftJoinAndSelect('request.serviceType', 'serviceType')
      .leftJoinAndSelect('request.repairer', 'repairer')
      .where('repairer.userId = :userId', { userId });

    if (status) {
      // Handle comma-separated string or array
      const statuses = Array.isArray(status) ? status : status.split(',').map(s => s.trim());
      if (statuses.length > 1) {
        queryBuilder.andWhere('request.status IN (:...statuses)', { statuses });
      } else {
        queryBuilder.andWhere('request.status = :status', { status: statuses[0] });
      }
    }

    const [requests, total] = await queryBuilder
      .orderBy('request.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Transform data to match frontend expected format
    const data = requests.map((request) => this.transformRequestForRepairer(request));

    return { data, total };
  }

  private transformRequestForRepairer(request: RepairRequest): any {
    return {
      ...request,
      client: request.client
        ? {
            id: request.client.id,
            firstName: request.client.firstName,
            lastName: request.client.lastName,
            phone: request.client.phone,
            avatarUrl: request.client.avatarUrl,
          }
        : null,
    };
  }

  async updateStatus(
    id: string,
    userId: string,
    userRole: string,
    dto: UpdateRequestStatusDto,
  ): Promise<any> {
    const request = await this.findOneEntity(id);

    // Validate permission
    if (userRole === 'client' && request.clientId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette demande');
    }
    if (userRole === 'repairer' && request.repairer?.userId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette demande');
    }

    // Validate status transition
    this.validateStatusTransition(request.status, dto.status, userRole);

    // Vérifier que le motif de rejet est fourni si le statut est "rejected"
    if (dto.status === RequestStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('Le motif de rejet est obligatoire');
    }

    // Update request
    request.status = dto.status;

    // Gérer les dates et raisons selon le statut
    if (dto.status === RequestStatus.ACCEPTED) {
      request.acceptedAt = new Date();
    } else if (dto.status === RequestStatus.REJECTED) {
      request.rejectedAt = new Date();
      request.rejectionReason = dto.rejectionReason;
    } else if (dto.status === RequestStatus.COMPLETED) {
      request.completedAt = new Date();
    }

    await this.requestRepository.save(request);

    // Add status history
    await this.addStatusHistory(id, dto.status, dto.comment, userId);

    return this.findOne(id);
  }

  private validateStatusTransition(currentStatus: RequestStatus, newStatus: RequestStatus, userRole: string): void {
    // Seul le réparateur peut changer le statut d'une demande
    const validTransitions: Record<RequestStatus, { status: RequestStatus; roles: string[] }[]> = {
      [RequestStatus.PENDING]: [
        { status: RequestStatus.ACCEPTED, roles: ['repairer'] },
        { status: RequestStatus.REJECTED, roles: ['repairer'] },
      ],
      [RequestStatus.ACCEPTED]: [
        { status: RequestStatus.COMPLETED, roles: ['repairer'] },  // Réparation terminée
      ],
      [RequestStatus.REJECTED]: [],  // Statut final
      [RequestStatus.COMPLETED]: [
        { status: RequestStatus.DELIVERED, roles: ['repairer'] },  // Appareil livré
      ],
      [RequestStatus.DELIVERED]: [],  // Statut final
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    const transition = allowedTransitions.find(
      (t) => t.status === newStatus && t.roles.includes(userRole),
    );

    if (!transition) {
      throw new BadRequestException(
        `Transition de statut non autorisée: ${currentStatus} -> ${newStatus}`,
      );
    }
  }

  private async addStatusHistory(
    requestId: string,
    status: RequestStatus,
    comment: string | undefined,
    changedBy: string,
  ): Promise<void> {
    const history = this.statusHistoryRepository.create({
      requestId,
      status,
      comment,
      changedBy,
    });
    await this.statusHistoryRepository.save(history);
  }

  async getRequestStats(userId: string, role: string): Promise<{
    pending: number;
    accepted: number;
    rejected: number;
    completed: number;
    delivered: number;
    total: number;
  }> {
    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .select('request.status', 'status')
      .addSelect('COUNT(*)', 'count');

    if (role === 'client') {
      queryBuilder.where('request.clientId = :userId', { userId });
    } else if (role === 'repairer') {
      queryBuilder
        .leftJoin('request.repairer', 'repairer')
        .where('repairer.userId = :userId', { userId });
    }

    const results = await queryBuilder.groupBy('request.status').getRawMany();

    const stats = {
      pending: 0,
      accepted: 0,
      rejected: 0,
      completed: 0,
      delivered: 0,
      total: 0,
    };

    for (const result of results) {
      const count = parseInt(result.count, 10);
      stats.total += count;
      switch (result.status) {
        case RequestStatus.PENDING:
          stats.pending = count;
          break;
        case RequestStatus.ACCEPTED:
          stats.accepted = count;
          break;
        case RequestStatus.REJECTED:
          stats.rejected = count;
          break;
        case RequestStatus.COMPLETED:
          stats.completed = count;
          break;
        case RequestStatus.DELIVERED:
          stats.delivered = count;
          break;
      }
    }

    return stats;
  }

  private async generateRequestNumber(): Promise<string> {
    const prefix = 'RF';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // Compter les demandes du mois en cours pour générer un numéro séquentiel
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const count = await this.requestRepository
      .createQueryBuilder('request')
      .where('request.createdAt >= :start', { start: startOfMonth })
      .andWhere('request.createdAt <= :end', { end: endOfMonth })
      .getCount();

    const sequence = (count + 1).toString().padStart(4, '0');

    return `${prefix}${year}${month}${sequence}`;
  }
}

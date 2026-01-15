import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RepairRequest, RequestStatus, DeliveryMode } from './entities/repair-request.entity';
import { RequestStatusHistory } from './entities/request-status-history.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';
import { Payment, PaymentStatus } from '../payments/entities/payment.entity';
import { CreateRequestDto, UpdateRequestStatusDto, RequestFilters } from './dto';
import { RequestStatusChangedEvent, EventNames } from '../../common/events';
import {
  RequestResponse,
  ClientRequestResponse,
  RepairerRequestResponse,
  PaginatedRequestResponse,
} from './interfaces/request-response.interface';

// Re-export DTOs for backward compatibility
export { CreateRequestDto, UpdateRequestStatusDto, RequestFilters } from './dto';

@Injectable()
export class RequestsService {
  private readonly logger = new Logger(RequestsService.name);

  constructor(
    @InjectRepository(RepairRequest)
    private readonly requestRepository: Repository<RepairRequest>,
    @InjectRepository(RequestStatusHistory)
    private readonly statusHistoryRepository: Repository<RequestStatusHistory>,
    @InjectRepository(RepairerProfile)
    private readonly repairerProfileRepository: Repository<RepairerProfile>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataSource: DataSource,
  ) {}

  async createRequest(clientId: string, dto: CreateRequestDto): Promise<RequestResponse> {
    this.logger.log(`Creating repair request for client ${clientId} to repairer ${dto.repairerId}`);

    // Generate unique request number
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
    this.logger.log(`Request created: ${savedRequest.requestNumber} (${savedRequest.id})`);

    // Create initial status history
    await this.addStatusHistory(savedRequest.id, RequestStatus.PENDING, 'Demande creee', clientId);

    return this.findOne(savedRequest.id);
  }

  async findOne(id: string): Promise<RequestResponse> {
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

  private transformRequest(request: RepairRequest): RequestResponse {
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

  async findByClient(clientId: string, filters: RequestFilters): Promise<PaginatedRequestResponse<ClientRequestResponse>> {
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

  private transformRequestForClient(request: RepairRequest): ClientRequestResponse {
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

  async findByRepairer(userId: string, filters: RequestFilters): Promise<PaginatedRequestResponse<RepairerRequestResponse>> {
    const { status, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Trouver le profil du réparateur par userId
    const repairerProfile = await this.repairerProfileRepository.findOne({
      where: { userId },
    });

    if (!repairerProfile) {
      return { data: [], total: 0 };
    }

    const queryBuilder = this.requestRepository
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.client', 'client')
      .leftJoinAndSelect('request.device', 'device')
      .leftJoinAndSelect('request.serviceType', 'serviceType')
      .leftJoinAndSelect('request.repairer', 'repairer')
      .where('request.repairerId = :repairerId', { repairerId: repairerProfile.id });

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

  private transformRequestForRepairer(request: RepairRequest): RepairerRequestResponse {
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
  ): Promise<RequestResponse> {
    this.logger.log(`Status update request: ${id} -> ${dto.status} by ${userRole} ${userId}`);
    const request = await this.findOneEntity(id);

    // Validate permission
    if (userRole === 'client' && request.clientId !== userId) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette demande');
    }

    // BIZ-102: Vérification correcte que le réparateur est assigné à cette request
    if (userRole === 'repairer') {
      const repairerProfile = await this.repairerProfileRepository.findOne({
        where: { userId },
      });

      if (!repairerProfile) {
        throw new ForbiddenException('Profil réparateur non trouvé');
      }

      // Vérifier que ce réparateur est bien assigné à cette request
      if (!request.repairerId || request.repairerId !== repairerProfile.id) {
        throw new ForbiddenException('Vous n\'êtes pas assigné à cette demande');
      }
    }

    // Validate status transition
    this.validateStatusTransition(request.status, dto.status, userRole);

    // Vérifier que le motif de rejet est fourni si le statut est "rejected"
    if (dto.status === RequestStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('Le motif de rejet est obligatoire');
    }

    // Vérifier qu'un paiement a été effectué avant de passer en IN_PROGRESS
    if (dto.status === RequestStatus.IN_PROGRESS && request.status === RequestStatus.ACCEPTED) {
      const payment = await this.paymentRepository.findOne({
        where: {
          requestId: id,
          status: PaymentStatus.COMPLETED,
        },
      });

      if (!payment) {
        throw new BadRequestException(
          'Un paiement doit etre effectue avant de demarrer la reparation'
        );
      }
      this.logger.log(`Payment verified for request ${request.requestNumber}: ${payment.paymentNumber}`);
    }

    // Store previous status for event
    const previousStatus = request.status;

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
    this.logger.log(`Request ${request.requestNumber} status updated: ${previousStatus} -> ${dto.status}`);

    // Add status history
    await this.addStatusHistory(id, dto.status, dto.comment, userId);

    // Emit request status changed event
    const statusChangedEvent = new RequestStatusChangedEvent(
      request.id,
      request.requestNumber,
      request.clientId,
      request.repairerId,
      previousStatus,
      dto.status,
      userId,
      dto.comment,
    );
    this.eventEmitter.emit(EventNames.REQUEST_STATUS_CHANGED, statusChangedEvent);

    return this.findOne(id);
  }

  private validateStatusTransition(currentStatus: RequestStatus, newStatus: RequestStatus, userRole: string): void {
    // Seul le réparateur peut changer le statut d'une demande
    const validTransitions: Record<RequestStatus, { status: RequestStatus; roles: string[] }[]> = {
      [RequestStatus.PENDING]: [
        { status: RequestStatus.ACCEPTED, roles: ['repairer'] },
        { status: RequestStatus.REJECTED, roles: ['repairer'] },
        { status: RequestStatus.CANCELLED, roles: ['client', 'admin'] },
      ],
      [RequestStatus.ACCEPTED]: [
        { status: RequestStatus.IN_PROGRESS, roles: ['repairer'] },
        // BIZ-111: Suppression transition directe ACCEPTED -> COMPLETED (doit passer par IN_PROGRESS)
        { status: RequestStatus.CANCELLED, roles: ['client', 'admin'] },
        { status: RequestStatus.DISPUTED, roles: ['client'] },
      ],
      [RequestStatus.IN_PROGRESS]: [
        { status: RequestStatus.AWAITING_PARTS, roles: ['repairer'] },
        { status: RequestStatus.COMPLETED, roles: ['repairer'] },
        { status: RequestStatus.DISPUTED, roles: ['client'] },
      ],
      [RequestStatus.AWAITING_PARTS]: [
        { status: RequestStatus.IN_PROGRESS, roles: ['repairer'] },
        { status: RequestStatus.COMPLETED, roles: ['repairer'] },
        { status: RequestStatus.DISPUTED, roles: ['client'] },
      ],
      [RequestStatus.REJECTED]: [],  // Statut final
      [RequestStatus.COMPLETED]: [
        { status: RequestStatus.DELIVERED, roles: ['repairer'] },
        { status: RequestStatus.DISPUTED, roles: ['client'] },
      ],
      [RequestStatus.DELIVERED]: [
        { status: RequestStatus.DISPUTED, roles: ['client'] },
      ],
      [RequestStatus.CANCELLED]: [],  // Statut final
      // BIZ-112: DISPUTED est un statut géré par disputes.service.ts
      // Les transitions sont effectuées lors de la résolution du litige (BIZ-105)
      [RequestStatus.DISPUTED]: [],
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
      // Trouver le profil du réparateur par userId
      const repairerProfile = await this.repairerProfileRepository.findOne({
        where: { userId },
      });

      if (!repairerProfile) {
        return {
          pending: 0,
          accepted: 0,
          rejected: 0,
          completed: 0,
          delivered: 0,
          total: 0,
        };
      }

      queryBuilder.where('request.repairerId = :repairerId', { repairerId: repairerProfile.id });
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


  /**
   * BIZ-012: Generate unique request number using PostgreSQL sequence
   *
   * Uses database sequence for thread-safe, unique request number generation.
   * Format: RF{YY}{MM}{SEQ} where SEQ is a 4-digit padded sequence number.
   *
   * Benefits over COUNT-based approach:
   * 1. Thread-safe: No race conditions under high concurrency
   * 2. Guaranteed unique: Sequence values are never reused
   * 3. Performance: Single query vs. counting records
   * 4. Reliability: Numbers persist even if requests are deleted
   */
  private async generateRequestNumber(): Promise<string> {
    const prefix = 'RF';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');

    // BIZ-012: Use PostgreSQL sequence for thread-safe number generation
    const result = await this.dataSource.query(
      "SELECT nextval('request_number_seq') as seq_value"
    );

    const sequenceValue = result[0]?.seq_value || 1;
    const sequence = sequenceValue.toString().padStart(4, '0');

    return prefix + year + month + sequence;
  }
}

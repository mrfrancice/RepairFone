import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IsOptional, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Dispute, DisputeReason, DisputeStatus, DisputeResolution } from './entities/dispute.entity';
import { DisputeCreatedEvent, DisputeResolvedEvent, EventNames } from '../../common/events';
import { DisputeMessage, DisputeMessageSenderType } from './entities/dispute-message.entity';
import { RepairRequest, RequestStatus } from '../requests/entities/repair-request.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';
import { UserRole } from '../users/entities/user.entity';

export class CreateDisputeDto {
  requestId: string;
  reason: DisputeReason;
  description: string;
  evidencePhotos?: string[];
}

export class AddMessageDto {
  message: string;
  attachments?: string[];
}

export class DisputeFilters {
  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class ResolveDisputeDto {
  resolution: DisputeResolution;
  notes?: string;
  refundAmount?: number;
}

@Injectable()
export class DisputesService {
  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    @InjectRepository(DisputeMessage)
    private readonly messageRepo: Repository<DisputeMessage>,
    @InjectRepository(RepairRequest)
    private readonly requestRepo: Repository<RepairRequest>,
    @InjectRepository(RepairerProfile)
    private readonly repairerRepo: Repository<RepairerProfile>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(clientId: string, dto: CreateDisputeDto): Promise<Dispute> {
    const request = await this.requestRepo.findOne({
      where: { id: dto.requestId },
    });

    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }

    if (request.clientId !== clientId) {
      throw new ForbiddenException('Vous ne pouvez pas créer un litige pour cette demande');
    }

    // Check if dispute already exists
    const existingDispute = await this.disputeRepo.findOne({
      where: { requestId: dto.requestId },
    });

    if (existingDispute) {
      throw new BadRequestException('Un litige existe déjà pour cette demande');
    }

    // BIZ-103: Vérifier qu'un réparateur est assigné avant de créer le litige
    if (!request.repairerId) {
      throw new BadRequestException(
        'Impossible de créer un litige: aucun réparateur n\'est assigné à cette demande'
      );
    }

    const dispute = this.disputeRepo.create({
      requestId: dto.requestId,
      clientId,
      repairerId: request.repairerId!,
      reason: dto.reason,
      description: dto.description,
      evidencePhotos: dto.evidencePhotos || [],
      status: DisputeStatus.OPEN,
    });

    const savedDispute = await this.disputeRepo.save(dispute);

    // BIZ-108: Émettre événement de création de litige
    const disputeCreatedEvent = new DisputeCreatedEvent(
      savedDispute.id,
      dto.requestId,
      clientId,
      request.repairerId!,
      dto.reason,
      dto.description,
    );
    this.eventEmitter.emit(EventNames.DISPUTE_CREATED, disputeCreatedEvent);

    return this.findOne(savedDispute.id, clientId, UserRole.CLIENT);
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<Dispute> {
    const dispute = await this.disputeRepo.findOne({
      where: { id },
      relations: ['client', 'repairer', 'repairer.user', 'request', 'request.device', 'request.serviceType', 'messages', 'messages.sender'],
    });

    if (!dispute) {
      throw new NotFoundException('Litige non trouvé');
    }

    // Check access
    const hasAccess = await this.hasDisputeAccess(dispute, userId, userRole);
    if (!hasAccess) {
      throw new ForbiddenException('Accès non autorisé à ce litige');
    }

    return dispute;
  }

  async findByRequest(requestId: string): Promise<Dispute | null> {
    return this.disputeRepo.findOne({
      where: { requestId },
      relations: ['client', 'repairer', 'repairer.user', 'request'],
    });
  }

  async findByUser(userId: string, userRole: UserRole, filters: DisputeFilters): Promise<{ data: Dispute[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let where: FindOptionsWhere<Dispute>;

    if (userRole === UserRole.REPAIRER) {
      const repairerProfile = await this.repairerRepo.findOne({
        where: { userId },
      });
      if (!repairerProfile) {
        return { data: [], total: 0 };
      }
      where = { repairerId: repairerProfile.id };
    } else {
      where = { clientId: userId };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [data, total] = await this.disputeRepo.findAndCount({
      where,
      relations: ['client', 'repairer', 'repairer.user', 'request', 'request.device', 'request.serviceType'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  // ==========================================
  // ADMIN
  // ==========================================

  async findAllForAdmin(params: {
    status?: DisputeStatus | 'all';
    reason?: DisputeReason | 'all';
    search?: string;
    page?: number;
    limit?: number;
    sort?: 'createdAt' | 'status' | 'resolvedAt';
    order?: 'asc' | 'desc';
  }): Promise<{ data: Dispute[]; total: number }> {
    const {
      status,
      reason,
      search,
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
    } = params;

    const qb = this.disputeRepo
      .createQueryBuilder('dispute')
      .leftJoinAndSelect('dispute.client', 'client')
      .leftJoinAndSelect('dispute.repairer', 'repairer')
      .leftJoinAndSelect('repairer.user', 'repairerUser')
      .leftJoinAndSelect('dispute.request', 'request')
      .leftJoinAndSelect('request.device', 'device');

    if (status && status !== 'all') {
      qb.andWhere('dispute.status = :status', { status });
    }
    if (reason && reason !== 'all') {
      qb.andWhere('dispute.reason = :reason', { reason });
    }
    if (search) {
      qb.andWhere(
        '(client.firstName ILIKE :search OR client.lastName ILIKE :search OR client.phone ILIKE :search OR dispute.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const sortColumnMap: Record<string, string> = {
      createdAt: 'dispute.createdAt',
      status: 'dispute.status',
      resolvedAt: 'dispute.resolvedAt',
    };
    const sortColumn = sortColumnMap[sort] ?? 'dispute.createdAt';
    qb.orderBy(sortColumn, order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC', 'NULLS LAST');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async findOneForAdmin(id: string): Promise<Dispute> {
    const dispute = await this.disputeRepo.findOne({
      where: { id },
      relations: [
        'client',
        'repairer',
        'repairer.user',
        'request',
        'request.device',
        'request.serviceType',
        'messages',
        'messages.sender',
      ],
    });
    if (!dispute) {
      throw new NotFoundException('Litige non trouvé');
    }
    return dispute;
  }

  async getAdminStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    avgResolutionDays: number | null;
    totalRefundedAmount: number;
  }> {
    const total = await this.disputeRepo.count();

    const statusRows = await this.disputeRepo
      .createQueryBuilder('d')
      .select('d.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('d.status')
      .getRawMany<{ status: string; count: string }>();

    const byStatus: Record<string, number> = {};
    for (const row of statusRows) {
      byStatus[row.status] = Number(row.count);
    }

    const resolutionRow = await this.disputeRepo
      .createQueryBuilder('d')
      .select(
        'AVG(EXTRACT(EPOCH FROM (d.resolvedAt - d.createdAt)) / 86400)',
        'avgDays',
      )
      .where('d.resolvedAt IS NOT NULL')
      .getRawOne<{ avgDays: string | null }>();

    const refundRow = await this.disputeRepo
      .createQueryBuilder('d')
      .select('COALESCE(SUM(d.refundAmount), 0)', 'total')
      .where('d.refundAmount IS NOT NULL')
      .getRawOne<{ total: string }>();

    return {
      total,
      byStatus,
      avgResolutionDays: resolutionRow?.avgDays != null ? Number(resolutionRow.avgDays) : null,
      totalRefundedAmount: Number(refundRow?.total ?? 0),
    };
  }

  async addMessage(disputeId: string, userId: string, userRole: UserRole, dto: AddMessageDto): Promise<DisputeMessage> {
    const dispute = await this.findOne(disputeId, userId, userRole);

    let senderType: DisputeMessageSenderType;
    if (userRole === UserRole.REPAIRER) {
      senderType = DisputeMessageSenderType.REPAIRER;
    } else if (userRole === UserRole.ADMIN) {
      senderType = DisputeMessageSenderType.SUPPORT;
    } else {
      senderType = DisputeMessageSenderType.CLIENT;
    }

    const message = this.messageRepo.create({
      disputeId: dispute.id,
      senderId: userId,
      senderType,
      message: dto.message,
      attachments: dto.attachments || [],
    });

    return this.messageRepo.save(message);
  }

  async addEvidence(disputeId: string, clientId: string, photos: string[]): Promise<Dispute> {
    const dispute = await this.disputeRepo.findOne({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Litige non trouvé');
    }

    if (dispute.clientId !== clientId) {
      throw new ForbiddenException('Vous ne pouvez pas ajouter des preuves à ce litige');
    }

    dispute.evidencePhotos = [...dispute.evidencePhotos, ...photos];
    await this.disputeRepo.save(dispute);

    return this.findOne(disputeId, clientId, UserRole.CLIENT);
  }

  async cancel(disputeId: string, clientId: string): Promise<Dispute> {
    const dispute = await this.disputeRepo.findOne({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Litige non trouvé');
    }

    if (dispute.clientId !== clientId) {
      throw new ForbiddenException('Vous ne pouvez pas annuler ce litige');
    }

    if (dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Ce litige ne peut plus être annulé');
    }

    dispute.status = DisputeStatus.CLOSED;
    await this.disputeRepo.save(dispute);

    return this.findOne(disputeId, clientId, UserRole.CLIENT);
  }

  async resolve(disputeId: string, adminId: string, dto: ResolveDisputeDto): Promise<Dispute> {
    const dispute = await this.disputeRepo.findOne({
      where: { id: disputeId },
    });

    if (!dispute) {
      throw new NotFoundException('Litige non trouvé');
    }

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
      throw new BadRequestException('Ce litige est déjà résolu');
    }

    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolution = dto.resolution;
    dispute.resolutionNotes = dto.notes;
    dispute.refundAmount = dto.refundAmount;
    dispute.resolvedAt = new Date();
    dispute.resolvedBy = adminId;

    await this.disputeRepo.save(dispute);

    // BIZ-105: Mettre à jour le statut de la Request selon la résolution
    let newRequestStatus: RequestStatus;
    switch (dto.resolution) {
      case DisputeResolution.REFUND_FULL:
      case DisputeResolution.REFUND_PARTIAL:
        newRequestStatus = RequestStatus.CANCELLED;
        break;
      case DisputeResolution.REDO_REPAIR:
        newRequestStatus = RequestStatus.IN_PROGRESS;
        break;
      default:
        newRequestStatus = RequestStatus.COMPLETED;
    }

    await this.requestRepo.update(dispute.requestId, {
      status: newRequestStatus,
    });

    // BIZ-108: Émettre événement de résolution de litige
    const disputeResolvedEvent = new DisputeResolvedEvent(
      dispute.id,
      dispute.requestId,
      dispute.clientId,
      dispute.repairerId,
      dto.resolution,
      dto.refundAmount,
      dto.notes,
    );
    this.eventEmitter.emit(EventNames.DISPUTE_RESOLVED, disputeResolvedEvent);

    return this.findOne(disputeId, adminId, UserRole.ADMIN);
  }

  private async hasDisputeAccess(dispute: Dispute, userId: string, userRole: UserRole): Promise<boolean> {
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    if (dispute.clientId === userId) {
      return true;
    }

    if (userRole === UserRole.REPAIRER) {
      const repairerProfile = await this.repairerRepo.findOne({
        where: { userId },
      });
      if (repairerProfile && dispute.repairerId === repairerProfile.id) {
        return true;
      }
    }

    return false;
  }
}

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Dispute, DisputeReason, DisputeStatus, DisputeResolution } from './entities/dispute.entity';
import { DisputeMessage, DisputeMessageSenderType } from './entities/dispute-message.entity';
import { RepairRequest } from '../requests/entities/repair-request.entity';
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
  status?: DisputeStatus;
  page?: number;
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

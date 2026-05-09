import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { IsOptional, IsEnum, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Expert, ConseilType, ConseilFormat } from './entities/expert.entity';
import { ConseilSession, ConseilSessionStatus } from './entities/conseil-session.entity';
import { ConseilMessage, ConseilMessageSenderType } from './entities/conseil-message.entity';
import { User, UserRole } from '../users/entities/user.entity';

export class CreateSessionDto {
  expertId: string;
  type: ConseilType;
  format: ConseilFormat;
  subject?: string;
  description?: string;
}

export class SessionFilters {
  @IsOptional()
  @IsEnum(ConseilSessionStatus)
  status?: ConseilSessionStatus;

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

export class ExpertFilters {
  @IsOptional()
  @IsEnum(ConseilType)
  type?: ConseilType;

  @IsOptional()
  @IsEnum(ConseilFormat)
  format?: ConseilFormat;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isAvailable?: boolean;

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

// DTO plat exposé par l'API : champs utilisateur aplatis,
// montants/notes castés en number (Postgres DECIMAL sort en string par défaut).
export interface ExpertDto {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  bio?: string;
  specialties: string[];
  conseilTypes: ConseilType[];
  conseilFormats: ConseilFormat[];
  rating: number;
  reviewCount: number;
  responseTime: number;
  pricePerSession: number;
  currency: string;
  yearsOfExperience: number;
  totalSessions: number;
  isAvailable: boolean;
  isVerified: boolean;
}

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined) return fallback;
  const n = typeof value === 'number' ? value : parseFloat(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapExpertToDto(expert: Expert): ExpertDto {
  return {
    id: expert.id,
    firstName: expert.user?.firstName ?? '',
    lastName: expert.user?.lastName ?? '',
    avatarUrl: expert.user?.avatarUrl ?? null,
    bio: expert.bio,
    specialties: expert.specialties ?? [],
    conseilTypes: expert.conseilTypes ?? [],
    conseilFormats: expert.conseilFormats ?? [],
    rating: toNumber(expert.ratingAvg, 0),
    reviewCount: expert.ratingCount ?? 0,
    responseTime: expert.responseTime ?? 0,
    pricePerSession: toNumber(expert.pricePerSession, 0),
    currency: expert.currency ?? 'XOF',
    yearsOfExperience: expert.yearsOfExperience ?? 0,
    totalSessions: expert.totalSessions ?? 0,
    isAvailable: expert.isAvailable ?? false,
    isVerified: expert.isVerified ?? false,
  };
}

@Injectable()
export class ConseilsService {
  constructor(
    @InjectRepository(Expert)
    private readonly expertRepo: Repository<Expert>,
    @InjectRepository(ConseilSession)
    private readonly sessionRepo: Repository<ConseilSession>,
    @InjectRepository(ConseilMessage)
    private readonly messageRepo: Repository<ConseilMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private generateSessionNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `CON-${timestamp}-${random}`;
  }

  async getExperts(filters: ExpertFilters): Promise<{ data: ExpertDto[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const queryBuilder = this.expertRepo
      .createQueryBuilder('expert')
      .leftJoinAndSelect('expert.user', 'user')
      .where('1 = 1');

    if (filters.isAvailable !== undefined) {
      queryBuilder.andWhere('expert.isAvailable = :isAvailable', { isAvailable: filters.isAvailable });
    }

    if (filters.type) {
      queryBuilder.andWhere(':type = ANY(expert.conseilTypes)', { type: filters.type });
    }

    if (filters.format) {
      queryBuilder.andWhere(':format = ANY(expert.conseilFormats)', { format: filters.format });
    }

    queryBuilder
      .orderBy('expert.ratingAvg', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data: data.map(mapExpertToDto), total };
  }

  async getExpert(id: string): Promise<ExpertDto> {
    const expert = await this.findExpertEntity(id);
    return mapExpertToDto(expert);
  }

  // Récupère l'entité brute pour les usages internes (createSession, etc.).
  private async findExpertEntity(id: string): Promise<Expert> {
    const expert = await this.expertRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!expert) {
      throw new NotFoundException('Expert non trouvé');
    }

    return expert;
  }

  async createSession(clientId: string, dto: CreateSessionDto): Promise<ConseilSession> {
    const expert = await this.findExpertEntity(dto.expertId);

    if (!expert.isAvailable) {
      throw new BadRequestException('Cet expert n\'est pas disponible');
    }

    if (!expert.conseilTypes.includes(dto.type)) {
      throw new BadRequestException('Cet expert ne propose pas ce type de conseil');
    }

    if (!expert.conseilFormats.includes(dto.format)) {
      throw new BadRequestException('Cet expert ne propose pas ce format de conseil');
    }

    const session = this.sessionRepo.create({
      sessionNumber: this.generateSessionNumber(),
      clientId,
      expertId: expert.id,
      type: dto.type,
      format: dto.format,
      subject: dto.subject,
      description: dto.description,
      price: expert.pricePerSession,
      status: ConseilSessionStatus.PENDING,
    });

    await this.sessionRepo.save(session);

    return this.getSession(session.id, clientId, UserRole.CLIENT);
  }

  async getSession(id: string, userId: string, userRole: UserRole): Promise<ConseilSession> {
    const session = await this.sessionRepo.findOne({
      where: { id },
      relations: ['client', 'expert', 'expert.user'],
    });

    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }

    const hasAccess = await this.hasSessionAccess(session, userId, userRole);
    if (!hasAccess) {
      throw new ForbiddenException('Accès non autorisé à cette session');
    }

    return session;
  }

  async getMySessions(userId: string, userRole: UserRole, filters: SessionFilters): Promise<{ data: ConseilSession[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let where: FindOptionsWhere<ConseilSession>;

    // Check if user is an expert
    const expert = await this.expertRepo.findOne({ where: { userId } });

    if (expert) {
      where = { expertId: expert.id };
    } else {
      where = { clientId: userId };
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [data, total] = await this.sessionRepo.findAndCount({
      where,
      relations: ['client', 'expert', 'expert.user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async acceptSession(sessionId: string, expertId: string): Promise<ConseilSession> {
    const expert = await this.expertRepo.findOne({ where: { userId: expertId } });
    if (!expert) {
      throw new ForbiddenException('Vous n\'êtes pas un expert');
    }

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }

    if (session.expertId !== expert.id) {
      throw new ForbiddenException('Cette session n\'est pas pour vous');
    }

    if (session.status !== ConseilSessionStatus.PENDING) {
      throw new BadRequestException('Cette session ne peut plus être acceptée');
    }

    session.status = ConseilSessionStatus.ACCEPTED;
    session.acceptedAt = new Date();

    await this.sessionRepo.save(session);

    return this.getSession(sessionId, expertId, UserRole.REPAIRER);
  }

  async startSession(sessionId: string, expertId: string): Promise<ConseilSession> {
    const expert = await this.expertRepo.findOne({ where: { userId: expertId } });
    if (!expert) {
      throw new ForbiddenException('Vous n\'êtes pas un expert');
    }

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }

    if (session.expertId !== expert.id) {
      throw new ForbiddenException('Cette session n\'est pas pour vous');
    }

    if (session.status !== ConseilSessionStatus.ACCEPTED) {
      throw new BadRequestException('Cette session ne peut pas être démarrée');
    }

    session.status = ConseilSessionStatus.IN_PROGRESS;
    session.startedAt = new Date();

    await this.sessionRepo.save(session);

    return this.getSession(sessionId, expertId, UserRole.REPAIRER);
  }

  async completeSession(sessionId: string, expertId: string): Promise<ConseilSession> {
    const expert = await this.expertRepo.findOne({ where: { userId: expertId } });
    if (!expert) {
      throw new ForbiddenException('Vous n\'êtes pas un expert');
    }

    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }

    if (session.expertId !== expert.id) {
      throw new ForbiddenException('Cette session n\'est pas pour vous');
    }

    if (session.status !== ConseilSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Cette session ne peut pas être terminée');
    }

    session.status = ConseilSessionStatus.COMPLETED;
    session.endedAt = new Date();

    if (session.startedAt) {
      session.durationMinutes = Math.round(
        (session.endedAt.getTime() - session.startedAt.getTime()) / 60000,
      );
    }

    await this.sessionRepo.save(session);

    // Update expert stats
    expert.totalSessions += 1;
    await this.expertRepo.save(expert);

    return this.getSession(sessionId, expertId, UserRole.REPAIRER);
  }

  async rateSession(sessionId: string, clientId: string, rating: number, comment?: string): Promise<ConseilSession> {
    const session = await this.sessionRepo.findOne({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session non trouvée');
    }

    if (session.clientId !== clientId) {
      throw new ForbiddenException('Vous ne pouvez pas noter cette session');
    }

    if (session.status !== ConseilSessionStatus.COMPLETED) {
      throw new BadRequestException('Cette session n\'est pas terminée');
    }

    if (session.rating) {
      throw new BadRequestException('Cette session a déjà été notée');
    }

    session.rating = rating;
    session.ratingComment = comment;
    session.ratedAt = new Date();

    await this.sessionRepo.save(session);

    // Update expert rating
    const expert = await this.expertRepo.findOne({
      where: { id: session.expertId },
    });

    if (expert) {
      const newCount = expert.ratingCount + 1;
      const newAvg =
        (Number(expert.ratingAvg) * expert.ratingCount + rating) / newCount;
      expert.ratingAvg = Math.round(newAvg * 100) / 100;
      expert.ratingCount = newCount;
      await this.expertRepo.save(expert);
    }

    return this.getSession(sessionId, clientId, UserRole.CLIENT);
  }

  async getMessages(sessionId: string, userId: string, userRole: UserRole): Promise<ConseilMessage[]> {
    const session = await this.getSession(sessionId, userId, userRole);

    return this.messageRepo.find({
      where: { sessionId: session.id },
      relations: ['sender'],
      order: { createdAt: 'ASC' },
    });
  }

  async sendMessage(sessionId: string, userId: string, userRole: UserRole, content: string, attachments?: string[]): Promise<ConseilMessage> {
    const session = await this.getSession(sessionId, userId, userRole);

    if (session.status !== ConseilSessionStatus.IN_PROGRESS && session.status !== ConseilSessionStatus.ACCEPTED) {
      throw new BadRequestException('Cette session n\'est pas active');
    }

    const expert = await this.expertRepo.findOne({ where: { userId } });
    const senderType = expert ? ConseilMessageSenderType.EXPERT : ConseilMessageSenderType.CLIENT;

    const message = this.messageRepo.create({
      sessionId: session.id,
      senderId: userId,
      senderType,
      content,
      attachments: attachments || [],
    });

    return this.messageRepo.save(message);
  }

  private async hasSessionAccess(session: ConseilSession, userId: string, userRole: UserRole): Promise<boolean> {
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    if (session.clientId === userId) {
      return true;
    }

    const expert = await this.expertRepo.findOne({ where: { userId } });
    if (expert && session.expertId === expert.id) {
      return true;
    }

    return false;
  }
}

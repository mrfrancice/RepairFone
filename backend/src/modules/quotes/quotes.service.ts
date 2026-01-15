import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Quote, QuoteStatus, QuotePart } from './entities/quote.entity';
import { RepairRequest, RequestStatus } from '../requests/entities/repair-request.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';
import { CreateQuoteDto, UpdateQuoteDto, QuoteFilters } from './dto';
import { QuoteAcceptedEvent, QuoteCreatedEvent, EventNames } from '../../common/events';

// Re-export DTOs for backward compatibility
export { CreateQuotePartDto, CreateQuoteDto, UpdateQuoteDto, QuoteFilters } from './dto';

@Injectable()
export class QuotesService {
  private readonly logger = new Logger(QuotesService.name);

  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepo: Repository<Quote>,
    @InjectRepository(RepairRequest)
    private readonly requestRepo: Repository<RepairRequest>,
    @InjectRepository(RepairerProfile)
    private readonly repairerRepo: Repository<RepairerProfile>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createQuote(repairerId: string, dto: CreateQuoteDto): Promise<Quote> {
    this.logger.log(`Creating quote for request ${dto.requestId} by repairer ${repairerId}`);

    const request = await this.requestRepo.findOne({
      where: { id: dto.requestId },
      relations: ['repairer'],
    });

    if (!request) {
      this.logger.warn(`Quote creation failed: request ${dto.requestId} not found`);
      throw new NotFoundException('Demande non trouvee');
    }

    // Check if repairer profile exists
    const repairerProfile = await this.repairerRepo.findOne({
      where: { userId: repairerId },
    });

    if (!repairerProfile) {
      throw new ForbiddenException('Profil réparateur non trouvé');
    }

    // BIZ-109: Vérifier que le réparateur peut créer un devis sur cette request
    // Il peut créer un devis si: pas de réparateur assigné OU c'est lui qui est assigné
    if (request.repairerId && request.repairerId !== repairerProfile.id) {
      throw new ForbiddenException('Un autre réparateur est déjà assigné à cette demande');
    }

    // Check if an active quote already exists (pending or accepted)
    // Rejected and expired quotes are ignored to allow negotiation
    const existingActiveQuote = await this.quoteRepo.findOne({
      where: [
        { requestId: dto.requestId, status: QuoteStatus.PENDING },
        { requestId: dto.requestId, status: QuoteStatus.ACCEPTED },
      ],
    });

    if (existingActiveQuote) {
      throw new BadRequestException('Un devis actif existe déjà pour cette demande');
    }

    // Calculate totals
    const partsCost = (dto.parts || []).reduce(
      (sum, part) => sum + part.price * part.quantity,
      0,
    );
    const totalAmount = dto.laborCost + partsCost;

    // Set validity period (default 7 days)
    const validDays = dto.validDays || 7;
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validDays);

    const quote = this.quoteRepo.create({
      requestId: dto.requestId,
      repairerId: repairerProfile.id,
      laborCost: dto.laborCost,
      partsCost,
      totalAmount,
      parts: dto.parts || [],
      estimatedDuration: dto.estimatedDuration,
      notes: dto.notes,
      validUntil,
      status: QuoteStatus.PENDING,
    });

    const savedQuote = await this.quoteRepo.save(quote);
    this.logger.log(`Quote created: ${savedQuote.id} for ${totalAmount} XOF`);

    // Update estimated price only - do NOT auto-accept the request
    // The request should be accepted separately via acceptQuote method
    await this.requestRepo.update(dto.requestId, {
      estimatedPrice: totalAmount,
    });

    // BIZ-108: Émettre événement de création de devis
    const quoteCreatedEvent = new QuoteCreatedEvent(
      savedQuote.id,
      dto.requestId,
      request.clientId,
      repairerProfile.id,
      totalAmount,
      dto.laborCost,
      partsCost,
      dto.estimatedDuration,
    );
    this.eventEmitter.emit(EventNames.QUOTE_CREATED, quoteCreatedEvent);

    return this.findOne(savedQuote.id);
  }

  async findOne(id: string): Promise<Quote> {
    const quote = await this.quoteRepo.findOne({
      where: { id },
      relations: ['request', 'request.client', 'request.device', 'request.serviceType', 'repairer', 'repairer.user'],
    });

    if (!quote) {
      throw new NotFoundException('Devis non trouvé');
    }

    return quote;
  }

  async findByRequest(requestId: string): Promise<Quote | null> {
    // Return the most recent quote (prioritize active ones, then by date)
    return this.quoteRepo.findOne({
      where: { requestId },
      relations: ['request', 'repairer', 'repairer.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllByRequest(requestId: string): Promise<Quote[]> {
    // Return all quotes for a request (negotiation history), ordered by date DESC
    return this.quoteRepo.find({
      where: { requestId },
      relations: ['request', 'repairer', 'repairer.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByClient(clientId: string, filters: QuoteFilters): Promise<{ data: Quote[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Quote> = {};
    if (filters.status) {
      where.status = filters.status;
    }

    const [data, total] = await this.quoteRepo.findAndCount({
      where: {
        ...where,
        request: { clientId },
      },
      relations: ['request', 'request.device', 'request.serviceType', 'repairer', 'repairer.user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async findByRepairer(repairerId: string, filters: QuoteFilters): Promise<{ data: Quote[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const repairerProfile = await this.repairerRepo.findOne({
      where: { userId: repairerId },
    });

    if (!repairerProfile) {
      return { data: [], total: 0 };
    }

    const where: FindOptionsWhere<Quote> = { repairerId: repairerProfile.id };
    if (filters.status) {
      where.status = filters.status;
    }

    const [data, total] = await this.quoteRepo.findAndCount({
      where,
      relations: ['request', 'request.client', 'request.device', 'request.serviceType'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }


  /**
   * BIZ-011: Accept a quote with pessimistic locking to prevent race conditions
   *
   * This method uses pessimistic_write lock to ensure that only one user
   * can accept a quote at a time, preventing race conditions when multiple
   * users try to accept the same quote simultaneously.
   *
   * IMPORTANT: PostgreSQL does not allow FOR UPDATE on LEFT JOINs that may return NULL.
   * Therefore, we use INNER JOIN for required relations and load optional relations separately.
   */
  async acceptQuote(id: string, clientId: string): Promise<Quote> {
    this.logger.log(`Quote acceptance initiated: ${id} by client ${clientId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // BIZ-011: Use pessimistic lock with INNER JOINs only (required relations)
      // PostgreSQL error: "FOR UPDATE cannot be applied to the nullable side of an outer join"
      // Solution: Use innerJoinAndSelect for required relations only
      const quote = await queryRunner.manager
        .createQueryBuilder(Quote, 'quote')
        .setLock('pessimistic_write')
        .innerJoinAndSelect('quote.request', 'request')
        .innerJoinAndSelect('request.client', 'client')
        .innerJoinAndSelect('quote.repairer', 'repairer')
        .innerJoinAndSelect('repairer.user', 'repairerUser')
        .where('quote.id = :id', { id })
        .getOne();

      if (!quote) {
        throw new NotFoundException('Devis non trouve');
      }

      // Load optional relations separately (device and serviceType can be NULL)
      if (quote.request) {
        const requestWithOptional = await queryRunner.manager.findOne(RepairRequest, {
          where: { id: quote.request.id },
          relations: ['device', 'serviceType'],
        });
        if (requestWithOptional) {
          quote.request.device = requestWithOptional.device;
          quote.request.serviceType = requestWithOptional.serviceType;
        }
      }

      if (quote.request.clientId !== clientId) {
        throw new ForbiddenException('Vous ne pouvez pas accepter ce devis');
      }

      // Re-check status after acquiring lock to handle race conditions
      if (quote.status !== QuoteStatus.PENDING) {
        throw new BadRequestException('Ce devis ne peut plus etre accepte (deja traite)');
      }

      if (new Date() > new Date(quote.validUntil)) {
        quote.status = QuoteStatus.EXPIRED;
        await queryRunner.manager.save(Quote, quote);
        await queryRunner.commitTransaction();
        throw new BadRequestException('Ce devis a expire');
      }

      // Also lock the request to prevent concurrent modifications
      const request = await queryRunner.manager
        .createQueryBuilder(RepairRequest, 'request')
        .setLock('pessimistic_write')
        .where('request.id = :requestId', { requestId: quote.requestId })
        .getOne();

      if (!request) {
        throw new NotFoundException('Demande associee non trouvee');
      }

      // BIZ-106: Protection contre double acceptation de quotes
      // Si la request est déjà ACCEPTED avec un réparateur différent, refuser
      if (request.status === RequestStatus.ACCEPTED &&
          request.repairerId &&
          request.repairerId !== quote.repairerId) {
        throw new BadRequestException('Cette demande a déjà un réparateur assigné');
      }

      // Check if request already has an accepted quote (only block if already IN_PROGRESS or beyond)
      if (request.status === RequestStatus.IN_PROGRESS ||
          request.status === RequestStatus.COMPLETED ||
          request.status === RequestStatus.DELIVERED) {
        throw new BadRequestException('Cette demande a deja un devis accepte et est en cours de traitement');
      }

      quote.status = QuoteStatus.ACCEPTED;
      quote.acceptedAt = new Date();
      await queryRunner.manager.save(Quote, quote);

      // Update request status to ACCEPTED, set final price and assign repairer
      await queryRunner.manager.update(RepairRequest, quote.requestId, {
        status: RequestStatus.ACCEPTED,
        acceptedAt: new Date(),
        finalPrice: quote.totalAmount,
        repairerId: quote.repairerId,
      });

      // Reject any other pending quotes for this request
      await queryRunner.manager
        .createQueryBuilder()
        .update(Quote)
        .set({
          status: QuoteStatus.REJECTED,
          rejectedAt: new Date(),
          rejectionReason: 'Autre devis accepte pour cette demande',
        })
        .where('requestId = :requestId', { requestId: quote.requestId })
        .andWhere('id != :quoteId', { quoteId: quote.id })
        .andWhere('status = :pendingStatus', { pendingStatus: QuoteStatus.PENDING })
        .execute();

      await queryRunner.commitTransaction();
      this.logger.log(`Quote ${id} accepted successfully for ${quote.totalAmount} XOF`);

      // Emit quote accepted event
      const quoteAcceptedEvent = new QuoteAcceptedEvent(
        quote.id,
        quote.requestId,
        quote.request.clientId,
        quote.repairerId,
        Number(quote.totalAmount),
        Number(quote.laborCost),
        Number(quote.partsCost),
        quote.estimatedDuration,
      );
      this.eventEmitter.emit(EventNames.QUOTE_ACCEPTED, quoteAcceptedEvent);

      return this.findOne(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Quote acceptance failed for ${id}: ${errorMessage}`);
      if (errorStack) {
        this.logger.error(`Stack trace: ${errorStack}`);
      }
      await queryRunner.rollbackTransaction();
      // Re-throw known exceptions, wrap unknown ones
      if (error instanceof NotFoundException ||
          error instanceof ForbiddenException ||
          error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Erreur lors de l'acceptation du devis: ${errorMessage}`);
    } finally {
      await queryRunner.release();
    }
  }

  async rejectQuote(
    id: string,
    clientId: string,
    reason?: string,
    proposedPrice?: number,
  ): Promise<Quote> {
    const quote = await this.findOne(id);

    if (quote.request.clientId !== clientId) {
      throw new ForbiddenException('Vous ne pouvez pas refuser ce devis');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Ce devis ne peut plus être refusé');
    }

    quote.status = QuoteStatus.REJECTED;
    quote.rejectedAt = new Date();
    quote.rejectionReason = reason;
    if (proposedPrice !== undefined && proposedPrice > 0) {
      quote.clientProposedPrice = proposedPrice;
    }
    await this.quoteRepo.save(quote);

    // Keep request status as 'accepted' to allow negotiation
    // The request is still accepted, only the quote price is being negotiated

    return this.findOne(id);
  }

  async updateQuote(id: string, repairerId: string, dto: UpdateQuoteDto): Promise<Quote> {
    const quote = await this.findOne(id);

    const repairerProfile = await this.repairerRepo.findOne({
      where: { userId: repairerId },
    });

    if (!repairerProfile || quote.repairerId !== repairerProfile.id) {
      throw new ForbiddenException('Vous ne pouvez pas modifier ce devis');
    }

    if (quote.status !== QuoteStatus.PENDING) {
      throw new BadRequestException('Ce devis ne peut plus être modifié');
    }

    if (dto.laborCost !== undefined) {
      quote.laborCost = dto.laborCost;
    }

    if (dto.parts !== undefined) {
      quote.parts = dto.parts;
      quote.partsCost = dto.parts.reduce(
        (sum, part) => sum + part.price * part.quantity,
        0,
      );
    }

    quote.totalAmount = quote.laborCost + quote.partsCost + quote.urgencySupplement;

    if (dto.estimatedDuration) {
      quote.estimatedDuration = dto.estimatedDuration;
    }

    if (dto.notes !== undefined) {
      quote.notes = dto.notes;
    }

    await this.quoteRepo.save(quote);

    return this.findOne(id);
  }

  async acceptCounterProposal(quoteId: string, repairerId: string): Promise<Quote> {
    const rejectedQuote = await this.findOne(quoteId);

    const repairerProfile = await this.repairerRepo.findOne({
      where: { userId: repairerId },
    });

    if (!repairerProfile || rejectedQuote.repairerId !== repairerProfile.id) {
      throw new ForbiddenException('Vous ne pouvez pas accepter cette contre-proposition');
    }

    if (rejectedQuote.status !== QuoteStatus.REJECTED) {
      throw new BadRequestException('Ce devis n\'a pas été refusé');
    }

    if (!rejectedQuote.clientProposedPrice || rejectedQuote.clientProposedPrice <= 0) {
      throw new BadRequestException('Aucune contre-proposition de prix trouvée');
    }

    // Create a new accepted quote with the client's proposed price
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 7);

    const newQuote = this.quoteRepo.create({
      requestId: rejectedQuote.requestId,
      repairerId: repairerProfile.id,
      laborCost: rejectedQuote.clientProposedPrice,
      partsCost: 0,
      totalAmount: rejectedQuote.clientProposedPrice,
      parts: [],
      estimatedDuration: rejectedQuote.estimatedDuration,
      notes: `Contre-proposition acceptée (prix initial: ${rejectedQuote.totalAmount} XOF)`,
      validUntil,
      status: QuoteStatus.ACCEPTED,
      acceptedAt: new Date(),
    });

    const savedQuote = await this.quoteRepo.save(newQuote);

    // Update request final price
    await this.requestRepo.update(rejectedQuote.requestId, {
      finalPrice: rejectedQuote.clientProposedPrice,
    });

    // Emit quote accepted event for the counter-proposal
    const quoteAcceptedEvent = new QuoteAcceptedEvent(
      savedQuote.id,
      savedQuote.requestId,
      rejectedQuote.request.clientId,
      savedQuote.repairerId,
      Number(savedQuote.totalAmount),
      Number(savedQuote.laborCost),
      Number(savedQuote.partsCost),
      savedQuote.estimatedDuration,
    );
    this.eventEmitter.emit(EventNames.QUOTE_ACCEPTED, quoteAcceptedEvent);

    return this.findOne(savedQuote.id);
  }

  async cancelNegotiation(quoteId: string, userId: string, reason?: string): Promise<Quote> {
    const quote = await this.findOne(quoteId);

    const repairerProfile = await this.repairerRepo.findOne({
      where: { userId },
    });

    // Allow both repairer and client to cancel
    const isRepairer = repairerProfile && quote.repairerId === repairerProfile.id;
    const isClient = quote.request.clientId === userId;

    if (!isRepairer && !isClient) {
      throw new ForbiddenException('Vous ne pouvez pas annuler cette négociation');
    }

    if (quote.status === QuoteStatus.ACCEPTED) {
      throw new BadRequestException('Ce devis a déjà été accepté');
    }

    // Mark the quote as expired to end negotiation
    quote.status = QuoteStatus.EXPIRED;
    quote.rejectionReason = reason || 'Négociation annulée';
    await this.quoteRepo.save(quote);

    // BIZ-107: Reset complet de la request lors d'annulation de négociation
    // Utiliser QueryBuilder pour pouvoir assigner NULL explicitement
    await this.requestRepo
      .createQueryBuilder()
      .update(RepairRequest)
      .set({
        status: RequestStatus.PENDING,
        repairerId: () => 'NULL',
        acceptedAt: () => 'NULL',
        finalPrice: () => 'NULL',
      })
      .where('id = :id', { id: quote.requestId })
      .execute();

    return this.findOne(quoteId);
  }
}

import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DataSource } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Payment, PaymentStatus, PaymentMethod, PaymentType } from './entities/payment.entity';
import { Quote, QuoteStatus } from '../quotes/entities/quote.entity';
import { RepairRequest } from '../requests/entities/repair-request.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';
import { UserRole } from '../users/entities/user.entity';
import { InitiatePaymentDto, PaymentFilters } from './dto';
import { PaymentCompletedEvent, EventNames } from '../../common/events';

// Re-export DTOs for backward compatibility
export { InitiatePaymentDto, PaymentFilters } from './dto';

@Injectable()
export class PaymentsService {
  private readonly PLATFORM_FEE_PERCENT = 5;
  private readonly DEPOSIT_PERCENT = 30;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Quote)
    private readonly quoteRepo: Repository<Quote>,
    @InjectRepository(RepairRequest)
    private readonly requestRepo: Repository<RepairRequest>,
    @InjectRepository(RepairerProfile)
    private readonly repairerRepo: Repository<RepairerProfile>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private generatePaymentNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY-${timestamp}-${random}`;
  }

  async initiate(clientId: string, dto: InitiatePaymentDto): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const quote = await queryRunner.manager.findOne(Quote, {
        where: { id: dto.quoteId },
        relations: ['request'],
      });

      if (!quote) {
        throw new NotFoundException('Devis non trouvé');
      }

      if (quote.request.clientId !== clientId) {
        throw new ForbiddenException('Vous ne pouvez pas payer ce devis');
      }

      // BIZ-101: Vérifier que le devis est accepté avant d'autoriser le paiement
      if (quote.status !== QuoteStatus.ACCEPTED) {
        throw new BadRequestException(
          'Le paiement ne peut être effectué que sur un devis accepté'
        );
      }

      // Calculate amounts
      const quoteAmount = Number(quote.totalAmount);
      const platformFee = Math.round(quoteAmount * (this.PLATFORM_FEE_PERCENT / 100));
      let amount: number;

      if (dto.paymentType === PaymentType.DEPOSIT) {
        amount = Math.round((quoteAmount + platformFee) * (this.DEPOSIT_PERCENT / 100));
      } else if (dto.paymentType === PaymentType.BALANCE) {
        // Get existing deposit payment
        const depositPayment = await queryRunner.manager.findOne(Payment, {
          where: { quoteId: dto.quoteId, paymentType: PaymentType.DEPOSIT, status: PaymentStatus.COMPLETED },
        });
        if (!depositPayment) {
          throw new BadRequestException('Aucun acompte trouvé');
        }
        amount = quoteAmount + platformFee - Number(depositPayment.amount);
      } else {
        amount = quoteAmount + platformFee;
      }

      // BIZ-104: Calcul simplifié et correct du montant réparateur
      // Le réparateur reçoit le montant du devis moins la commission plateforme
      const repairerAmount = quoteAmount - platformFee;

      const payment = queryRunner.manager.create(Payment, {
        paymentNumber: this.generatePaymentNumber(),
        requestId: dto.requestId,
        quoteId: dto.quoteId,
        clientId,
        repairerId: quote.repairerId,
        amount,
        platformFee,
        platformFeePercent: this.PLATFORM_FEE_PERCENT,
        repairerAmount,
        paymentType: dto.paymentType,
        paymentMethod: dto.paymentMethod,
        phoneNumber: dto.phoneNumber,
        status: PaymentStatus.PENDING,
      });

      const savedPayment = await queryRunner.manager.save(Payment, payment);

      // In production, here you would call the payment provider API
      // For now, set to processing
      savedPayment.status = PaymentStatus.PROCESSING;
      await queryRunner.manager.save(Payment, savedPayment);

      await queryRunner.commitTransaction();

      return this.findOne(savedPayment.id, clientId, UserRole.CLIENT);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['client', 'repairer', 'repairer.user', 'request', 'request.device', 'request.serviceType'],
    });

    if (!payment) {
      throw new NotFoundException('Paiement non trouvé');
    }

    const hasAccess = await this.hasPaymentAccess(payment, userId, userRole);
    if (!hasAccess) {
      throw new ForbiddenException('Accès non autorisé à ce paiement');
    }

    return payment;
  }

  async findByRequest(requestId: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({
      where: { requestId },
      relations: ['client', 'repairer', 'repairer.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string, userRole: UserRole, filters: PaymentFilters): Promise<{ data: Payment[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    let where: FindOptionsWhere<Payment>;

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

    if (filters.paymentType) {
      where.paymentType = filters.paymentType;
    }

    const [data, total] = await this.paymentRepo.findAndCount({
      where,
      relations: ['request', 'request.device', 'request.serviceType', 'client', 'repairer', 'repairer.user'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async verify(paymentId: string, clientId: string, otp?: string): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await queryRunner.manager.findOne(Payment, {
        where: { id: paymentId },
      });

      if (!payment) {
        throw new NotFoundException('Paiement non trouvé');
      }

      if (payment.clientId !== clientId) {
        throw new ForbiddenException('Accès non autorisé');
      }

      if (payment.status !== PaymentStatus.PROCESSING) {
        throw new BadRequestException('Ce paiement ne peut pas être vérifié');
      }

      // In production, verify OTP with payment provider
      // For demo, just mark as completed
      payment.status = PaymentStatus.COMPLETED;
      payment.paidAt = new Date();
      payment.transactionRef = `TXN-${Date.now()}`;

      await queryRunner.manager.save(Payment, payment);

      await queryRunner.commitTransaction();

      // Emit payment completed event
      const paymentCompletedEvent = new PaymentCompletedEvent(
        payment.id,
        payment.paymentNumber,
        payment.requestId,
        payment.quoteId,
        payment.clientId,
        payment.repairerId,
        Number(payment.amount),
        Number(payment.platformFee),
        Number(payment.repairerAmount),
        payment.paymentType,
        payment.paymentMethod,
        payment.transactionRef,
      );
      this.eventEmitter.emit(EventNames.PAYMENT_COMPLETED, paymentCompletedEvent);

      return this.findOne(paymentId, clientId, UserRole.CLIENT);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async requestRefund(paymentId: string, clientId: string, reason: string): Promise<Payment> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const payment = await queryRunner.manager.findOne(Payment, {
        where: { id: paymentId },
      });

      if (!payment) {
        throw new NotFoundException('Paiement non trouvé');
      }

      if (payment.clientId !== clientId) {
        throw new ForbiddenException('Accès non autorisé');
      }

      if (payment.status !== PaymentStatus.COMPLETED) {
        throw new BadRequestException('Ce paiement ne peut pas être remboursé');
      }

      // Block payment pending refund review
      payment.status = PaymentStatus.BLOCKED;
      payment.blockedAt = new Date();
      payment.blockReason = `Demande de remboursement: ${reason}`;

      await queryRunner.manager.save(Payment, payment);

      await queryRunner.commitTransaction();

      return this.findOne(paymentId, clientId, UserRole.CLIENT);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Simulate successful payment (for demo purposes)
  async simulateSuccess(paymentId: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Paiement non trouvé');
    }

    payment.status = PaymentStatus.COMPLETED;
    payment.paidAt = new Date();
    payment.transactionRef = `TXN-${Date.now()}`;

    await this.paymentRepo.save(payment);

    // Emit payment completed event
    const paymentCompletedEvent = new PaymentCompletedEvent(
      payment.id,
      payment.paymentNumber,
      payment.requestId,
      payment.quoteId,
      payment.clientId,
      payment.repairerId,
      Number(payment.amount),
      Number(payment.platformFee),
      Number(payment.repairerAmount),
      payment.paymentType,
      payment.paymentMethod,
      payment.transactionRef,
    );
    this.eventEmitter.emit(EventNames.PAYMENT_COMPLETED, paymentCompletedEvent);

    return payment;
  }

  private async hasPaymentAccess(payment: Payment, userId: string, userRole: UserRole): Promise<boolean> {
    if (userRole === UserRole.ADMIN) {
      return true;
    }

    if (payment.clientId === userId) {
      return true;
    }

    if (userRole === UserRole.REPAIRER) {
      const repairerProfile = await this.repairerRepo.findOne({
        where: { userId },
      });
      if (repairerProfile && payment.repairerId === repairerProfile.id) {
        return true;
      }
    }

    return false;
  }
}

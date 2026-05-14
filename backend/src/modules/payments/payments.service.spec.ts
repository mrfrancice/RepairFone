import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { Quote } from '../quotes/entities/quote.entity';
import { RepairRequest } from '../requests/entities/repair-request.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';
import { UserRole } from '../users/entities/user.entity';

/**
 * Squelette de tests PaymentsService.
 *
 * Couvre les méthodes critiques (lecture + autorisation). À étoffer avec :
 *   - initiate() avec DataSource transactionnelle (mock du queryRunner)
 *   - verify() avec changement de statut
 *   - requestRefund() avec validation
 */
describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepo: jest.Mocked<Repository<Payment>>;

  const repoMock = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAndCount: jest.fn(),
    createQueryBuilder: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: repoMock() },
        { provide: getRepositoryToken(Quote), useValue: repoMock() },
        { provide: getRepositoryToken(RepairRequest), useValue: repoMock() },
        { provide: getRepositoryToken(RepairerProfile), useValue: repoMock() },
        {
          provide: DataSource,
          useValue: { createQueryRunner: jest.fn() },
        },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    paymentRepo = module.get(getRepositoryToken(Payment));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('throws NotFoundException when payment does not exist', async () => {
      paymentRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', 'user-id', UserRole.CLIENT),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when user is not authorized', async () => {
      paymentRepo.findOne.mockResolvedValue({
        id: 'payment-1',
        clientId: 'client-1',
        repairerId: 'repairer-1',
        status: PaymentStatus.COMPLETED,
      } as Payment);

      // Un autre utilisateur (ni client ni repairer du payment)
      await expect(
        service.findOne('payment-1', 'other-user', UserRole.CLIENT),
      ).rejects.toThrow(ForbiddenException);
    });

    it('returns payment when client owns it', async () => {
      const payment = {
        id: 'payment-1',
        clientId: 'client-1',
        repairerId: 'repairer-1',
        status: PaymentStatus.COMPLETED,
      } as Payment;
      paymentRepo.findOne.mockResolvedValue(payment);

      const result = await service.findOne(
        'payment-1',
        'client-1',
        UserRole.CLIENT,
      );
      expect(result).toBe(payment);
    });
  });
});

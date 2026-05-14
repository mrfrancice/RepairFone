import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotFoundException } from '@nestjs/common';
import { QuotesService } from './quotes.service';
import { Quote, QuoteStatus } from './entities/quote.entity';
import { RepairRequest } from '../requests/entities/repair-request.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';

/**
 * Squelette de tests QuotesService.
 *
 * À étoffer avec :
 *   - createQuote() : workflow complet (validation request, création quote, événement)
 *   - acceptQuote() / rejectQuote() : transitions de statut
 *   - acceptCounterProposal() : workflow contre-proposition
 *   - cancelNegotiation() : annulation
 */
describe('QuotesService', () => {
  let service: QuotesService;
  let quoteRepo: jest.Mocked<Repository<Quote>>;

  const repoMock = () => ({
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAndCount: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotesService,
        { provide: getRepositoryToken(Quote), useValue: repoMock() },
        { provide: getRepositoryToken(RepairRequest), useValue: repoMock() },
        { provide: getRepositoryToken(RepairerProfile), useValue: repoMock() },
        { provide: DataSource, useValue: { createQueryRunner: jest.fn() } },
        { provide: EventEmitter2, useValue: { emit: jest.fn() } },
      ],
    }).compile();

    service = module.get<QuotesService>(QuotesService);
    quoteRepo = module.get(getRepositoryToken(Quote));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('throws NotFoundException when quote does not exist', async () => {
      quoteRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns quote when found', async () => {
      const quote = {
        id: 'quote-1',
        requestId: 'request-1',
        repairerId: 'repairer-1',
        totalAmount: 25000,
        status: QuoteStatus.PENDING,
      } as Quote;
      quoteRepo.findOne.mockResolvedValue(quote);

      const result = await service.findOne('quote-1');
      expect(result).toBe(quote);
    });
  });
});

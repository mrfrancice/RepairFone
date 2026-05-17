import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { Quote, QuoteStatus } from './entities/quote.entity';

@Injectable()
export class QuotesScheduler {
  private readonly logger = new Logger(QuotesScheduler.name);

  constructor(
    @InjectRepository(Quote)
    private readonly quoteRepository: Repository<Quote>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async expireQuotes(): Promise<void> {
    this.logger.log('Running scheduled task: Expire pending quotes');

    const now = new Date();

    try {
      // Find all pending quotes where validUntil is in the past
      const expiredQuotes = await this.quoteRepository.find({
        where: {
          status: QuoteStatus.PENDING,
          validUntil: LessThan(now),
        },
      });

      if (expiredQuotes.length === 0) {
        this.logger.log('No expired quotes found');
        return;
      }

      // Update status to EXPIRED for all found quotes
      const expiredQuoteIds = expiredQuotes.map((quote) => quote.id);

      await this.quoteRepository.update(
        { id: In(expiredQuoteIds) },
        { status: QuoteStatus.EXPIRED },
      );

      this.logger.log(
        `Successfully expired ${expiredQuotes.length} quote(s): [${expiredQuoteIds.join(', ')}]`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to expire quotes',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}

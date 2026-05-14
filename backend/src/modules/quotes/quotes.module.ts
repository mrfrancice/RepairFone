import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Quote } from './entities/quote.entity';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { QuotesScheduler } from './quotes.scheduler';
import { RepairRequest } from '../requests/entities/repair-request.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Quote, RepairRequest, RepairerProfile])],
  controllers: [QuotesController],
  providers: [QuotesService, QuotesScheduler],
  exports: [QuotesService],
})
export class QuotesModule {}

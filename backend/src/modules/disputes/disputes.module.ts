import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Dispute } from './entities/dispute.entity';
import { DisputeMessage } from './entities/dispute-message.entity';
import { DisputesService } from './disputes.service';
import { DisputesController } from './disputes.controller';
import { RepairRequest } from '../requests/entities/repair-request.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dispute,
      DisputeMessage,
      RepairRequest,
      RepairerProfile,
    ]),
  ],
  controllers: [DisputesController],
  providers: [DisputesService],
  exports: [DisputesService],
})
export class DisputesModule {}

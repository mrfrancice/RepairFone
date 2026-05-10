import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentGatewayService } from './payment-gateway.service';
import { ReceiptService } from './receipt.service';
import { Quote } from '../quotes/entities/quote.entity';
import { RepairRequest } from '../requests/entities/repair-request.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Quote, RepairRequest, RepairerProfile]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentGatewayService, ReceiptService],
  exports: [PaymentsService, PaymentGatewayService, ReceiptService],
})
export class PaymentsModule {}

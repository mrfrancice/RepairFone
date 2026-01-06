import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService, InitiatePaymentDto, PaymentFilters } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaymentStatus, PaymentType } from './entities/payment.entity';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate')
  @ApiOperation({ summary: 'Initier un paiement (client)' })
  initiate(@CurrentUser() user: User, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes paiements' })
  @ApiQuery({ name: 'status', required: false, enum: PaymentStatus })
  @ApiQuery({ name: 'paymentType', required: false, enum: PaymentType })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findMy(@CurrentUser() user: User, @Query() filters: PaymentFilters) {
    return this.paymentsService.findByUser(user.id, user.role, filters);
  }

  @Get('request/:requestId')
  @ApiOperation({ summary: 'Paiement d\'une demande' })
  async findByRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() user: User,
  ) {
    const payment = await this.paymentsService.findByRequest(requestId);

    if (!payment) {
      return null;
    }

    // Authorization: User must be the client, the repairer, or an admin
    const isClient = payment.clientId === user.id;
    const isRepairer = payment.repairer?.userId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isClient && !isRepairer && !isAdmin) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce paiement');
    }

    return payment;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un paiement' })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.findOne(id, user.id, user.role);
  }

  @Post(':id/verify')
  @ApiOperation({ summary: 'Vérifier un paiement (client)' })
  verify(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { otp?: string },
  ) {
    return this.paymentsService.verify(id, user.id, body.otp);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Demander un remboursement (client)' })
  requestRefund(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason: string },
  ) {
    return this.paymentsService.requestRefund(id, user.id, body.reason);
  }

  @Post(':id/simulate-success')
  @ApiOperation({ summary: 'Simuler un paiement réussi (demo)' })
  async simulateSuccess(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    // CRITICAL: This endpoint should ONLY be accessible by the payment owner or admin
    // First, fetch the payment to check ownership
    const payment = await this.paymentsService.findOne(id, user.id, user.role);

    // The findOne method already checks authorization, so if we get here, user has access
    return this.paymentsService.simulateSuccess(id);
  }
}

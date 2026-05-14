import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ReceiptService } from './receipt.service';
import { InitiatePaymentDto, PaymentFilters } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaymentStatus, PaymentType } from './entities/payment.entity';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly receiptService: ReceiptService,
  ) {}

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
  @ApiOperation({ summary: "Paiement d'une demande" })
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
      throw new ForbiddenException("Vous n'avez pas accès à ce paiement");
    }

    return payment;
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'un paiement" })
  findOne(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string) {
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

  @Get(':id/receipt')
  @ApiOperation({ summary: 'Télécharger le reçu PDF du paiement' })
  async downloadReceipt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    // Authorization (lance ForbiddenException ou NotFoundException si nécessaire)
    const payment = await this.paymentsService.findOne(id, user.id, user.role);

    const stream = this.receiptService.generate(payment);
    const filename = `recu-${payment.paymentNumber ?? payment.id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    stream.pipe(res);
  }

  @Post(':id/simulate-success')
  @ApiOperation({
    summary: 'Simuler un paiement réussi (demo, hors production)',
  })
  async simulateSuccess(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    // SAFETY: only available outside production. En prod, brancher un vrai gateway.
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Endpoint de simulation désactivé en production. Utilisez le gateway de paiement réel.',
      );
    }

    // Authorization : the payment owner (client or repairer) or admin only
    await this.paymentsService.findOne(id, user.id, user.role);

    return this.paymentsService.simulateSuccess(id);
  }
}

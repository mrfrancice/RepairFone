import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuotesService, CreateQuoteDto, UpdateQuoteDto, QuoteFilters } from './quotes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { QuoteStatus } from './entities/quote.entity';

@ApiTags('Quotes')
@Controller('quotes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class QuotesController {
  constructor(private readonly quotesService: QuotesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un devis (réparateur)' })
  create(@CurrentUser() user: User, @Body() dto: CreateQuoteDto) {
    return this.quotesService.createQuote(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes devis (client ou réparateur)' })
  @ApiQuery({ name: 'status', required: false, enum: QuoteStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findMy(@CurrentUser() user: User, @Query() filters: QuoteFilters) {
    if (user.role === 'repairer') {
      return this.quotesService.findByRepairer(user.id, filters);
    }
    return this.quotesService.findByClient(user.id, filters);
  }

  @Get('request/:requestId')
  @ApiOperation({ summary: 'Dernier devis d\'une demande' })
  findByRequest(@Param('requestId', ParseUUIDPipe) requestId: string) {
    return this.quotesService.findByRequest(requestId);
  }

  @Get('request/:requestId/history')
  @ApiOperation({ summary: 'Historique des devis d\'une demande (négociation)' })
  findHistoryByRequest(@Param('requestId', ParseUUIDPipe) requestId: string) {
    return this.quotesService.findAllByRequest(requestId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un devis' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.quotesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un devis (réparateur)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateQuoteDto,
  ) {
    return this.quotesService.updateQuote(id, user.id, dto);
  }

  @Post(':id/accept')
  @ApiOperation({ summary: 'Accepter un devis (client)' })
  accept(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.quotesService.acceptQuote(id, user.id);
  }

  @Post(':id/reject')
  @ApiOperation({ summary: 'Refuser un devis (client) avec contre-proposition optionnelle' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body: { reason?: string; proposedPrice?: number },
  ) {
    return this.quotesService.rejectQuote(id, user.id, body.reason, body.proposedPrice);
  }

  @Post(':id/accept-counter-proposal')
  @ApiOperation({ summary: 'Accepter la contre-proposition du client (réparateur)' })
  acceptCounterProposal(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    return this.quotesService.acceptCounterProposal(id, user.id);
  }

  @Post(':id/cancel-negotiation')
  @ApiOperation({ summary: 'Annuler définitivement la négociation (client ou réparateur)' })
  cancelNegotiation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() body: { reason?: string },
  ) {
    return this.quotesService.cancelNegotiation(id, user.id, body.reason);
  }
}

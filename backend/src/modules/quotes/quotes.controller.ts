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
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { QuotesService } from './quotes.service';
import { CreateQuoteDto, UpdateQuoteDto, QuoteFilters } from './dto';
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
  async findByRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() user: User,
  ) {
    const quote = await this.quotesService.findByRequest(requestId);

    if (!quote) {
      return null;
    }

    // Authorization: User must be the client, the repairer, or an admin
    const isClient = quote.request.clientId === user.id;
    const isRepairer = quote.repairer?.userId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isClient && !isRepairer && !isAdmin) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce devis');
    }

    return quote;
  }

  @Get('request/:requestId/history')
  @ApiOperation({ summary: 'Historique des devis d\'une demande (négociation)' })
  async findHistoryByRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() user: User,
  ) {
    const quotes = await this.quotesService.findAllByRequest(requestId);

    if (!quotes || quotes.length === 0) {
      return [];
    }

    // Authorization: User must be the client, the repairer, or an admin
    const firstQuote = quotes[0];
    const isClient = firstQuote.request.clientId === user.id;
    const isRepairer = firstQuote.repairer?.userId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isClient && !isRepairer && !isAdmin) {
      throw new ForbiddenException('Vous n\'avez pas accès à l\'historique de ces devis');
    }

    return quotes;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un devis' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const quote = await this.quotesService.findOne(id);

    // Authorization: User must be the client, the repairer, or an admin
    const isClient = quote.request.clientId === user.id;
    const isRepairer = quote.repairer?.userId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isClient && !isRepairer && !isAdmin) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce devis');
    }

    return quote;
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

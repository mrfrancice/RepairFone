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
import { DisputesService, CreateDisputeDto, AddMessageDto, DisputeFilters } from './disputes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { DisputeStatus } from './entities/dispute.entity';

@ApiTags('Disputes')
@Controller('disputes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un litige (client)' })
  create(@CurrentUser() user: User, @Body() dto: CreateDisputeDto) {
    return this.disputesService.create(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes litiges' })
  @ApiQuery({ name: 'status', required: false, enum: DisputeStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findMy(@CurrentUser() user: User, @Query() filters: DisputeFilters) {
    return this.disputesService.findByUser(user.id, user.role, filters);
  }

  @Get('request/:requestId')
  @ApiOperation({ summary: 'Litige d\'une demande' })
  async findByRequest(
    @Param('requestId', ParseUUIDPipe) requestId: string,
    @CurrentUser() user: User,
  ) {
    const dispute = await this.disputesService.findByRequest(requestId);

    if (!dispute) {
      return null;
    }

    // Authorization: User must be the client, the repairer, or an admin
    const isClient = dispute.clientId === user.id;
    const isRepairer = dispute.repairer?.userId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isClient && !isRepairer && !isAdmin) {
      throw new ForbiddenException('Vous n\'avez pas accès à ce litige');
    }

    return dispute;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un litige' })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.disputesService.findOne(id, user.id, user.role);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Ajouter un message au litige' })
  addMessage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddMessageDto,
  ) {
    return this.disputesService.addMessage(id, user.id, user.role, dto);
  }

  @Post(':id/evidence')
  @ApiOperation({ summary: 'Ajouter des preuves (client)' })
  addEvidence(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { photos: string[] },
  ) {
    return this.disputesService.addEvidence(id, user.id, body.photos);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Annuler un litige (client)' })
  cancel(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.disputesService.cancel(id, user.id);
  }
}

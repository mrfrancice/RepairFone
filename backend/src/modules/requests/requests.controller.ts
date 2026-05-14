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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { RequestsService } from './requests.service';
import {
  CreateRequestDto,
  UpdateRequestStatusDto,
  RequestFilters,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Repair Requests')
@Controller('requests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une demande de réparation (client)' })
  create(@CurrentUser() user: User, @Body() dto: CreateRequestDto) {
    return this.requestsService.createRequest(user.id, dto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Mes demandes (client ou réparateur)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findMy(@CurrentUser() user: User, @Query() filters: RequestFilters) {
    if (user.role === 'repairer') {
      return this.requestsService.findByRepairer(user.id, filters);
    }
    return this.requestsService.findByClient(user.id, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des demandes' })
  getStats(@CurrentUser() user: User) {
    return this.requestsService.getRequestStats(user.id, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une demande" })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ) {
    const request = await this.requestsService.findOne(id);

    // Authorization: User must be the client, the repairer, or an admin
    const isClient = request.clientId === user.id;
    const isRepairer = request.repairer?.userId === user.id;
    const isAdmin = user.role === 'admin';

    if (!isClient && !isRepairer && !isAdmin) {
      throw new ForbiddenException("Vous n'avez pas accès à cette demande");
    }

    return request;
  }

  @Put(':id/status')
  @ApiOperation({ summary: "Mettre à jour le statut d'une demande" })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
    @Body() dto: UpdateRequestStatusDto,
  ) {
    return this.requestsService.updateStatus(id, user.id, user.role, dto);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ConseilsService, CreateSessionDto, SessionFilters, ExpertFilters } from './conseils.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../users/entities/user.entity';
import { ConseilType, ConseilFormat } from './entities/expert.entity';
import { ConseilSessionStatus } from './entities/conseil-session.entity';

@ApiTags('Conseils')
@Controller('conseils')
export class ConseilsController {
  constructor(private readonly conseilsService: ConseilsService) {}

  @Get('experts')
  @Public()
  @ApiOperation({ summary: 'Liste des experts' })
  @ApiQuery({ name: 'type', required: false, enum: ConseilType })
  @ApiQuery({ name: 'format', required: false, enum: ConseilFormat })
  @ApiQuery({ name: 'isAvailable', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getExperts(@Query() filters: ExpertFilters) {
    return this.conseilsService.getExperts(filters);
  }

  @Get('experts/:id')
  @Public()
  @ApiOperation({ summary: 'Détails d\'un expert' })
  getExpert(@Param('id', ParseUUIDPipe) id: string) {
    return this.conseilsService.getExpert(id);
  }

  @Post('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Créer une session de conseil (client)' })
  createSession(@CurrentUser() user: User, @Body() dto: CreateSessionDto) {
    return this.conseilsService.createSession(user.id, dto);
  }

  @Get('sessions/my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mes sessions de conseil' })
  @ApiQuery({ name: 'status', required: false, enum: ConseilSessionStatus })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMySessions(@CurrentUser() user: User, @Query() filters: SessionFilters) {
    return this.conseilsService.getMySessions(user.id, user.role, filters);
  }

  @Get('sessions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Détails d\'une session' })
  getSession(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.conseilsService.getSession(id, user.id, user.role);
  }

  @Post('sessions/:id/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accepter une session (expert)' })
  acceptSession(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.conseilsService.acceptSession(id, user.id);
  }

  @Post('sessions/:id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Démarrer une session (expert)' })
  startSession(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.conseilsService.startSession(id, user.id);
  }

  @Post('sessions/:id/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Terminer une session (expert)' })
  completeSession(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.conseilsService.completeSession(id, user.id);
  }

  @Post('sessions/:id/rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Noter une session (client)' })
  rateSession(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.conseilsService.rateSession(id, user.id, body.rating, body.comment);
  }

  @Get('sessions/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Messages d\'une session' })
  getMessages(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.conseilsService.getMessages(id, user.id, user.role);
  }

  @Post('sessions/:id/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Envoyer un message' })
  sendMessage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { content: string; attachments?: string[] },
  ) {
    return this.conseilsService.sendMessage(id, user.id, user.role, body.content, body.attachments);
  }
}

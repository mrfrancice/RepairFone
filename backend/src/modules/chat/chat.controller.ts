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
import { ChatService, CreateConversationDto, SendMessageDto, MessageFilters } from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Mes conversations' })
  getConversations(@CurrentUser() user: User) {
    return this.chatService.getConversations(user.id, user.role);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Créer ou récupérer une conversation' })
  createConversation(@CurrentUser() user: User, @Body() dto: CreateConversationDto) {
    return this.chatService.getOrCreateConversation(user.id, user.role, dto);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Détails d\'une conversation' })
  getConversation(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.getConversation(id, user.id, user.role);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Messages d\'une conversation' })
  @ApiQuery({ name: 'before', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getMessages(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filters: MessageFilters,
  ) {
    return this.chatService.getMessages(id, user.id, user.role, filters);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Envoyer un message' })
  sendMessage(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { content: string; attachments?: string[] },
  ) {
    return this.chatService.sendMessage(user.id, user.role, {
      conversationId: id,
      content: body.content,
      attachments: body.attachments,
    });
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Marquer comme lu' })
  markAsRead(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.markAsRead(id, user.id, user.role);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Nombre de messages non lus' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.chatService.getTotalUnreadCount(user.id, user.role);
    return { count };
  }
}

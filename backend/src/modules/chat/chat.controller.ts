import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import {
  ChatService,
  CreateConversationDto,
  SendMessageDto,
  MessageFilters,
} from './chat.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FileUploadService } from '../../common/services/file-upload.service';
import { User } from '../users/entities/user.entity';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Mes conversations' })
  getConversations(@CurrentUser() user: User) {
    return this.chatService.getConversations(user.id, user.role);
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Créer ou récupérer une conversation' })
  createConversation(
    @CurrentUser() user: User,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.getOrCreateConversation(user.id, user.role, dto);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: "Détails d'une conversation" })
  getConversation(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.chatService.getConversation(id, user.id, user.role);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: "Messages d'une conversation" })
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

  /**
   * Upload d'une pièce jointe pour une conversation.
   *
   * Flow client : POST ici pour récupérer l'URL, puis envoyer un
   * message avec ces URLs dans le tableau `attachments`. Permet d'envoyer
   * plusieurs photos dans un seul message texte sans gonfler le payload.
   *
   * SÉCURITÉ : la vérification d'accès à la conversation est faite par
   * le service avant l'upload. Sans cela, n'importe quel utilisateur
   * authentifié pourrait uploader des fichiers vers n'importe quel
   * conversationId.
   */
  @Post('conversations/:id/attachments')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Uploader une pièce jointe (image/PDF) pour une conversation',
  })
  async uploadAttachment(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) conversationId: string,
    @UploadedFile()
    file:
      | { originalname: string; buffer: Buffer; mimetype: string; size: number }
      | undefined,
  ): Promise<{ url: string }> {
    if (!file) {
      throw new BadRequestException(
        'Fichier manquant (champ multipart "file")',
      );
    }

    // Vérifie que l'utilisateur a bien accès à cette conversation
    await this.chatService.getConversation(conversationId, user.id, user.role);

    const result = await this.fileUploadService.uploadChatAttachment(
      {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      },
      conversationId,
    );

    if (!result.success || !result.url) {
      throw new BadRequestException(result.error || "Échec de l'upload");
    }

    return { url: result.url };
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
    const count = await this.chatService.getTotalUnreadCount(
      user.id,
      user.role,
    );
    return { count };
  }
}

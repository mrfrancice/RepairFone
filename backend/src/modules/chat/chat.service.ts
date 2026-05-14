import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, LessThan, IsNull } from 'typeorm';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Conversation } from './entities/conversation.entity';
import {
  Message,
  SenderType,
  MessageAttachment,
} from './entities/message.entity';
import { RepairRequest } from '../requests/entities/repair-request.entity';
import { RepairerProfile } from '../users/entities/repairer-profile.entity';
import { User, UserRole } from '../users/entities/user.entity';

export class CreateConversationDto {
  @IsUUID()
  requestId: string;
}

export class SendMessageDto {
  // conversationId vient de l'URL (param), pas du body — pas de @IsUUID
  // requis ici. On le garde optionnel pour le typage interne.
  conversationId?: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}

export class MessageFilters {
  @IsOptional()
  @IsString()
  before?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(RepairRequest)
    private readonly requestRepo: Repository<RepairRequest>,
    @InjectRepository(RepairerProfile)
    private readonly repairerRepo: Repository<RepairerProfile>,
  ) {}

  async getOrCreateConversation(
    userId: string,
    userRole: UserRole,
    dto: CreateConversationDto,
  ): Promise<Conversation> {
    const request = await this.requestRepo.findOne({
      where: { id: dto.requestId },
      relations: ['client', 'repairer'],
    });

    if (!request) {
      throw new NotFoundException('Demande non trouvée');
    }

    // Find existing conversation
    let conversation = await this.conversationRepo.findOne({
      where: { requestId: dto.requestId },
      relations: ['client', 'repairer', 'repairer.user'],
    });

    if (conversation) {
      return conversation;
    }

    // Create new conversation
    if (!request.repairerId) {
      throw new ForbiddenException(
        "Cette demande n'a pas encore de réparateur assigné",
      );
    }

    conversation = this.conversationRepo.create({
      requestId: dto.requestId,
      clientId: request.clientId,
      repairerId: request.repairerId,
      isActive: true,
    });

    await this.conversationRepo.save(conversation);

    return this.getConversation(conversation.id, userId, userRole);
  }

  async getConversation(
    id: string,
    userId: string,
    userRole: UserRole,
  ): Promise<Conversation> {
    const conversation = await this.conversationRepo.findOne({
      where: { id },
      relations: [
        'client',
        'repairer',
        'repairer.user',
        'request',
        'request.device',
        'request.serviceType',
      ],
    });

    if (!conversation) {
      throw new NotFoundException('Conversation non trouvée');
    }

    // Check access
    const hasAccess = await this.hasConversationAccess(
      conversation,
      userId,
      userRole,
    );
    if (!hasAccess) {
      throw new ForbiddenException('Accès non autorisé à cette conversation');
    }

    return conversation;
  }

  async getConversations(
    userId: string,
    userRole: UserRole,
  ): Promise<Conversation[]> {
    let where: FindOptionsWhere<Conversation>;

    if (userRole === UserRole.REPAIRER) {
      const repairerProfile = await this.repairerRepo.findOne({
        where: { userId },
      });
      if (!repairerProfile) {
        return [];
      }
      where = { repairerId: repairerProfile.id, isActive: true };
    } else {
      where = { clientId: userId, isActive: true };
    }

    return this.conversationRepo.find({
      where,
      relations: [
        'client',
        'repairer',
        'repairer.user',
        'request',
        'request.device',
        'request.serviceType',
      ],
      order: { lastMessageAt: 'DESC' },
    });
  }

  async getMessages(
    conversationId: string,
    userId: string,
    userRole: UserRole,
    filters: MessageFilters,
  ): Promise<{ data: Message[]; hasMore: boolean }> {
    const conversation = await this.getConversation(
      conversationId,
      userId,
      userRole,
    );

    const limit = filters.limit || 50;

    const where: FindOptionsWhere<Message> = {
      conversationId: conversation.id,
      isDeleted: false,
    };

    if (filters.before) {
      where.createdAt = LessThan(new Date(filters.before));
    }

    const messages = await this.messageRepo.find({
      where,
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit + 1,
    });

    const hasMore = messages.length > limit;
    const data = messages.slice(0, limit).reverse();

    return { data, hasMore };
  }

  async sendMessage(
    userId: string,
    userRole: UserRole,
    dto: SendMessageDto,
  ): Promise<Message> {
    if (!dto.conversationId) {
      throw new NotFoundException('conversationId requis');
    }
    const conversation = await this.getConversation(
      dto.conversationId,
      userId,
      userRole,
    );

    const senderType =
      userRole === UserRole.REPAIRER ? SenderType.REPAIRER : SenderType.CLIENT;

    const attachments: MessageAttachment[] = (dto.attachments || []).map(
      (url, index) => ({
        id: `att-${Date.now()}-${index}`,
        type: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 'file',
        url,
      }),
    );

    const message = this.messageRepo.create({
      conversationId: conversation.id,
      senderId: userId,
      senderType,
      content: dto.content,
      attachments,
    });

    await this.messageRepo.save(message);

    // Update conversation
    conversation.lastMessageAt = new Date();
    if (senderType === SenderType.CLIENT) {
      conversation.repairerUnreadCount += 1;
    } else {
      conversation.clientUnreadCount += 1;
    }
    await this.conversationRepo.save(conversation);

    return this.messageRepo.findOne({
      where: { id: message.id },
      relations: ['sender'],
    }) as Promise<Message>;
  }

  async markAsRead(
    conversationId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<void> {
    const conversation = await this.getConversation(
      conversationId,
      userId,
      userRole,
    );

    if (userRole === UserRole.REPAIRER) {
      conversation.repairerUnreadCount = 0;
    } else {
      conversation.clientUnreadCount = 0;
    }
    await this.conversationRepo.save(conversation);

    // Mark messages as read
    const senderType =
      userRole === UserRole.REPAIRER ? SenderType.CLIENT : SenderType.REPAIRER;
    await this.messageRepo.update(
      {
        conversationId: conversation.id,
        senderType,
        readAt: IsNull(),
      },
      { readAt: new Date() },
    );
  }

  async getTotalUnreadCount(
    userId: string,
    userRole: UserRole,
  ): Promise<number> {
    let where: FindOptionsWhere<Conversation>;

    if (userRole === UserRole.REPAIRER) {
      const repairerProfile = await this.repairerRepo.findOne({
        where: { userId },
      });
      if (!repairerProfile) {
        return 0;
      }
      where = { repairerId: repairerProfile.id, isActive: true };
    } else {
      where = { clientId: userId, isActive: true };
    }

    const conversations = await this.conversationRepo.find({ where });

    return conversations.reduce((sum, conv) => {
      return (
        sum +
        (userRole === UserRole.REPAIRER
          ? conv.repairerUnreadCount
          : conv.clientUnreadCount)
      );
    }, 0);
  }

  private async hasConversationAccess(
    conversation: Conversation,
    userId: string,
    userRole: UserRole,
  ): Promise<boolean> {
    if (conversation.clientId === userId) {
      return true;
    }

    if (userRole === UserRole.REPAIRER) {
      const repairerProfile = await this.repairerRepo.findOne({
        where: { userId },
      });
      if (repairerProfile && conversation.repairerId === repairerProfile.id) {
        return true;
      }
    }

    return false;
  }
}

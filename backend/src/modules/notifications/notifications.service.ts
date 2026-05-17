import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  Notification,
  NotificationType,
  NotificationChannel,
} from './entities/notification.entity';
import { PushService } from '../push/push.service';

export class CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  referenceType?: string;
  referenceId?: string;
  channel?: NotificationChannel;
}

export class NotificationFilters {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly pushService: PushService,
  ) {}

  async create(dto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepo.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      data: dto.data,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      channel: dto.channel || NotificationChannel.IN_APP,
    });

    const saved = await this.notificationRepo.save(notification);

    // Fire-and-forget push : si l'user a un abonnement Web Push actif,
    // on lui envoie. Si pas d'abonnement / Web Push non configuré, no-op.
    // On NE bloque PAS la création de la notif DB sur l'envoi push.
    this.pushService
      .sendToUser(dto.userId, {
        title: dto.title,
        body: dto.body,
        url:
          dto.referenceType && dto.referenceId
            ? `/${dto.referenceType}s/${dto.referenceId}`
            : '/notifications',
        tag: dto.type,
        data: { notificationId: saved.id, ...dto.data },
      })
      .catch((err: unknown) =>
        this.logger.error(
          `Push échec pour user ${dto.userId}: ${
            err instanceof Error ? err.message : String(err)
          }`,
        ),
      );

    return saved;
  }

  async findByUser(
    userId: string,
    filters: NotificationFilters,
  ): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Notification> = { userId };

    if (filters.isRead !== undefined) {
      where.isRead = filters.isRead;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    const [data, total] = await this.notificationRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const unreadCount = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });

    return { data, total, unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    notification.isRead = true;
    notification.readAt = new Date();

    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepo.count({
      where: { userId, isRead: false },
    });
  }

  async delete(id: string, userId: string): Promise<void> {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification non trouvée');
    }

    await this.notificationRepo.softDelete(id);
  }

  // Helper methods for creating specific notification types
  async notifyRequestReceived(
    repairerId: string,
    requestId: string,
    clientName: string,
  ): Promise<Notification> {
    return this.create({
      userId: repairerId,
      type: NotificationType.REQUEST_RECEIVED,
      title: 'Nouvelle demande de réparation',
      body: `${clientName} vous a envoyé une demande de réparation`,
      referenceType: 'request',
      referenceId: requestId,
    });
  }

  async notifyQuoteReceived(
    clientId: string,
    quoteId: string,
    repairerName: string,
  ): Promise<Notification> {
    return this.create({
      userId: clientId,
      type: NotificationType.QUOTE_RECEIVED,
      title: 'Nouveau devis reçu',
      body: `${repairerName} vous a envoyé un devis`,
      referenceType: 'quote',
      referenceId: quoteId,
    });
  }

  async notifyQuoteAccepted(
    repairerId: string,
    quoteId: string,
  ): Promise<Notification> {
    return this.create({
      userId: repairerId,
      type: NotificationType.QUOTE_ACCEPTED,
      title: 'Devis accepté',
      body: 'Votre devis a été accepté par le client',
      referenceType: 'quote',
      referenceId: quoteId,
    });
  }

  async notifyRepairCompleted(
    clientId: string,
    requestId: string,
  ): Promise<Notification> {
    return this.create({
      userId: clientId,
      type: NotificationType.REPAIR_COMPLETED,
      title: 'Réparation terminée',
      body: 'Votre appareil a été réparé avec succès',
      referenceType: 'request',
      referenceId: requestId,
    });
  }

  async notifyMessageReceived(
    userId: string,
    conversationId: string,
    senderName: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.MESSAGE_RECEIVED,
      title: 'Nouveau message',
      body: `${senderName} vous a envoyé un message`,
      referenceType: 'conversation',
      referenceId: conversationId,
    });
  }

  async notifyPaymentReceived(
    repairerId: string,
    paymentId: string,
    amount: number,
  ): Promise<Notification> {
    return this.create({
      userId: repairerId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: 'Paiement reçu',
      body: `Vous avez reçu un paiement de ${amount.toLocaleString('fr-FR')} FCFA`,
      referenceType: 'payment',
      referenceId: paymentId,
    });
  }

  async notifyPaymentRefunded(
    userId: string,
    paymentId: string,
    paymentNumber: string,
    amount: number,
    reason: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.PAYMENT_REFUNDED,
      title: 'Paiement remboursé',
      body: `Le paiement ${paymentNumber} de ${amount.toLocaleString('fr-FR')} FCFA a été remboursé. Motif : ${reason}`,
      referenceType: 'payment',
      referenceId: paymentId,
    });
  }

  async notifyPaymentBlocked(
    userId: string,
    paymentId: string,
    paymentNumber: string,
    reason: string,
  ): Promise<Notification> {
    return this.create({
      userId,
      type: NotificationType.PAYMENT_BLOCKED,
      title: 'Paiement bloqué',
      body: `Le paiement ${paymentNumber} est bloqué en attente de vérification. Motif : ${reason}`,
      referenceType: 'payment',
      referenceId: paymentId,
    });
  }

  async notifyDisputeOpened(
    repairerId: string,
    disputeId: string,
  ): Promise<Notification> {
    return this.create({
      userId: repairerId,
      type: NotificationType.DISPUTE_OPENED,
      title: 'Litige ouvert',
      body: 'Un client a ouvert un litige concernant une réparation',
      referenceType: 'dispute',
      referenceId: disputeId,
    });
  }

  async notifyReviewReceived(
    repairerId: string,
    reviewId: string,
    rating: number,
  ): Promise<Notification> {
    return this.create({
      userId: repairerId,
      type: NotificationType.REVIEW_RECEIVED,
      title: 'Nouvel avis reçu',
      body: `Vous avez reçu un avis ${rating}/5 étoiles`,
      referenceType: 'review',
      referenceId: reviewId,
    });
  }
}

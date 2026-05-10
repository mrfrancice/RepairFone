import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as webpush from 'web-push';
import { PushSubscription } from './entities/push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

/**
 * Web Push (VAPID, W3C standard). Pas de Firebase, pas de dépendance
 * propriétaire — les navigateurs utilisent leur propre push service
 * (FCM pour Chrome, Mozilla pour Firefox, APNs pour Safari).
 *
 * Activation : définir VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY + VAPID_SUBJECT
 * dans .env. Si l'une manque, le service log un warning et reste no-op.
 *
 * Génération des clés : `node -e "console.log(JSON.stringify(require('web-push').generateVAPIDKeys()))"`
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private enabled = false;

  constructor(
    @InjectRepository(PushSubscription)
    private readonly subRepo: Repository<PushSubscription>,
    private readonly config: ConfigService,
  ) {}

  onModuleInit(): void {
    const publicKey = this.config.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.config.get<string>('VAPID_PRIVATE_KEY');
    const subject = this.config.get<string>('VAPID_SUBJECT') || 'mailto:admin@repairfone.ci';

    if (!publicKey || !privateKey) {
      this.logger.warn('Web Push désactivé (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY manquants)');
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.enabled = true;
    this.logger.log('Web Push initialisé (VAPID configuré)');
  }

  getPublicKey(): string | null {
    return this.config.get<string>('VAPID_PUBLIC_KEY') || null;
  }

  /**
   * Enregistre (ou met à jour) un abonnement push pour un user.
   * Si l'endpoint existe déjà, on met à jour les clés (cas où le
   * navigateur fait une rotation).
   */
  async subscribe(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
    userAgent?: string,
  ): Promise<PushSubscription> {
    const existing = await this.subRepo.findOne({ where: { endpoint: subscription.endpoint } });
    if (existing) {
      existing.userId = userId;
      existing.p256dh = subscription.keys.p256dh;
      existing.auth = subscription.keys.auth;
      existing.userAgent = userAgent;
      return this.subRepo.save(existing);
    }
    return this.subRepo.save(
      this.subRepo.create({
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        userAgent,
      }),
    );
  }

  async unsubscribe(endpoint: string): Promise<void> {
    await this.subRepo.delete({ endpoint });
  }

  /**
   * Envoie un push à tous les abonnements actifs d'un user.
   * Les abonnements expirés (410 Gone) sont automatiquement supprimés.
   */
  async sendToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
    if (!this.enabled) return { sent: 0, failed: 0 };

    const subs = await this.subRepo.find({ where: { userId } });
    if (subs.length === 0) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify(payload),
          );
          sent++;
        } catch (err: any) {
          failed++;
          // 410 Gone / 404 Not Found = abonnement périmé → cleanup
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            this.logger.debug(`Abonnement périmé supprimé: ${sub.endpoint.slice(-30)}`);
            await this.subRepo.delete({ id: sub.id });
          } else {
            this.logger.error(
              `Push échec (status=${err?.statusCode}): ${err?.message ?? err}`,
            );
          }
        }
      }),
    );

    return { sent, failed };
  }

  async sendToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    if (!this.enabled || userIds.length === 0) return;
    const subs = await this.subRepo.find({ where: { userId: In(userIds) } });
    const grouped = new Map<string, PushSubscription[]>();
    for (const s of subs) {
      const list = grouped.get(s.userId) ?? [];
      list.push(s);
      grouped.set(s.userId, list);
    }
    await Promise.all(
      Array.from(grouped.keys()).map((uid) => this.sendToUser(uid, payload)),
    );
  }
}

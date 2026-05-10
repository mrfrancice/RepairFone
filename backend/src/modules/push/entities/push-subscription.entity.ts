import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Abonnement Web Push (VAPID, standard W3C) associé à un user.
 * Un utilisateur peut avoir plusieurs abonnements (un par navigateur/device).
 */
@Entity('push_subscriptions')
export class PushSubscription extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  // L'endpoint unique fourni par le push service du navigateur (FCM, Mozilla, etc.).
  @Column({ type: 'text', unique: true })
  endpoint: string;

  // Clé publique du client pour chiffrer le payload.
  @Column({ name: 'p256dh_key', type: 'text' })
  p256dh: string;

  // Auth secret pour authentifier le push.
  @Column({ name: 'auth_secret', type: 'text' })
  auth: string;

  // Étiquettes contextuelles (user-agent, OS) — utile pour debug + révocation.
  @Column({ name: 'user_agent', type: 'text', nullable: true })
  userAgent?: string;
}

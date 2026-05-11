import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Token de réinitialisation de mot de passe (one-shot, expirant).
 *
 * Stocké hashé (jamais en clair) : le token brut n'existe qu'au moment
 * de l'envoi du mail. Si la DB fuit, l'attaquant ne peut pas réinitialiser.
 */
@Entity('password_reset_tokens')
export class PasswordResetToken extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  @Index()
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt?: Date;

  @Column({ name: 'request_ip', type: 'varchar', length: 45, nullable: true })
  requestIp?: string;
}

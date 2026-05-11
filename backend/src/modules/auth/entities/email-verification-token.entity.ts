import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

/**
 * Token de vérification d'email (one-shot, expirant 24h).
 *
 * Workflow :
 * 1. User s'inscrit / change d'email → token généré + email envoyé avec lien
 * 2. User clique sur le lien → POST /auth/verify-email avec ce token
 * 3. Backend valide, marque User.isEmailVerified = true, supprime le token
 */
@Entity('email_verification_tokens')
export class EmailVerificationToken extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  // Email à vérifier (peut différer du current si user veut changer d'email)
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ name: 'token_hash', type: 'varchar', length: 255 })
  @Index()
  tokenHash: string;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt: Date;

  @Column({ name: 'used_at', type: 'timestamptz', nullable: true })
  usedAt?: Date;
}

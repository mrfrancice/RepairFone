import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { RepairerProfile } from '../../users/entities/repairer-profile.entity';
import { RepairRequest } from '../../requests/entities/repair-request.entity';

/**
 * Étapes où le client peut noter le réparateur
 */
export enum RatingStep {
  QUOTE_ACCEPTED = 'quote_accepted', // Après acceptation du devis
  IN_PROGRESS = 'in_progress', // Pendant la réparation
  COMPLETED = 'completed', // Après completion de la réparation
  DELIVERED = 'delivered', // Après livraison
}

/**
 * Catégories de notation
 */
export enum RatingCategory {
  COMMUNICATION = 'communication', // Communication avec le réparateur
  QUALITY = 'quality', // Qualité du travail
  TIMELINESS = 'timeliness', // Respect des délais
  PRICE = 'price', // Rapport qualité/prix
  OVERALL = 'overall', // Note globale
}

@Entity('step_ratings')
@Unique(['requestId', 'step', 'category'])
@Index(['repairerId'])
@Index(['clientId'])
export class StepRating extends BaseEntity {
  @ManyToOne(() => RepairRequest, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'request_id' })
  request: RepairRequest;

  @Column({ name: 'request_id', type: 'uuid' })
  @Index()
  requestId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'client_id' })
  client: User;

  @Column({ name: 'client_id', type: 'uuid' })
  clientId: string;

  @ManyToOne(() => RepairerProfile)
  @JoinColumn({ name: 'repairer_id' })
  repairer: RepairerProfile;

  @Column({ name: 'repairer_id', type: 'uuid' })
  repairerId: string;

  @Column({
    type: 'enum',
    enum: RatingStep,
  })
  step: RatingStep;

  @Column({
    type: 'enum',
    enum: RatingCategory,
  })
  category: RatingCategory;

  /**
   * Note de -5 à 5
   * -5 à -1 : Insatisfait
   * 0 : Neutre
   * 1 à 5 : Satisfait
   */
  @Column({ type: 'smallint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;
}

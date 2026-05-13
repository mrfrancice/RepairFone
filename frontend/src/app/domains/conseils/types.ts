// ============================================
// CONSEILS DOMAIN — Types
// ============================================

import type { User } from '@app/domains/users';
import type { Repairer } from '@app/domains/repairers';

export interface ConseilRequest {
  id: string;
  clientId: string;
  client?: User;
  expertId?: string;
  expert?: Repairer;
  type: ConseilType;
  format: ConseilFormat;
  topic: string;
  description: string;
  status: ConseilStatus;
  scheduledAt?: string;
  completedAt?: string;
  rating?: number;
  feedback?: string;
  price?: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type ConseilType = 'diagnostic' | 'software' | 'purchase' | 'maintenance';
export type ConseilFormat = 'chat' | 'call' | 'video';
export type ConseilStatus =
  | 'pending'
  | 'matched'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface CreateConseilDto {
  type: ConseilType;
  format: ConseilFormat;
  topic: string;
  description: string;
  preferredDate?: string;
  preferredTime?: string;
}

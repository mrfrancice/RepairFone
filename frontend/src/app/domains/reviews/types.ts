// ============================================
// REVIEWS DOMAIN — Types
// ============================================

import type { User } from '@app/domains/users';
import type { RepairerProfile } from '@app/domains/repairers';
import type { RepairRequest } from '@app/domains/requests';

export interface Review {
  id: string;
  requestId: string;
  request?: RepairRequest;
  clientId: string;
  client?: User;
  repairerId: string;
  repairer?: RepairerProfile;
  rating: number;
  qualityRating?: number;
  communicationRating?: number;
  timelinessRating?: number;
  comment?: string;
  response?: string;
  responseAt?: string;
  isVisible: boolean;
  createdAt: string;
}

export interface CreateReviewDto {
  requestId: string;
  rating: number;
  qualityRating?: number;
  communicationRating?: number;
  timelinessRating?: number;
  comment?: string;
}

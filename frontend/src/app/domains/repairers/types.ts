// ============================================
// REPAIRERS DOMAIN — Types
// ============================================

import type { User } from '@app/domains/users';

export type RepairerType = 'shop' | 'independent';

export type VerificationStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

export type RequestFilterStatus =
  | 'new'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'delivered'
  | 'rejected'
  | 'all';

export interface DaySchedule {
  open: string;
  close: string;
  closed?: boolean;
}

export interface WorkingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface KycDocument {
  id: string;
  type: 'id_card' | 'business_license' | 'certification' | 'other';
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  uploadedAt: string;
}

export interface RepairerBadge {
  id: string;
  type: 'verified' | 'fast_response' | 'top_rated' | 'expert';
  label: string;
  icon: string;
  earnedAt: string;
}

export interface RepairerProfile {
  id: string;
  userId: string;
  type: RepairerType;
  businessName?: string;
  description?: string;
  specialties: string[];
  serviceArea: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  address?: string;
  city?: string;
  commune?: string;
  quarter?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  workingHours?: WorkingHours;
  photos?: string[];
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  kycDocuments?: KycDocument[];
  badges: RepairerBadge[];
  isAvailable: boolean;
  rating?: number;
  reviewCount?: number;
  yearsOfExperience?: number;
  totalRepairs?: number;
  completionRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RepairerStats {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  completionRate: number;
  averageResponseTime: number;
  qualityScore: number;
}

export interface RepairerRequest {
  id: string;
  clientId: string;
  device?: {
    brand?: string;
    model?: string;
    type?: string;
  } | null;
  serviceType?: {
    id?: string;
    name?: string;
  } | null;
  problemDescription?: string;
  photos?: string[];
  serviceMode: 'shop' | 'home';
  urgency: 'normal' | 'express';
  status: string;
  distance?: number;
  createdAt: string;
  client?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  quote?: {
    id: string;
    status: string;
    totalAmount: number;
  };
}

// Nomme `UpdateRepairerSettingsDto` (et non `UpdateProfileDto`) pour eviter
// la collision avec `UpdateProfileDto` de `domains/users` qui cible un
// endpoint different (PATCH /users/profile vs PATCH /repairers/profile/me).
export interface UpdateRepairerSettingsDto {
  type?: RepairerType;
  businessName?: string;
  description?: string;
  specialties?: string[];
  serviceArea?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  address?: string;
  workingHours?: WorkingHours;
  photos?: string[];
}

// Vue "Repairer en tant qu'utilisateur" : utilisee par conseils/types.ts
// (expert?: Repairer). Garde une signature minimaliste compatible avec User.
export interface Repairer extends User {
  repairerProfile: RepairerProfile;
  distance?: number;
}

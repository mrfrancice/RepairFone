// ============================================
// REPAIRERS DOMAIN — Types
// ============================================

import type { User } from '@app/domains/users';

export interface RepairerProfile {
  id: string;
  userId: string;
  businessName: string;
  description?: string;
  address: string;
  city: string;
  commune?: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: VerificationStatus;
  verifiedAt?: string;
  certifications: any[];
  workingHours: WorkingHours;
  rating: number;
  ratingAvg: number;
  ratingCount: number;
  reviewCount: number;
  totalRepairs: number;
  completionRate: number;
  acceptsHomeService: boolean;
  homeServiceRadiusKm: number;
  isAvailable: boolean;
  specialties?: string[];
  // Champs additionnels pour l'affichage UI
  isVerified?: boolean;
  responseTime?: number;
  estimatedPrice?: number;
  estimatedPriceMin?: number;
  estimatedPriceMax?: number;
  photos?: string[];
  galleryImages?: string[];
  badges?: RepairerBadge[];
  phone?: string;
  avatarUrl?: string;
  distance?: number;
  completedRepairs?: number;
  yearsOfExperience?: number;
  acceptanceRate?: number;
  serviceRadius?: number;
}

export type VerificationStatus =
  | 'pending'
  | 'under_review'
  | 'verified'
  | 'rejected'
  | 'suspended';

export interface WorkingHours {
  [day: string]: { open: string; close: string; closed?: boolean };
}

export interface Repairer extends User {
  repairerProfile: RepairerProfile;
  distance?: number;
}

// === STATS & BADGES ===

export interface RepairerStats {
  newRequests: number;
  activeRequests: number;
  completedToday: number;
  completedThisMonth: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  responseRate: number;
  completionRate: number;
  qualityScore: number;
}

export interface RepairerBadge {
  id: string;
  type: BadgeType;
  label: string;
  icon: string;
  earnedAt: string;
}

export type BadgeType = 'verified' | 'fast_response' | 'top_rated' | 'expert' | 'trusted';

// === KYC (verification reparateur) ===

export interface KycDocument {
  id: string;
  userId: string;
  type: KycDocumentType;
  fileUrl: string;
  status: KycDocumentStatus;
  rejectionReason?: string;
  verifiedAt?: string;
  createdAt: string;
}

export type KycDocumentType =
  | 'identity_card'
  | 'business_license'
  | 'certificate'
  | 'photo'
  | 'other';

export type KycDocumentStatus = 'pending' | 'approved' | 'rejected';

// === SEARCH ===

export interface SearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  deviceId?: string;
  serviceTypeId?: string;
  minRating?: number;
  page?: number;
  limit?: number;
}

/**
 * CODE-010: Typed interfaces for Admin module responses
 * Replaces `any[]` with properly typed interfaces
 */

import { VerificationStatus, Certification } from '../../users/entities/repairer-profile.entity';
import { UserRole, UserStatus } from '../../users/entities/user.entity';

// =============================================================================
// USER RESPONSE INTERFACES
// =============================================================================

/**
 * Basic user information for list views
 */
export interface AdminUserListItem {
  id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

/**
 * Paginated user list response
 */
export interface AdminUserListResponse {
  data: AdminUserListItem[];
  total: number;
  page: number;
  limit: number;
}

// =============================================================================
// REPAIRER RESPONSE INTERFACES
// =============================================================================

/**
 * Embedded user information in repairer responses
 */
export interface RepairerUserInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  createdAt: Date;
}

/**
 * Repairer information for admin list views
 */
export interface AdminRepairerListItem {
  id: string;
  userId: string;
  businessName?: string;
  businessType?: string;
  description?: string;
  address?: string;
  city?: string;
  commune?: string;
  quarter?: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verifiedAt?: Date;
  createdAt: Date;
  // Identity documents
  nationalIdNumber?: string;
  nationalIdFrontUrl?: string;
  nationalIdBackUrl?: string;
  dateOfBirth?: Date;
  // Business documents
  rccmNumber?: string;
  rccmDocumentUrl?: string;
  taxId?: string;
  businessPhone?: string;
  businessEmail?: string;
  // Shop
  shopPhotoUrl?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  // User info
  user: RepairerUserInfo | null;
}

/**
 * Verification statistics
 */
export interface VerificationStats {
  pending: number;
  underReview: number;
  verified: number;
  rejected: number;
  suspended: number;
}

/**
 * Paginated repairer list response
 */
export interface AdminRepairerListResponse {
  data: AdminRepairerListItem[];
  total: number;
  page: number;
  limit: number;
  stats: VerificationStats;
}

// =============================================================================
// REQUEST PARAMETERS
// =============================================================================

/**
 * Parameters for listing repairers
 */
export interface RepairerListParams {
  status?: VerificationStatus | 'all';
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Parameters for listing users
 */
export type UserListSortField = 'createdAt' | 'firstName' | 'role' | 'status';
export type ListSortOrder = 'asc' | 'desc';

export interface UserListParams {
  role?: UserRole | 'all';
  status?: UserStatus | 'all';
  page?: number;
  limit?: number;
  search?: string;
  sort?: UserListSortField;
  order?: ListSortOrder;
}

/**
 * Verification decision DTO
 */
export interface VerificationDecisionDto {
  status: 'verified' | 'rejected';
  notes?: string;
}

// =============================================================================
// DETAIL RESPONSE INTERFACES
// =============================================================================

/**
 * Detailed repairer profile for admin view
 */
export interface AdminRepairerDetailResponse {
  id: string;
  userId: string;
  // Personal identification
  dateOfBirth?: Date;
  nationalIdNumber?: string;
  nationalIdFrontUrl?: string;
  nationalIdBackUrl?: string;
  personalAddress?: string;
  // Business information
  businessName?: string;
  businessType?: string;
  description?: string;
  rccmNumber?: string;
  rccmDocumentUrl?: string;
  taxId?: string;
  businessPhone?: string;
  businessEmail?: string;
  // Location
  address?: string;
  city?: string;
  commune?: string;
  quarter?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
  locationVerified?: boolean;
  // Shop details
  shopPhotoUrl?: string;
  specialties?: string[];
  yearsOfExperience?: number;
  // Verification
  verificationStatus: VerificationStatus;
  verificationNotes?: string;
  verifiedAt?: Date;
  idVerified?: boolean;
  businessVerified?: boolean;
  certifications?: Certification[];
  // Stats
  ratingAvg?: number;
  ratingCount?: number;
  totalRepairs?: number;
  completionRate?: number;
  isAvailable: boolean;
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  // User
  user: RepairerUserInfo | null;
}

/**
 * Basic repairer profile info for user detail
 */
export interface UserRepairerProfileInfo {
  id: string;
  businessName?: string;
  verificationStatus: VerificationStatus;
}

/**
 * Detailed user information for admin view
 */
export interface AdminUserDetailResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  preferredLanguage: string;
  createdAt: Date;
  updatedAt: Date;
  repairerProfile: UserRepairerProfileInfo | null;
}

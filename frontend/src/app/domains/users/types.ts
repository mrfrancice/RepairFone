// ============================================
// USERS DOMAIN — Types
// ============================================

export interface User {
  id: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  avatarUrl?: string;
  role: UserRole;
  status: UserStatus;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'client' | 'repairer' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';

// === AUTH DTOs (manipules par core/auth, retournent un User) ===

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface RegisterRequest {
  phone: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface OtpVerifyRequest {
  phone: string;
  code: string;
}

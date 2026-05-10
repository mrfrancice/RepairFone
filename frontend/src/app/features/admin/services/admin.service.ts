import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

// ==========================================
// INTERFACES
// ==========================================

export interface DashboardSummary {
  repairers: {
    total: number;
    pending: number;
    verified: number;
  };
  users: {
    total: number;
    clients: number;
    repairers: number;
    active: number;
    suspended: number;
  };
}

export interface VerificationStats {
  pending: number;
  underReview: number;
  verified: number;
  rejected: number;
  suspended: number;
}

export interface RepairerForVerification {
  id: string;
  userId: string;
  businessName: string;
  businessType?: string;
  description?: string;
  address: string;
  city: string;
  commune?: string;
  quarter?: string;
  latitude?: number;
  longitude?: number;
  verificationStatus: 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';
  verificationNotes?: string;
  verifiedAt?: string;
  createdAt: string;
  // Identity documents
  nationalIdNumber?: string;
  nationalIdFrontUrl?: string;
  nationalIdBackUrl?: string;
  dateOfBirth?: string;
  // Business documents
  rccmNumber?: string;
  rccmDocumentUrl?: string;
  taxId?: string;
  businessPhone?: string;
  businessEmail?: string;
  // Shop
  shopPhotoUrl?: string;
  specialties: string[];
  yearsOfExperience?: number;
  // User
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    email?: string;
    avatarUrl?: string;
    createdAt: string;
  } | null;
}

export interface RepairersListResponse {
  data: RepairerForVerification[];
  total: number;
  page: number;
  limit: number;
  stats: VerificationStats;
}

export interface UserForAdmin {
  id: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  avatarUrl?: string;
  role: 'client' | 'repairer' | 'admin';
  status: 'pending' | 'active' | 'suspended' | 'deactivated';
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  repairerProfile?: {
    id: string;
    businessName?: string;
    verificationStatus: string;
  };
}

export interface UsersListResponse {
  data: UserForAdmin[];
  total: number;
  page: number;
  limit: number;
}

// ==========================================
// PAYMENTS (admin audit)
// ==========================================

export interface PaymentForAdmin {
  id: string;
  paymentNumber: string;
  amount: number;
  platformFee?: number;
  repairerAmount?: number;
  paymentType: string;
  paymentMethod?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'blocked';
  transactionRef?: string;
  paidAt?: string;
  createdAt: string;
  client?: { id: string; firstName?: string; lastName?: string; phone?: string };
  repairer?: { id: string; businessName?: string; user?: { firstName?: string; lastName?: string; phone?: string } };
  request?: { id: string; device?: { brand: string; model: string }; serviceType?: { name: string } };
}

export interface PaymentsAdminListResponse {
  data: PaymentForAdmin[];
  total: number;
}

export interface PaymentsAdminStats {
  total: number;
  byStatus: Record<string, number>;
  revenue: { gross: number; platformFees: number; refunded: number };
}

// ==========================================
// DISPUTES (admin audit)
// ==========================================

export interface DisputeForAdmin {
  id: string;
  reason: string;
  status: 'open' | 'in_review' | 'resolved' | 'closed' | 'rejected';
  description: string;
  resolution?: string;
  resolutionNotes?: string;
  refundAmount?: number;
  resolvedAt?: string;
  createdAt: string;
  client?: { id: string; firstName?: string; lastName?: string; phone?: string };
  repairer?: { id: string; businessName?: string; user?: { firstName?: string; lastName?: string; phone?: string } };
  request?: { id: string; device?: { brand: string; model: string } };
  messages?: Array<{
    id: string;
    message: string;
    senderType: 'client' | 'repairer' | 'support';
    createdAt: string;
    sender?: { firstName?: string; lastName?: string };
  }>;
}

export interface DisputesAdminListResponse {
  data: DisputeForAdmin[];
  total: number;
}

export interface DisputesAdminStats {
  total: number;
  byStatus: Record<string, number>;
  avgResolutionDays: number | null;
  totalRefundedAmount: number;
}

export interface VerificationDecision {
  status: 'verified' | 'rejected';
  notes?: string;
}

// ==========================================
// SERVICE
// ==========================================

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiService);

  // ==========================================
  // DASHBOARD
  // ==========================================

  async getDashboard(): Promise<DashboardSummary> {
    return firstValueFrom(
      this.api.get<DashboardSummary>('/admin/dashboard')
    );
  }

  // ==========================================
  // REPAIRERS
  // ==========================================

  async getRepairers(params?: {
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<RepairersListResponse> {
    return firstValueFrom(
      this.api.get<RepairersListResponse>('/admin/repairers', params)
    );
  }

  async getPendingRepairers(page = 1, limit = 20): Promise<RepairersListResponse> {
    return firstValueFrom(
      this.api.get<RepairersListResponse>('/admin/repairers/pending', { page, limit })
    );
  }

  async getRepairerDetail(id: string): Promise<RepairerForVerification> {
    return firstValueFrom(
      this.api.get<RepairerForVerification>(`/admin/repairers/${id}`)
    );
  }

  async getVerificationStats(): Promise<VerificationStats> {
    return firstValueFrom(
      this.api.get<VerificationStats>('/admin/repairers/stats')
    );
  }

  async verifyRepairer(id: string, decision: VerificationDecision): Promise<any> {
    return firstValueFrom(
      this.api.patch(`/admin/repairers/${id}/verify`, decision)
    );
  }

  async setRepairerUnderReview(id: string, notes?: string): Promise<any> {
    return firstValueFrom(
      this.api.patch(`/admin/repairers/${id}/review`, { notes })
    );
  }

  async suspendRepairer(id: string, reason: string): Promise<any> {
    return firstValueFrom(
      this.api.patch(`/admin/repairers/${id}/suspend`, { reason })
    );
  }

  async reactivateRepairer(id: string): Promise<any> {
    return firstValueFrom(
      this.api.patch(`/admin/repairers/${id}/reactivate`, {})
    );
  }

  // ==========================================
  // USERS
  // ==========================================

  async getUsers(params?: {
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
    search?: string;
    sort?: 'createdAt' | 'firstName' | 'role' | 'status';
    order?: 'asc' | 'desc';
  }): Promise<UsersListResponse> {
    return firstValueFrom(
      this.api.get<UsersListResponse>('/admin/users', params)
    );
  }

  async getUserDetail(id: string): Promise<UserForAdmin> {
    return firstValueFrom(
      this.api.get<UserForAdmin>(`/admin/users/${id}`)
    );
  }

  async activateUser(id: string): Promise<any> {
    return firstValueFrom(
      this.api.patch(`/admin/users/${id}/activate`, {})
    );
  }

  async deactivateUser(id: string, reason?: string): Promise<any> {
    return firstValueFrom(
      this.api.patch(`/admin/users/${id}/deactivate`, { reason })
    );
  }

  async deleteUser(id: string): Promise<any> {
    return firstValueFrom(
      this.api.patch(`/admin/users/${id}/delete`, {})
    );
  }

  // ==========================================
  // PAYMENTS
  // ==========================================

  async getPayments(params?: {
    status?: string;
    paymentMethod?: string;
    paymentType?: string;
    page?: number;
    limit?: number;
    search?: string;
    sort?: 'createdAt' | 'amount' | 'status' | 'paidAt';
    order?: 'asc' | 'desc';
  }): Promise<PaymentsAdminListResponse> {
    return firstValueFrom(
      this.api.get<PaymentsAdminListResponse>('/admin/payments', params)
    );
  }

  async getPaymentDetail(id: string): Promise<PaymentForAdmin> {
    return firstValueFrom(
      this.api.get<PaymentForAdmin>(`/admin/payments/${id}`)
    );
  }

  async getPaymentsStats(): Promise<PaymentsAdminStats> {
    return firstValueFrom(
      this.api.get<PaymentsAdminStats>('/admin/payments/stats')
    );
  }

  // ==========================================
  // DISPUTES
  // ==========================================

  async getDisputes(params?: {
    status?: string;
    reason?: string;
    page?: number;
    limit?: number;
    search?: string;
    sort?: 'createdAt' | 'status' | 'resolvedAt';
    order?: 'asc' | 'desc';
  }): Promise<DisputesAdminListResponse> {
    return firstValueFrom(
      this.api.get<DisputesAdminListResponse>('/admin/disputes', params)
    );
  }

  async getDisputeDetail(id: string): Promise<DisputeForAdmin> {
    return firstValueFrom(
      this.api.get<DisputeForAdmin>(`/admin/disputes/${id}`)
    );
  }

  async getDisputesStats(): Promise<DisputesAdminStats> {
    return firstValueFrom(
      this.api.get<DisputesAdminStats>('/admin/disputes/stats')
    );
  }
}

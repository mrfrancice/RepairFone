import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SettingsService } from '../../../core/services/settings.service';

export type RepairerType = 'shop' | 'independent';
export type VerificationStatus = 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';
export type RequestFilterStatus = 'new' | 'accepted' | 'in_progress' | 'completed' | 'delivered' | 'rejected' | 'all';

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
    radius: number; // km
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

export interface WorkingHours {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
}

export interface DaySchedule {
  open: string; // "08:00"
  close: string; // "18:00"
  closed?: boolean;
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

export interface RepairerStats {
  totalRequests: number;
  completedRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number; // percentage
  completionRate: number; // percentage
  averageResponseTime: number; // hours
  qualityScore: number; // 0-100
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

export interface CreateQuoteDto {
  requestId: string;
  laborCost: number;
  parts: QuotePart[];
  estimatedDuration: string;
  notes?: string;
  validDays?: number;
}

export interface QuotePart {
  name: string;
  quantity: number;
  price: number;
}

export interface UpdateProfileDto {
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

@Injectable({ providedIn: 'root' })
export class RepairerService {
  private readonly api = inject(ApiService);
  private readonly settingsService = inject(SettingsService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Specialties list - now loaded from settings service
  readonly availableSpecialties = computed(() => this.settingsService.getAvailableSpecialties());

  // Get current repairer profile
  async getMyProfile(): Promise<RepairerProfile> {
    return firstValueFrom(
      this.api.get<RepairerProfile>('/repairer/profile/me')
    );
  }

  // Update profile
  async updateProfile(dto: UpdateProfileDto): Promise<RepairerProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.api.patch<RepairerProfile>('/repairer/profile/me', dto)
      );
      return result;
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de la mise à jour du profil');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get dashboard stats
  async getStats(): Promise<RepairerStats> {
    return firstValueFrom(
      this.api.get<RepairerStats>('/repairer/stats')
    );
  }

  // Get requests for repairer
  async getRequests(params?: {
    status?: RequestFilterStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: RepairerRequest[]; total: number }> {
    // Map 'new' to 'pending' for backend compatibility
    const mappedParams = params ? {
      ...params,
      status: params.status === 'new' ? 'pending' : params.status
    } : params;

    return firstValueFrom(
      this.api.get<{ data: RepairerRequest[]; total: number }>('/requests/my', mappedParams)
    );
  }

  // Get single request detail
  async getRequest(id: string): Promise<RepairerRequest> {
    return firstValueFrom(
      this.api.get<RepairerRequest>(`/requests/${id}`)
    );
  }

  // Accept a request
  async acceptRequest(requestId: string): Promise<RepairerRequest> {
    return firstValueFrom(
      this.api.put<RepairerRequest>(`/requests/${requestId}/status`, { status: 'accepted' })
    );
  }

  // Reject a request
  async rejectRequest(requestId: string, reason?: string): Promise<RepairerRequest> {
    return firstValueFrom(
      this.api.put<RepairerRequest>(`/requests/${requestId}/status`, { status: 'rejected', notes: reason })
    );
  }

  // Create a quote for a request
  async createQuote(dto: CreateQuoteDto): Promise<any> {
    return firstValueFrom(
      this.api.post('/quotes', dto)
    );
  }

  // Update request status
  async updateRequestStatus(requestId: string, status: string, notes?: string): Promise<RepairerRequest> {
    return firstValueFrom(
      this.api.put<RepairerRequest>(`/requests/${requestId}/status`, { status, notes })
    );
  }

  // Upload KYC document
  async uploadKycDocument(type: KycDocument['type'], fileUrl: string): Promise<KycDocument> {
    return firstValueFrom(
      this.api.post<KycDocument>('/repairer/kyc', { type, fileUrl })
    );
  }

  // Get revenue data
  async getRevenueData(period: 'week' | 'month' | 'year'): Promise<{
    labels: string[];
    values: number[];
    total: number;
  }> {
    return firstValueFrom(
      this.api.get('/repairer/revenue', { period })
    );
  }

  // Get payment history (as repairer)
  async getPayments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    return firstValueFrom(
      this.api.get('/repairer/payments', params)
    );
  }

  // Get disputes (as repairer)
  async getDisputes(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    return firstValueFrom(
      this.api.get('/repairer/disputes', params)
    );
  }

  // Update availability status
  async updateAvailability(isAvailable: boolean): Promise<RepairerProfile> {
    return firstValueFrom(
      this.api.patch<RepairerProfile>('/repairer/profile/me', { isAvailable })
    );
  }

  // Helper methods
  getVerificationStatusLabel(status: VerificationStatus): string {
    const labels: Record<VerificationStatus, string> = {
      pending: 'En attente de vérification',
      under_review: 'En cours de vérification',
      verified: 'Vérifié',
      rejected: 'Rejeté',
      suspended: 'Suspendu',
    };
    return labels[status] || status;
  }

  getVerificationStatusColor(status: VerificationStatus): string {
    const colors: Record<VerificationStatus, string> = {
      pending: '#f59e0b',
      under_review: '#3b82f6',
      verified: '#10b981',
      rejected: '#ef4444',
      suspended: '#6b7280',
    };
    return colors[status] || '#6b7280';
  }

  getBadgeInfo(type: RepairerBadge['type']): { label: string; icon: string; color: string } {
    const badges: Record<string, { label: string; icon: string; color: string }> = {
      verified: { label: 'Vérifié', icon: '✓', color: '#10b981' },
      fast_response: { label: 'Réponse rapide', icon: '⚡', color: '#f59e0b' },
      top_rated: { label: 'Top noté', icon: '⭐', color: '#eab308' },
      expert: { label: 'Expert', icon: '🏆', color: '#8b5cf6' },
    };
    return badges[type] || { label: type, icon: '🔹', color: '#6b7280' };
  }

  formatRevenue(amount: number): string {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  getQualityScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 75) return 'Très bon';
    if (score >= 60) return 'Bon';
    if (score >= 40) return 'Moyen';
    return 'À améliorer';
  }

  getQualityScoreColor(score: number): string {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  }
}

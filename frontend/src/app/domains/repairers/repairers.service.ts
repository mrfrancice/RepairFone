import { Injectable, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@app/core/services/api.service';
import { SettingsService } from '@app/core/services/settings.service';
import type { CreateQuoteDto } from '@app/domains/quotes';
import type {
  KycDocument,
  RepairerBadge,
  RepairerProfile,
  RepairerRequest,
  RepairerStats,
  UpdateRepairerSettingsDto,
  VerificationStatus,
} from './types';

@Injectable({ providedIn: 'root' })
export class RepairersService {
  private readonly api = inject(ApiService);
  private readonly settingsService = inject(SettingsService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Specialties list - now loaded from settings service
  readonly availableSpecialties = computed(() => this.settingsService.getAvailableSpecialties());

  // Get current repairer profile
  async getMyProfile(): Promise<RepairerProfile> {
    return firstValueFrom(
      this.api.get<RepairerProfile>('/repairers/profile/me')
    );
  }

  // Update profile
  async updateProfile(dto: UpdateRepairerSettingsDto): Promise<RepairerProfile> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.api.patch<RepairerProfile>('/repairers/profile/me', dto)
      );
      return result;
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de la mise à jour du profil');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get dashboard stats (uses generic /requests/stats which adapts to user role)
  async getStats(): Promise<RepairerStats> {
    return firstValueFrom(
      this.api.get<RepairerStats>('/requests/stats')
    );
  }

  // Get requests for repairer
  // `status` peut être un seul statut DB (`pending`) ou une liste CSV
  // (`completed,delivered`) pour les filtres UI qui regroupent plusieurs
  // statuts. Cf. mapFilterToBackendStatus côté composant.
  async getRequests(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: RepairerRequest[]; total: number }> {
    return firstValueFrom(
      this.api.get<{ data: RepairerRequest[]; total: number }>('/requests/my', params)
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
  // TODO: backend n'a pas encore /repairers/kyc — voir ROADMAP P4.2 (KYC complet).
  // En attendant, l'upload identité passe par PATCH /repairers/profile/me avec les URLs.
  async uploadKycDocument(_type: KycDocument['type'], _fileUrl: string): Promise<KycDocument> {
    throw new Error('KYC upload endpoint not implemented yet. See ROADMAP P4.2.');
  }

  // Get revenue data
  // TODO: backend n'a pas encore d'endpoint dédié /repairers/revenue avec breakdown
  // temporel. En attendant on retourne les stats globales de /requests/stats.
  async getRevenueData(_period: 'week' | 'month' | 'year'): Promise<{
    labels: string[];
    values: number[];
    total: number;
  }> {
    // Stub : à remplacer quand l'endpoint existera. Voir ROADMAP P4.2.
    return { labels: [], values: [], total: 0 };
  }

  // Get payment history (as repairer) — utilise /payments/my qui adapte selon le rôle
  async getPayments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    return firstValueFrom(
      this.api.get('/payments/my', params)
    );
  }

  // Get disputes (as repairer) — utilise /disputes/my qui adapte selon le rôle
  async getDisputes(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: any[]; total: number }> {
    return firstValueFrom(
      this.api.get('/disputes/my', params)
    );
  }

  // Update availability status
  async updateAvailability(isAvailable: boolean): Promise<RepairerProfile> {
    return firstValueFrom(
      this.api.patch<RepairerProfile>('/repairers/profile/me/availability', { isAvailable })
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
      pending: '#FFC107',
      under_review: '#1565C0',
      verified: '#4CAF50',
      rejected: '#F44336',
      suspended: '#6b7280',
    };
    return colors[status] || '#6b7280';
  }

  getBadgeInfo(type: RepairerBadge['type']): { label: string; icon: string; color: string } {
    const badges: Record<string, { label: string; icon: string; color: string }> = {
      verified: { label: 'Vérifié', icon: '✓', color: '#4CAF50' },
      fast_response: { label: 'Réponse rapide', icon: '⚡', color: '#FFC107' },
      top_rated: { label: 'Top noté', icon: '⭐', color: '#eab308' },
      expert: { label: 'Expert', icon: '🏆', color: '#FF9800' },
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
    if (score >= 90) return '#4CAF50';
    if (score >= 75) return '#4CAF50';
    if (score >= 60) return '#FFC107';
    if (score >= 40) return '#f97316';
    return '#F44336';
  }
}

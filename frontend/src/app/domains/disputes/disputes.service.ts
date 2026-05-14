import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@app/core/services/api.service';
import { ChipVariant } from '@app/shared/components/ui-chip/ui-chip.component';

export type DisputeReason =
  | 'non_conforming_repair'
  | 'delay'
  | 'price_not_respected'
  | 'damage'
  | 'poor_quality'
  | 'communication'
  | 'other';

export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'closed' | 'rejected';
export type DisputeResolution = 'refund_full' | 'refund_partial' | 'redo_repair' | 'no_action' | 'other';

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderType: 'client' | 'repairer' | 'support';
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface Dispute {
  id: string;
  requestId: string;
  paymentId?: string;
  clientId: string;
  repairerId: string;
  reason: DisputeReason;
  description: string;
  evidencePhotos: string[];
  status: DisputeStatus;
  resolution?: DisputeResolution;
  resolutionNotes?: string;
  refundAmount?: number;
  messages: DisputeMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  request?: {
    id: string;
    device?: { brand: string; model: string };
    serviceType?: { name: string };
  };
  repairer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    repairerProfile?: { businessName?: string };
  };
  payment?: {
    id: string;
    amount: number;
    status: string;
  };
}

export interface CreateDisputeDto {
  requestId: string;
  reason: DisputeReason;
  description: string;
  evidencePhotos?: string[];
}

export interface DisputeReasonInfo {
  id: DisputeReason;
  label: string;
  description: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class DisputesService {
  private readonly api = inject(ApiService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly disputeReasons: DisputeReasonInfo[] = [
    {
      id: 'non_conforming_repair',
      label: 'Réparation non conforme',
      description: 'Le problème n\'est pas résolu ou la réparation ne fonctionne pas',
      icon: '❌',
    },
    {
      id: 'delay',
      label: 'Retard de livraison',
      description: 'Le délai prévu n\'a pas été respecté',
      icon: '⏰',
    },
    {
      id: 'price_not_respected',
      label: 'Prix non respecté',
      description: 'Le montant final diffère du devis accepté',
      icon: '💰',
    },
    {
      id: 'damage',
      label: 'Dommages supplémentaires',
      description: 'L\'appareil a subi des dommages pendant la réparation',
      icon: '💥',
    },
    {
      id: 'poor_quality',
      label: 'Qualité médiocre',
      description: 'La qualité de la réparation n\'est pas satisfaisante',
      icon: '👎',
    },
    {
      id: 'communication',
      label: 'Problème de communication',
      description: 'Le réparateur ne répond pas ou est difficile à joindre',
      icon: '📵',
    },
    {
      id: 'other',
      label: 'Autre raison',
      description: 'Un problème non listé ci-dessus',
      icon: '❓',
    },
  ];

  async createDispute(dto: CreateDisputeDto): Promise<Dispute> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await firstValueFrom(
        this.api.post<Dispute>('/disputes', dto)
      );
      return result;
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de la création du litige');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getDispute(id: string): Promise<Dispute> {
    return firstValueFrom(this.api.get<Dispute>(`/disputes/${id}`));
  }

  async getMyDisputes(params?: {
    status?: DisputeStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: Dispute[]; total: number }> {
    return firstValueFrom(
      this.api.get<{ data: Dispute[]; total: number }>('/disputes/my', params)
    );
  }

  async getDisputeByRequest(requestId: string): Promise<Dispute | null> {
    try {
      return await firstValueFrom(
        this.api.get<Dispute>(`/disputes/request/${requestId}`)
      );
    } catch {
      return null;
    }
  }

  async addMessage(disputeId: string, message: string, attachments?: string[]): Promise<DisputeMessage> {
    return firstValueFrom(
      this.api.post<DisputeMessage>(`/disputes/${disputeId}/messages`, {
        message,
        attachments,
      })
    );
  }

  async addEvidence(disputeId: string, photos: string[]): Promise<Dispute> {
    return firstValueFrom(
      this.api.post<Dispute>(`/disputes/${disputeId}/evidence`, { photos })
    );
  }

  async cancelDispute(disputeId: string): Promise<Dispute> {
    return firstValueFrom(
      this.api.post<Dispute>(`/disputes/${disputeId}/cancel`, {})
    );
  }

  getStatusLabel(status: DisputeStatus): string {
    const labels: Record<DisputeStatus, string> = {
      open: 'Ouvert',
      in_review: 'En cours d\'examen',
      resolved: 'Résolu',
      closed: 'Fermé',
      rejected: 'Rejeté',
    };
    return labels[status] || status;
  }

  getStatusColor(status: DisputeStatus): ChipVariant {
    const variants: Record<DisputeStatus, ChipVariant> = {
      open: 'warning',
      in_review: 'info',
      resolved: 'success',
      closed: 'default',
      rejected: 'danger',
    };
    return variants[status] || 'default';
  }

  getReasonLabel(reason: DisputeReason): string {
    const info = this.disputeReasons.find(r => r.id === reason);
    return info?.label || reason;
  }

  getReasonIcon(reason: DisputeReason): string {
    const info = this.disputeReasons.find(r => r.id === reason);
    return info?.icon || '❓';
  }

  getResolutionLabel(resolution: DisputeResolution): string {
    const labels: Record<DisputeResolution, string> = {
      refund_full: 'Remboursement intégral',
      refund_partial: 'Remboursement partiel',
      redo_repair: 'Réparation à refaire',
      no_action: 'Aucune action requise',
      other: 'Autre résolution',
    };
    return labels[resolution] || resolution;
  }

  // Calculate estimated resolution time based on status
  getEstimatedResolutionTime(dispute: Dispute): string {
    switch (dispute.status) {
      case 'open':
        return '24-48 heures pour prise en charge';
      case 'in_review':
        return '3-5 jours ouvrés';
      default:
        return '';
    }
  }
}

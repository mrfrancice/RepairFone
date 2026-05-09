import { Injectable } from '@angular/core';

// ============================================================================
// Types
// ============================================================================

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'delivered' | 'quote_sent' | 'quote_accepted' | 'in_progress' | 'cancelled';
export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type DisputeStatus = 'open' | 'in_review' | 'resolved' | 'closed' | 'rejected';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'blocked';
export type PaymentType = 'deposit' | 'balance' | 'full';
export type UrgencyLevel = 'normal' | 'express';
export type ChipVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'under_review' | 'verified';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending' | 'deactivated';
export type SessionStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'accepted' | 'in_progress';

// ============================================================================
// Status Configuration
// ============================================================================

interface StatusConfig {
  label: string;
  color: string;
  chipVariant: ChipVariant;
  bgGradient: string;
  textColor: string;
}

const REQUEST_STATUS_CONFIG: Record<RequestStatus, StatusConfig> = {
  pending: {
    label: 'En cours d\'analyse',
    color: '#FFC107',
    chipVariant: 'warning',
    bgGradient: 'linear-gradient(135deg, #FFF8E1, #FFE082)',
    textColor: '#92400e',
  },
  accepted: {
    label: 'Acceptée',
    color: '#4CAF50',
    chipVariant: 'success',
    bgGradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    textColor: '#065f46',
  },
  rejected: {
    label: 'Rejetée',
    color: '#F44336',
    chipVariant: 'danger',
    bgGradient: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
    textColor: '#991b1b',
  },
  completed: {
    label: 'Terminée',
    color: '#FF9800',
    chipVariant: 'primary',
    bgGradient: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
    textColor: '#5b21b6',
  },
  delivered: {
    label: 'Livrée',
    color: '#1565C0',
    chipVariant: 'info',
    bgGradient: 'linear-gradient(135deg, #cffafe, #a5f3fc)',
    textColor: '#0e7490',
  },
  quote_sent: {
    label: 'Devis envoyé',
    color: '#1565C0',
    chipVariant: 'info',
    bgGradient: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
    textColor: '#1e40af',
  },
  quote_accepted: {
    label: 'Devis accepté',
    color: '#1565C0',
    chipVariant: 'info',
    bgGradient: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
    textColor: '#1e40af',
  },
  in_progress: {
    label: 'En cours',
    color: '#FF9800',
    chipVariant: 'primary',
    bgGradient: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
    textColor: '#5b21b6',
  },
  cancelled: {
    label: 'Annulée',
    color: '#6b7280',
    chipVariant: 'default',
    bgGradient: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    textColor: '#4B5563',
  },
};

const QUOTE_STATUS_CONFIG: Record<QuoteStatus, StatusConfig> = {
  pending: {
    label: 'En attente',
    color: '#FFC107',
    chipVariant: 'warning',
    bgGradient: 'linear-gradient(135deg, #FFF8E1, #FFE082)',
    textColor: '#92400e',
  },
  accepted: {
    label: 'Accepté',
    color: '#4CAF50',
    chipVariant: 'success',
    bgGradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    textColor: '#065f46',
  },
  rejected: {
    label: 'Refusé',
    color: '#F44336',
    chipVariant: 'danger',
    bgGradient: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
    textColor: '#991b1b',
  },
  expired: {
    label: 'Expiré',
    color: '#6b7280',
    chipVariant: 'default',
    bgGradient: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    textColor: '#4B5563',
  },
};

const DISPUTE_STATUS_CONFIG: Record<DisputeStatus, StatusConfig> = {
  open: {
    label: 'Ouvert',
    color: '#FFC107',
    chipVariant: 'warning',
    bgGradient: 'linear-gradient(135deg, #FFF8E1, #FFE082)',
    textColor: '#92400e',
  },
  in_review: {
    label: 'En cours d\'examen',
    color: '#1565C0',
    chipVariant: 'info',
    bgGradient: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
    textColor: '#1e40af',
  },
  resolved: {
    label: 'Résolu',
    color: '#4CAF50',
    chipVariant: 'success',
    bgGradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    textColor: '#065f46',
  },
  closed: {
    label: 'Fermé',
    color: '#6b7280',
    chipVariant: 'default',
    bgGradient: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    textColor: '#4B5563',
  },
  rejected: {
    label: 'Rejeté',
    color: '#F44336',
    chipVariant: 'danger',
    bgGradient: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
    textColor: '#991b1b',
  },
};

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  pending: {
    label: 'En attente',
    color: '#FFC107',
    chipVariant: 'warning',
    bgGradient: 'linear-gradient(135deg, #FFF8E1, #FFE082)',
    textColor: '#92400e',
  },
  processing: {
    label: 'En cours',
    color: '#1565C0',
    chipVariant: 'info',
    bgGradient: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
    textColor: '#1e40af',
  },
  completed: {
    label: 'Payé',
    color: '#4CAF50',
    chipVariant: 'success',
    bgGradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    textColor: '#065f46',
  },
  failed: {
    label: 'Échoué',
    color: '#F44336',
    chipVariant: 'danger',
    bgGradient: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
    textColor: '#991b1b',
  },
  refunded: {
    label: 'Remboursé',
    color: '#FF9800',
    chipVariant: 'primary',
    bgGradient: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
    textColor: '#5b21b6',
  },
  blocked: {
    label: 'Bloqué',
    color: '#F44336',
    chipVariant: 'danger',
    bgGradient: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
    textColor: '#991b1b',
  },
};

const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  deposit: 'Acompte',
  balance: 'Solde',
  full: 'Paiement complet',
};

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string }> = {
  normal: { label: 'Normal', color: '#4CAF50' },
  express: { label: 'Express (+ 30%)', color: '#C62828' },
};

const VERIFICATION_STATUS_CONFIG: Record<VerificationStatus, StatusConfig> = {
  pending: {
    label: 'En attente',
    color: '#FFC107',
    chipVariant: 'warning',
    bgGradient: 'linear-gradient(135deg, #FFF8E1, #FFE082)',
    textColor: '#92400e',
  },
  under_review: {
    label: 'En révision',
    color: '#1565C0',
    chipVariant: 'info',
    bgGradient: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
    textColor: '#1e40af',
  },
  verified: {
    label: 'Vérifié',
    color: '#4CAF50',
    chipVariant: 'success',
    bgGradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    textColor: '#065f46',
  },
  approved: {
    label: 'Approuvé',
    color: '#4CAF50',
    chipVariant: 'success',
    bgGradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    textColor: '#065f46',
  },
  rejected: {
    label: 'Rejeté',
    color: '#F44336',
    chipVariant: 'danger',
    bgGradient: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
    textColor: '#991b1b',
  },
  suspended: {
    label: 'Suspendu',
    color: '#6b7280',
    chipVariant: 'default',
    bgGradient: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    textColor: '#4B5563',
  },
};

const USER_STATUS_CONFIG: Record<UserStatus, StatusConfig> = {
  active: {
    label: 'Actif',
    color: '#4CAF50',
    chipVariant: 'success',
    bgGradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    textColor: '#065f46',
  },
  inactive: {
    label: 'Inactif',
    color: '#6b7280',
    chipVariant: 'default',
    bgGradient: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    textColor: '#4B5563',
  },
  suspended: {
    label: 'Suspendu',
    color: '#F44336',
    chipVariant: 'danger',
    bgGradient: 'linear-gradient(135deg, #FFEBEE, #FFCDD2)',
    textColor: '#991b1b',
  },
  pending: {
    label: 'En attente',
    color: '#FFC107',
    chipVariant: 'warning',
    bgGradient: 'linear-gradient(135deg, #FFF8E1, #FFE082)',
    textColor: '#92400e',
  },
  deactivated: {
    label: 'Désactivé',
    color: '#6b7280',
    chipVariant: 'default',
    bgGradient: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    textColor: '#4B5563',
  },
};

const SESSION_STATUS_CONFIG: Record<SessionStatus, StatusConfig> = {
  pending: {
    label: 'En attente',
    color: '#FFC107',
    chipVariant: 'warning',
    bgGradient: 'linear-gradient(135deg, #FFF8E1, #FFE082)',
    textColor: '#92400e',
  },
  accepted: {
    label: 'Acceptée',
    color: '#4CAF50',
    chipVariant: 'success',
    bgGradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    textColor: '#065f46',
  },
  active: {
    label: 'En cours',
    color: '#1565C0',
    chipVariant: 'info',
    bgGradient: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
    textColor: '#1e40af',
  },
  in_progress: {
    label: 'En cours',
    color: '#1565C0',
    chipVariant: 'info',
    bgGradient: 'linear-gradient(135deg, #E3F2FD, #BBDEFB)',
    textColor: '#1e40af',
  },
  completed: {
    label: 'Terminée',
    color: '#4CAF50',
    chipVariant: 'success',
    bgGradient: 'linear-gradient(135deg, #E8F5E9, #C8E6C9)',
    textColor: '#065f46',
  },
  cancelled: {
    label: 'Annulée',
    color: '#6b7280',
    chipVariant: 'default',
    bgGradient: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    textColor: '#4B5563',
  },
};

// ============================================================================
// Service
// ============================================================================

@Injectable({ providedIn: 'root' })
export class StatusLabelsService {
  // ---------------------------------------------------------------------------
  // Request Status
  // ---------------------------------------------------------------------------

  getRequestStatusLabel(status: RequestStatus): string {
    return REQUEST_STATUS_CONFIG[status]?.label || status;
  }

  getRequestStatusColor(status: RequestStatus): string {
    return REQUEST_STATUS_CONFIG[status]?.color || '#6b7280';
  }

  getRequestStatusChipVariant(status: RequestStatus): ChipVariant {
    return REQUEST_STATUS_CONFIG[status]?.chipVariant || 'default';
  }

  getRequestStatusStyle(status: RequestStatus): { background: string; color: string } {
    const config = REQUEST_STATUS_CONFIG[status];
    return {
      background: config?.bgGradient || 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
      color: config?.textColor || '#4B5563',
    };
  }

  // ---------------------------------------------------------------------------
  // Quote Status
  // ---------------------------------------------------------------------------

  getQuoteStatusLabel(status: QuoteStatus): string {
    return QUOTE_STATUS_CONFIG[status]?.label || status;
  }

  getQuoteStatusColor(status: QuoteStatus): string {
    return QUOTE_STATUS_CONFIG[status]?.color || '#6b7280';
  }

  getQuoteStatusChipVariant(status: QuoteStatus): ChipVariant {
    return QUOTE_STATUS_CONFIG[status]?.chipVariant || 'default';
  }

  getQuoteStatusStyle(status: QuoteStatus): { background: string; color: string } {
    const config = QUOTE_STATUS_CONFIG[status];
    return {
      background: config?.bgGradient || 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
      color: config?.textColor || '#4B5563',
    };
  }

  // ---------------------------------------------------------------------------
  // Dispute Status
  // ---------------------------------------------------------------------------

  getDisputeStatusLabel(status: DisputeStatus): string {
    return DISPUTE_STATUS_CONFIG[status]?.label || status;
  }

  getDisputeStatusColor(status: DisputeStatus): string {
    return DISPUTE_STATUS_CONFIG[status]?.color || '#6b7280';
  }

  getDisputeStatusChipVariant(status: DisputeStatus): ChipVariant {
    return DISPUTE_STATUS_CONFIG[status]?.chipVariant || 'default';
  }

  getDisputeStatusStyle(status: DisputeStatus): { background: string; color: string } {
    const config = DISPUTE_STATUS_CONFIG[status];
    return {
      background: config?.bgGradient || 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
      color: config?.textColor || '#4B5563',
    };
  }

  // ---------------------------------------------------------------------------
  // Payment Status
  // ---------------------------------------------------------------------------

  getPaymentStatusLabel(status: PaymentStatus): string {
    return PAYMENT_STATUS_CONFIG[status]?.label || status;
  }

  getPaymentStatusColor(status: PaymentStatus): string {
    return PAYMENT_STATUS_CONFIG[status]?.color || '#6b7280';
  }

  getPaymentStatusChipVariant(status: PaymentStatus): ChipVariant {
    return PAYMENT_STATUS_CONFIG[status]?.chipVariant || 'default';
  }

  getPaymentStatusStyle(status: PaymentStatus): { background: string; color: string } {
    const config = PAYMENT_STATUS_CONFIG[status];
    return {
      background: config?.bgGradient || 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
      color: config?.textColor || '#4B5563',
    };
  }

  // ---------------------------------------------------------------------------
  // Payment Type
  // ---------------------------------------------------------------------------

  getPaymentTypeLabel(type: PaymentType): string {
    return PAYMENT_TYPE_LABELS[type] || type;
  }

  // ---------------------------------------------------------------------------
  // Urgency
  // ---------------------------------------------------------------------------

  getUrgencyLabel(urgency: UrgencyLevel): string {
    return URGENCY_CONFIG[urgency]?.label || urgency;
  }

  getUrgencyColor(urgency: UrgencyLevel): string {
    return URGENCY_CONFIG[urgency]?.color || '#6b7280';
  }

  // ---------------------------------------------------------------------------
  // Verification Status
  // ---------------------------------------------------------------------------

  getVerificationStatusLabel(status: VerificationStatus): string {
    return VERIFICATION_STATUS_CONFIG[status]?.label || status;
  }

  getVerificationStatusColor(status: VerificationStatus): string {
    return VERIFICATION_STATUS_CONFIG[status]?.color || '#6b7280';
  }

  getVerificationStatusChipVariant(status: VerificationStatus): ChipVariant {
    return VERIFICATION_STATUS_CONFIG[status]?.chipVariant || 'default';
  }

  // ---------------------------------------------------------------------------
  // User Status
  // ---------------------------------------------------------------------------

  getUserStatusLabel(status: UserStatus): string {
    return USER_STATUS_CONFIG[status]?.label || status;
  }

  getUserStatusColor(status: UserStatus): string {
    return USER_STATUS_CONFIG[status]?.color || '#6b7280';
  }

  getUserStatusChipVariant(status: UserStatus): ChipVariant {
    return USER_STATUS_CONFIG[status]?.chipVariant || 'default';
  }

  // ---------------------------------------------------------------------------
  // Session Status
  // ---------------------------------------------------------------------------

  getSessionStatusLabel(status: SessionStatus): string {
    return SESSION_STATUS_CONFIG[status]?.label || status;
  }

  getSessionStatusColor(status: SessionStatus): string {
    return SESSION_STATUS_CONFIG[status]?.color || '#6b7280';
  }

  getSessionStatusChipVariant(status: SessionStatus): ChipVariant {
    return SESSION_STATUS_CONFIG[status]?.chipVariant || 'default';
  }

  // ---------------------------------------------------------------------------
  // Generic Status (for backward compatibility)
  // ---------------------------------------------------------------------------

  getStatusLabel(
    status: string,
    type: 'request' | 'quote' | 'dispute' | 'payment' = 'request'
  ): string {
    switch (type) {
      case 'request':
        return this.getRequestStatusLabel(status as RequestStatus);
      case 'quote':
        return this.getQuoteStatusLabel(status as QuoteStatus);
      case 'dispute':
        return this.getDisputeStatusLabel(status as DisputeStatus);
      case 'payment':
        return this.getPaymentStatusLabel(status as PaymentStatus);
      default:
        return status;
    }
  }

  getStatusColor(
    status: string,
    type: 'request' | 'quote' | 'dispute' | 'payment' = 'request'
  ): string {
    switch (type) {
      case 'request':
        return this.getRequestStatusColor(status as RequestStatus);
      case 'quote':
        return this.getQuoteStatusColor(status as QuoteStatus);
      case 'dispute':
        return this.getDisputeStatusColor(status as DisputeStatus);
      case 'payment':
        return this.getPaymentStatusColor(status as PaymentStatus);
      default:
        return '#6b7280';
    }
  }
}

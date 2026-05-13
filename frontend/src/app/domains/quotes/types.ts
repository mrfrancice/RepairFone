// ============================================
// QUOTES DOMAIN — Types
// ============================================

import type { Repairer } from '@app/domains/repairers';
import type { RepairRequest } from '@app/domains/requests';

export interface Quote {
  id: string;
  requestId: string;
  request?: RepairRequest;
  repairerId: string;
  repairer?: Repairer;
  status: QuoteStatus;
  laborCost: number;
  partsCost: number;
  additionalCost?: number;
  totalAmount: number;
  currency: string;
  estimatedDuration: number;
  estimatedCompletionDate?: string;
  partsDetails?: QuotePart[];
  notes?: string;
  validUntil: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'revised';

export interface QuotePart {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface CreateQuoteDto {
  requestId: string;
  laborCost: number;
  partsCost: number;
  additionalCost?: number;
  estimatedDuration: number;
  estimatedCompletionDate?: string;
  partsDetails?: QuotePart[];
  notes?: string;
  validDays?: number;
}

// ============================================
// QUOTES DOMAIN — Types
// ============================================

export type QuoteStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export interface QuotePart {
  name: string;
  description?: string;
  price: number;
  quantity: number;
}

export interface Quote {
  id: string;
  requestId: string;
  repairerId: string;
  laborCost: number;
  partsCost: number;
  totalAmount: number;
  estimatedDuration: string;
  validUntil: string;
  status: QuoteStatus;
  parts: QuotePart[];
  notes?: string;
  rejectionReason?: string;
  clientProposedPrice?: number;
  createdAt: string;
  updatedAt: string;
  rejectedAt?: string;
  acceptedAt?: string;
  request?: {
    id: string;
    description: string;
    device?: {
      brand: string;
      model: string;
    };
    serviceType?: {
      name: string;
    };
    urgency?: 'normal' | 'express';
    urgencySupplement?: number;
  };
  repairer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    repairerProfile?: {
      businessName?: string;
      rating?: number;
    };
  };
}

export interface CreateQuoteDto {
  requestId: string;
  laborCost: number;
  parts: QuotePart[];
  estimatedDuration: string;
  validDays?: number;
  notes?: string;
}

export interface UpdateQuoteDto {
  status?: QuoteStatus;
  laborCost?: number;
  parts?: QuotePart[];
  estimatedDuration?: string;
  notes?: string;
}

// ============================================
// PAYMENTS DOMAIN — Types
// ============================================

import type { RepairRequest } from '@app/domains/requests';
import type { Quote } from '@app/domains/quotes';

export interface Payment {
  id: string;
  requestId: string;
  request?: RepairRequest;
  quoteId?: string;
  quote?: Quote;
  clientId: string;
  repairerId: string;
  amount: number;
  platformFee: number;
  repairerAmount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  providerRef?: string;
  depositAmount?: number;
  balanceAmount?: number;
  paidAt?: string;
  refundedAt?: string;
  refundReason?: string;
  blockedReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'orange_money' | 'mtn_money' | 'wave' | 'cash' | 'card';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'blocked'
  | 'cancelled';

export interface CreatePaymentDto {
  requestId: string;
  quoteId?: string;
  amount: number;
  method: PaymentMethod;
  isDeposit?: boolean;
}

export interface PaymentInitResponse {
  paymentId: string;
  redirectUrl?: string;
  ussdCode?: string;
  instructions?: string;
}

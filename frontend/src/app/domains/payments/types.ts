// ============================================
// PAYMENTS DOMAIN — Types
// ============================================

export type PaymentMethod = 'orange_money' | 'mtn_money' | 'wave' | 'card';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'blocked';

export type PaymentType = 'deposit' | 'balance' | 'full';

export interface Payment {
  id: string;
  requestId: string;
  quoteId: string;
  clientId: string;
  repairerId: string;
  amount: number;
  platformFee: number;
  repairerAmount: number;
  paymentType: PaymentType;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  phoneNumber?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  request?: {
    id: string;
    device?: { brand: string; model: string };
    serviceType?: { name: string };
  };
  client?: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  repairer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    repairerProfile?: { businessName?: string };
  };
}

export interface PaymentSummary {
  quoteAmount: number;
  platformFee: number;
  platformFeePercent: number;
  totalAmount: number;
  depositAmount?: number;
  depositPercent?: number;
  balanceAmount?: number;
}

export interface InitiatePaymentDto {
  requestId: string;
  quoteId: string;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  phoneNumber: string;
}

export interface PaymentMethodInfo {
  id: PaymentMethod;
  name: string;
  icon: string;
  color: string;
  description: string;
  available: boolean;
  minAmount?: number;
  maxAmount?: number;
}

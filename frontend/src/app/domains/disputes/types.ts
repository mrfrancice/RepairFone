// ============================================
// DISPUTES DOMAIN — Types
// ============================================

import type { User } from '@app/domains/users';
import type { RepairRequest } from '@app/domains/requests';
import type { Payment } from '@app/domains/payments';

export interface Dispute {
  id: string;
  requestId: string;
  request?: RepairRequest;
  paymentId?: string;
  payment?: Payment;
  openedBy: string;
  openedByUser?: User;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  evidences: DisputeEvidence[];
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export type DisputeReason =
  | 'non_conforming_repair'
  | 'incomplete_repair'
  | 'delay'
  | 'price_mismatch'
  | 'damaged_device'
  | 'communication_issue'
  | 'other';

export type DisputeStatus = 'open' | 'under_review' | 'resolved' | 'closed' | 'escalated';

export interface DisputeEvidence {
  id: string;
  type: 'image' | 'document' | 'text';
  url?: string;
  content?: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CreateDisputeDto {
  requestId: string;
  reason: DisputeReason;
  description: string;
  evidences?: File[];
}

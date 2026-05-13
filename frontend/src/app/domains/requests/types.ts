// ============================================
// REQUESTS DOMAIN — Types
// ============================================

import type { User } from '@app/domains/users';
import type { Repairer } from '@app/domains/repairers';
import type { Device, ServiceType } from '@app/domains/devices';

export interface RepairRequest {
  id: string;
  requestNumber: string;
  clientId: string;
  client?: User;
  repairerId?: string;
  repairer?: Repairer;
  deviceId?: string;
  device?: Device;
  serviceTypeId?: string;
  serviceType?: ServiceType;
  status: RequestStatus;
  deliveryMode: DeliveryMode;
  description: string;
  deviceBrand?: string;
  deviceModel?: string;
  deviceSerialNumber?: string;
  images: string[];
  estimatedPrice?: number;
  finalPrice?: number;
  currency: string;
  preferredDate?: string;
  preferredTime?: string;
  scheduledAt?: string;
  serviceAddress?: string;
  clientLatitude?: number;
  clientLongitude?: number;
  clientAddress?: string;
  estimatedDuration?: number;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
  statusHistory?: RequestStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export type RequestStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'in_progress'
  | 'awaiting_parts'
  | 'completed'
  | 'delivered'
  | 'cancelled'
  | 'disputed';

export type DeliveryMode = 'in_shop' | 'at_home' | 'postal';

export interface RequestStatusHistory {
  id: string;
  requestId: string;
  status: RequestStatus;
  comment?: string;
  changedBy: string;
  createdAt: string;
}

export interface CreateRequestDto {
  repairerId: string;
  deviceId?: string;
  serviceTypeId?: string;
  description: string;
  deviceBrand?: string;
  deviceModel?: string;
  preferredDate?: string;
  preferredTime?: string;
  deliveryMode?: DeliveryMode;
  clientLatitude?: number;
  clientLongitude?: number;
  clientAddress?: string;
  images?: string[];
}

export interface UpdateRequestStatusDto {
  status: RequestStatus;
  comment?: string;
  estimatedPrice?: number;
  estimatedDuration?: number;
}

// === URGENCY ===

export type UrgencyLevel = 'normal' | 'express';

export interface UrgencyOption {
  level: UrgencyLevel;
  label: string;
  description: string;
  additionalFee?: number;
  estimatedTime?: string;
}

// === RECEIPT / PROOF ===

export interface DepositReceipt {
  id: string;
  requestId: string;
  receiptNumber: string;
  deviceDescription: string;
  deviceCondition: string;
  accessories?: string[];
  clientSignature?: string;
  repairerSignature?: string;
  depositDate: string;
  expectedReturnDate?: string;
  pdfUrl?: string;
  createdAt: string;
}

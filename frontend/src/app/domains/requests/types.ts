// ============================================
// REQUESTS DOMAIN — Types
// ============================================

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'delivered';
export type UrgencyLevel = 'normal' | 'express';
export type DeliveryMode = 'in_shop' | 'at_home' | 'postal';

export interface RepairRequest {
  id: string;
  clientId: string;
  repairerId: string;
  deviceId: string;
  serviceTypeId: string;
  status: RequestStatus;
  description: string;
  preferredDate?: string;
  preferredTime?: string;
  estimatedPrice?: number;
  estimatedDuration?: number;
  clientAddress?: string;
  clientLatitude?: number;
  clientLongitude?: number;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  urgency: UrgencyLevel;
  urgencySupplement?: number;
  client?: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone: string;
  };
  repairer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    phone: string;
    avatarUrl?: string;
    repairerProfile?: {
      businessName?: string;
      rating?: number;
      reviewCount?: number;
      address?: string;
      latitude?: number;
      longitude?: number;
      isAvailable?: boolean;
    };
  };
  deliveryMode?: DeliveryMode;
  images?: string[];
  device?: {
    id: string;
    brand: string;
    model: string;
    category: string;
  };
  serviceType?: {
    id: string;
    name: string;
    basePrice: number;
    estimatedDuration: number;
  };
  quote?: {
    id: string;
    laborCost: number;
    partsCost: number;
    totalAmount: number;
    estimatedDuration: string;
    validUntil: string;
    status: 'pending' | 'accepted' | 'rejected';
    parts?: { name: string; price: number; quantity: number }[];
    createdAt: string;
  };
  statusHistory?: {
    id: string;
    status: RequestStatus;
    comment?: string;
    createdAt: string;
  }[];
}

export interface CreateRequestDto {
  repairerId: string;
  deviceId?: string;
  serviceTypeId?: string;
  description: string;
  preferredDate?: string;
  preferredTime?: string;
  clientLatitude?: number;
  clientLongitude?: number;
  clientAddress?: string;
  deliveryMode?: DeliveryMode;
  images?: string[];
  urgency?: UrgencyLevel;
}

export interface UpdateStatusDto {
  status: RequestStatus;
  comment?: string;
  rejectionReason?: string;
}

export interface RequestStats {
  pending: number;
  accepted: number;
  rejected: number;
  completed: number;
  delivered: number;
  total: number;
}

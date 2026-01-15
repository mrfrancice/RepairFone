import { RequestStatus, DeliveryMode, RepairRequest } from '../entities/repair-request.entity';

/**
 * Repairer profile summary for request responses
 */
export interface RepairerProfileSummary {
  id: string;
  businessName: string;
  rating: number;
  reviewCount: number;
  address: string;
  latitude?: number;
  longitude?: number;
  isAvailable: boolean;
}

/**
 * Repairer summary for request responses
 */
export interface RepairerSummary {
  id: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  repairerProfile: RepairerProfileSummary;
}

/**
 * Client summary for request responses
 */
export interface ClientSummary {
  id: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

/**
 * Device summary for request responses
 */
export interface DeviceSummary {
  id: string;
  brandId: string;
  name: string;
}

/**
 * Service type summary for request responses
 */
export interface ServiceTypeSummary {
  id: string;
  name: string;
  categoryId: string;
}

/**
 * Status history entry
 */
export interface StatusHistoryEntry {
  id: string;
  status: RequestStatus;
  comment?: string;
  changedBy: string;
  createdAt: Date;
}

/**
 * Base request response properties (common fields)
 */
interface BaseRequestFields {
  id: string;
  requestNumber: string;
  clientId: string;
  repairerId?: string;
  deviceId?: string;
  serviceTypeId?: string;
  status: RequestStatus;
  description?: string;
  images?: string[];
  urgency?: string;
  currency?: string;
  preferredDate?: Date;
  preferredTime?: string;
  clientLatitude?: number;
  clientLongitude?: number;
  clientAddress?: string;
  deliveryMode?: DeliveryMode;
  rejectionReason?: string;
  acceptedAt?: Date;
  rejectedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full request response with all relations
 * Uses intersection to combine base fields with the original entity for spread compatibility
 */
export type RequestResponse = Omit<RepairRequest, 'client' | 'repairer'> & {
  repairer: RepairerSummary | null;
  client: ClientSummary | null;
};

/**
 * Client-facing request response (with repairer info)
 */
export type ClientRequestResponse = Omit<RepairRequest, 'client' | 'repairer'> & {
  repairer: RepairerSummary | null;
};

/**
 * Repairer-facing request response (with client info)
 */
export type RepairerRequestResponse = Omit<RepairRequest, 'client' | 'repairer'> & {
  client: ClientSummary | null;
};

/**
 * Paginated request list response
 */
export interface PaginatedRequestResponse<T = RequestResponse> {
  data: T[];
  total: number;
}

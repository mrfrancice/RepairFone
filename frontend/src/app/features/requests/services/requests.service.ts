import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'delivered';
export type UrgencyLevel = 'normal' | 'express';

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
  deliveryMode?: 'in_shop' | 'at_home' | 'postal';
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
  deliveryMode?: 'in_shop' | 'at_home' | 'postal';
  images?: string[];
  urgency?: UrgencyLevel;
}

export interface UpdateStatusDto {
  status: RequestStatus;
  comment?: string;
  rejectionReason?: string;  // Motif de rejet (obligatoire si status = rejected)
}

export interface RequestStats {
  pending: number;
  accepted: number;
  rejected: number;
  completed: number;
  delivered: number;
  total: number;
}

@Injectable({ providedIn: 'root' })
export class RequestsService {
  private readonly api = inject(ApiService);

  async createRequest(dto: CreateRequestDto): Promise<RepairRequest> {
    return firstValueFrom(
      this.api.post<RepairRequest>('/requests', dto)
    );
  }

  async getMyRequests(params?: {
    status?: RequestStatus | RequestStatus[];
    page?: number;
    limit?: number;
  }): Promise<{ data: RepairRequest[]; total: number }> {
    return firstValueFrom(
      this.api.get<{ data: RepairRequest[]; total: number }>('/requests/my', params)
    );
  }

  async getRequest(id: string): Promise<RepairRequest> {
    return firstValueFrom(
      this.api.get<RepairRequest>(`/requests/${id}`)
    );
  }

  async updateStatus(id: string, dto: UpdateStatusDto): Promise<RepairRequest> {
    return firstValueFrom(
      this.api.put<RepairRequest>(`/requests/${id}/status`, dto)
    );
  }

  // Alias for updateStatus (used in some components)
  async updateRequestStatus(id: string, dto: UpdateStatusDto): Promise<RepairRequest> {
    return this.updateStatus(id, dto);
  }

  async getStats(): Promise<RequestStats> {
    return firstValueFrom(
      this.api.get<RequestStats>('/requests/stats')
    );
  }

  getStatusLabel(status: RequestStatus): string {
    const labels: Record<RequestStatus, string> = {
      pending: 'En cours d\'analyse',
      accepted: 'Acceptée',
      rejected: 'Rejetée',
      completed: 'Terminée',
      delivered: 'Livrée',
    };
    return labels[status] || status;
  }

  getStatusColor(status: RequestStatus): string {
    const colors: Record<RequestStatus, string> = {
      pending: '#f59e0b',
      accepted: '#10b981',
      rejected: '#ef4444',
      completed: '#8b5cf6',
      delivered: '#06b6d4',
    };
    return colors[status] || '#6b7280';
  }

  getUrgencyLabel(urgency: UrgencyLevel): string {
    return urgency === 'express' ? 'Express (+ 30%)' : 'Normal';
  }

  getUrgencyColor(urgency: UrgencyLevel): string {
    return urgency === 'express' ? '#dc2626' : '#10b981';
  }
}

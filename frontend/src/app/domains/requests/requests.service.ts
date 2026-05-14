import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@app/core/services/api.service';
import type {
  CreateRequestDto,
  RepairRequest,
  RequestStats,
  RequestStatus,
  UpdateStatusDto,
  UrgencyLevel,
} from './types';

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
      pending: '#FFC107',
      accepted: '#4CAF50',
      rejected: '#F44336',
      completed: '#FF9800',
      delivered: '#1565C0',
    };
    return colors[status] || '#6b7280';
  }

  getUrgencyLabel(urgency: UrgencyLevel): string {
    return urgency === 'express' ? 'Express (+ 30%)' : 'Normal';
  }

  getUrgencyColor(urgency: UrgencyLevel): string {
    return urgency === 'express' ? '#C62828' : '#4CAF50';
  }
}

import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import {
  ConseilRequest,
  ConseilType,
  ConseilFormat,
  PaginatedResponse,
} from '../../../shared/models';

// Message spécifique aux sessions de conseils
export interface ConseilMessage {
  id: string;
  sessionId: string;
  senderId: string;
  senderType: 'client' | 'expert';
  content: string;
  attachments?: string[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface Expert {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  specialties: string[];
  conseilTypes: ConseilType[];
  rating: number;
  reviewCount: number;
  responseTime: number; // minutes
  pricePerSession: number;
  isAvailable: boolean;
  bio?: string;
  yearsOfExperience: number;
}

export interface ConseilSession {
  id: string;
  clientId: string;
  expertId: string;
  expert?: Expert;
  type: ConseilType;
  format: ConseilFormat;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  subject?: string;
  description?: string;
  scheduledAt?: string;
  startedAt?: string;
  endedAt?: string;
  price: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class ConseilsService {
  private readonly api = inject(ApiService);

  // Get available conseil types with descriptions
  getConseilTypes(): { type: ConseilType; label: string; icon: string; description: string }[] {
    return [
      {
        type: 'diagnostic',
        label: 'Diagnostic',
        icon: '🔍',
        description: 'Identifiez le problème de votre appareil avec l\'aide d\'un expert',
      },
      {
        type: 'software',
        label: 'Logiciel',
        icon: '💻',
        description: 'Assistance pour problèmes logiciels, virus, mise à jour, etc.',
      },
      {
        type: 'purchase',
        label: 'Achat',
        icon: '🛒',
        description: 'Conseils pour l\'achat d\'un nouvel appareil ou accessoire',
      },
      {
        type: 'maintenance',
        label: 'Entretien',
        icon: '🛠️',
        description: 'Conseils pour prolonger la durée de vie de votre appareil',
      },
    ];
  }

  // Get available formats
  getConseilFormats(): { format: ConseilFormat; label: string; icon: string; description: string }[] {
    return [
      {
        format: 'chat',
        label: 'Chat',
        icon: '💬',
        description: 'Échangez par messages avec l\'expert',
      },
      {
        format: 'call',
        label: 'Appel',
        icon: '📞',
        description: 'Discutez en direct par appel téléphonique',
      },
    ];
  }

  // Get experts list
  async getExperts(params?: {
    type?: ConseilType;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Expert>> {
    const result = await firstValueFrom(
      this.api.get<{ data: Expert[]; total: number }>('/conseils/experts', params)
    );
    return {
      data: result.data,
      total: result.total,
      page: params?.page || 1,
      limit: params?.limit || 20,
    };
  }

  // Get expert by ID
  async getExpert(id: string): Promise<Expert | null> {
    try {
      return await firstValueFrom(
        this.api.get<Expert>(`/conseils/experts/${id}`)
      );
    } catch {
      return null;
    }
  }

  // Create conseil request
  async createConseilRequest(request: {
    expertId: string;
    type: ConseilType;
    format: ConseilFormat;
    subject?: string;
    description?: string;
  }): Promise<ConseilSession> {
    return firstValueFrom(
      this.api.post<ConseilSession>('/conseils/sessions', request)
    );
  }

  // Get user's conseil sessions
  async getMySessions(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ConseilSession>> {
    const result = await firstValueFrom(
      this.api.get<{ data: ConseilSession[]; total: number }>('/conseils/sessions/my', params)
    );
    return {
      data: result.data,
      total: result.total,
      page: params?.page || 1,
      limit: params?.limit || 20,
    };
  }

  // Get session by ID
  async getSession(id: string): Promise<ConseilSession | null> {
    try {
      return await firstValueFrom(
        this.api.get<ConseilSession>(`/conseils/sessions/${id}`)
      );
    } catch {
      return null;
    }
  }

  // Get chat messages for a session
  async getMessages(sessionId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<ConseilMessage>> {
    const result = await firstValueFrom(
      this.api.get<ConseilMessage[]>(`/conseils/sessions/${sessionId}/messages`, params)
    );
    return {
      data: result,
      total: result.length,
      page: params?.page || 1,
      limit: params?.limit || 50,
    };
  }

  // Send chat message
  async sendMessage(sessionId: string, content: string, attachments?: string[]): Promise<ConseilMessage> {
    return firstValueFrom(
      this.api.post<ConseilMessage>(`/conseils/sessions/${sessionId}/messages`, {
        content,
        attachments,
      })
    );
  }
}

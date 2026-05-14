import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '@app/core/services/api.service';
import type {
  CreateQuoteDto,
  Quote,
  QuotePart,
  QuoteStatus,
  UpdateQuoteDto,
} from './types';

@Injectable({ providedIn: 'root' })
export class QuotesService {
  private readonly api = inject(ApiService);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  async getQuotes(params?: {
    status?: QuoteStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: Quote[]; total: number }> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      return await firstValueFrom(
        this.api.get<{ data: Quote[]; total: number }>('/quotes/my', params)
      );
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement des devis');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async getQuote(id: string): Promise<Quote> {
    return firstValueFrom(this.api.get<Quote>(`/quotes/${id}`));
  }

  async getQuoteByRequest(requestId: string): Promise<Quote | null> {
    try {
      return await firstValueFrom(this.api.get<Quote>(`/quotes/request/${requestId}`));
    } catch {
      return null;
    }
  }

  async createQuote(dto: CreateQuoteDto): Promise<Quote> {
    return firstValueFrom(this.api.post<Quote>('/quotes', dto));
  }

  async updateQuote(id: string, dto: UpdateQuoteDto): Promise<Quote> {
    return firstValueFrom(this.api.put<Quote>(`/quotes/${id}`, dto));
  }

  async acceptQuote(id: string): Promise<Quote> {
    return firstValueFrom(this.api.post<Quote>(`/quotes/${id}/accept`, {}));
  }

  async rejectQuote(id: string, reason?: string, proposedPrice?: number): Promise<Quote> {
    return firstValueFrom(this.api.post<Quote>(`/quotes/${id}/reject`, { reason, proposedPrice }));
  }

  async acceptCounterProposal(id: string): Promise<Quote> {
    return firstValueFrom(this.api.post<Quote>(`/quotes/${id}/accept-counter-proposal`, {}));
  }

  async cancelNegotiation(id: string, reason?: string): Promise<Quote> {
    return firstValueFrom(this.api.post<Quote>(`/quotes/${id}/cancel-negotiation`, { reason }));
  }

  async getQuoteHistoryByRequest(requestId: string): Promise<Quote[]> {
    try {
      return await firstValueFrom(this.api.get<Quote[]>(`/quotes/request/${requestId}/history`));
    } catch {
      return [];
    }
  }

  calculateTotal(laborCost: number, parts: QuotePart[], urgencySupplement?: number): number {
    const partsCost = parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    return laborCost + partsCost + (urgencySupplement || 0);
  }

  getStatusLabel(status: QuoteStatus): string {
    const labels: Record<QuoteStatus, string> = {
      pending: 'En attente',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré',
    };
    return labels[status] || status;
  }

  getStatusColor(status: QuoteStatus): string {
    const colors: Record<QuoteStatus, string> = {
      pending: '#FFC107',
      accepted: '#4CAF50',
      rejected: '#F44336',
      expired: '#6b7280',
    };
    return colors[status] || '#6b7280';
  }

  isExpired(quote: Quote): boolean {
    return new Date(quote.validUntil) < new Date();
  }

  getDaysUntilExpiry(quote: Quote): number {
    const now = new Date();
    const expiry = new Date(quote.validUntil);
    const diff = expiry.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }
}

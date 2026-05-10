import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiService } from '../../../core/services/api.service';
import { ChipVariant } from '../../../shared/components/ui-chip/ui-chip.component';

export type PaymentMethod = 'orange_money' | 'mtn_money' | 'wave' | 'card';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'blocked';
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

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);
  private readonly http = inject(HttpClient);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  // Platform fee percentage (e.g., 5%)
  readonly PLATFORM_FEE_PERCENT = 5;
  // Deposit percentage for advance payment
  readonly DEPOSIT_PERCENT = 30;

  readonly paymentMethods: PaymentMethodInfo[] = [
    {
      id: 'orange_money',
      name: 'Orange Money',
      icon: '🟠',
      color: '#FF6600',
      description: 'Paiement via Orange Money',
      available: true,
      minAmount: 100,
      maxAmount: 1000000,
    },
    {
      id: 'mtn_money',
      name: 'MTN Mobile Money',
      icon: '🟡',
      color: '#FFCC00',
      description: 'Paiement via MTN MoMo',
      available: true,
      minAmount: 100,
      maxAmount: 1000000,
    },
    {
      id: 'wave',
      name: 'Wave',
      icon: '🔵',
      color: '#1DC9FF',
      description: 'Paiement via Wave',
      available: true,
      minAmount: 100,
      maxAmount: 2000000,
    },
    {
      id: 'card',
      name: 'Carte bancaire',
      icon: '💳',
      color: '#4A5568',
      description: 'Visa, Mastercard',
      available: false,
      minAmount: 1000,
    },
  ];

  calculateSummary(quoteAmount: number, paymentType: PaymentType = 'full'): PaymentSummary {
    const platformFee = Math.round(quoteAmount * (this.PLATFORM_FEE_PERCENT / 100));
    const totalAmount = quoteAmount + platformFee;

    if (paymentType === 'deposit') {
      const depositAmount = Math.round(totalAmount * (this.DEPOSIT_PERCENT / 100));
      return {
        quoteAmount,
        platformFee,
        platformFeePercent: this.PLATFORM_FEE_PERCENT,
        totalAmount,
        depositAmount,
        depositPercent: this.DEPOSIT_PERCENT,
        balanceAmount: totalAmount - depositAmount,
      };
    }

    return {
      quoteAmount,
      platformFee,
      platformFeePercent: this.PLATFORM_FEE_PERCENT,
      totalAmount,
    };
  }

  async initiatePayment(dto: InitiatePaymentDto): Promise<Payment> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // In production, this would call the actual payment API
      // For now, we simulate a payment initiation
      const result = await firstValueFrom(
        this.api.post<Payment>('/payments/initiate', dto)
      );
      return result;
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de l\'initiation du paiement');
      throw err;
    } finally {
      this.isLoading.set(false);
    }
  }

  async verifyPayment(paymentId: string, otp?: string): Promise<Payment> {
    return firstValueFrom(
      this.api.post<Payment>(`/payments/${paymentId}/verify`, { otp })
    );
  }

  async getPayment(id: string): Promise<Payment> {
    return firstValueFrom(this.api.get<Payment>(`/payments/${id}`));
  }

  async getPaymentByRequest(requestId: string): Promise<Payment | null> {
    try {
      return await firstValueFrom(
        this.api.get<Payment>(`/payments/request/${requestId}`)
      );
    } catch {
      return null;
    }
  }

  async getMyPayments(params?: {
    status?: PaymentStatus;
    page?: number;
    limit?: number;
  }): Promise<{ data: Payment[]; total: number }> {
    return firstValueFrom(
      this.api.get<{ data: Payment[]; total: number }>('/payments/my', params)
    );
  }

  async requestRefund(paymentId: string, reason: string): Promise<Payment> {
    return firstValueFrom(
      this.api.post<Payment>(`/payments/${paymentId}/refund`, { reason })
    );
  }

  /**
   * Télécharge le reçu PDF d'un paiement complété.
   * Récupère le blob via HttpClient (responseType: 'blob') puis déclenche
   * un download via une URL temporaire.
   */
  async downloadReceipt(paymentId: string): Promise<void> {
    const blob = await firstValueFrom(
      this.http.get(`${environment.apiUrl}/payments/${paymentId}/receipt`, {
        responseType: 'blob',
      })
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recu-${paymentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  getStatusLabel(status: PaymentStatus): string {
    const labels: Record<PaymentStatus, string> = {
      pending: 'En attente',
      processing: 'En cours',
      completed: 'Payé',
      failed: 'Échoué',
      refunded: 'Remboursé',
      blocked: 'Bloqué',
    };
    return labels[status] || status;
  }

  getStatusColor(status: PaymentStatus): ChipVariant {
    const variants: Record<PaymentStatus, ChipVariant> = {
      pending: 'warning',
      processing: 'info',
      completed: 'success',
      failed: 'danger',
      refunded: 'primary',
      blocked: 'danger',
    };
    return variants[status] || 'default';
  }

  getPaymentTypeLabel(type: PaymentType): string {
    const labels: Record<PaymentType, string> = {
      deposit: 'Acompte',
      balance: 'Solde',
      full: 'Paiement complet',
    };
    return labels[type] || type;
  }

  formatPhoneNumber(phone: string): string {
    // Format phone number for display (e.g., +225 07 XX XX XX XX)
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
    }
    return phone;
  }

  validatePhoneNumber(phone: string, method: PaymentMethod): boolean {
    const cleaned = phone.replace(/\D/g, '');

    // Basic validation - 10 digits for Ivory Coast numbers
    if (cleaned.length !== 10) return false;

    // Operator prefix validation
    const prefixes: Record<PaymentMethod, string[]> = {
      orange_money: ['07', '08', '09'],
      mtn_money: ['05', '06'],
      wave: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],
      card: [],
    };

    const prefix = cleaned.slice(0, 2);
    return prefixes[method]?.includes(prefix) ?? true;
  }

  // Simulate payment for demo/mock purposes
  async simulatePayment(paymentId: string): Promise<Payment> {
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In production, this would be handled by webhooks
    return firstValueFrom(
      this.api.post<Payment>(`/payments/${paymentId}/simulate-success`, {})
    );
  }
}

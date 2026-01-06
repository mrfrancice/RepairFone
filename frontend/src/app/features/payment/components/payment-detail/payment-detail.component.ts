import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PaymentService, Payment } from '../../services/payment.service';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiPriceDisplayComponent } from '../../../../shared/components/ui-price-display/ui-price-display.component';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiCardComponent,
    UiButtonComponent,
    UiLoadingComponent,
    UiPriceDisplayComponent,
  ],
  template: `
    <div class="payment-detail">
      <!-- Header -->
      <header class="header">
        <button class="back-btn" (click)="goBack()">
          ← Retour
        </button>
        <h1>Détail du paiement</h1>
      </header>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="loading-container">
          <ui-loading size="lg" />
          <p>Chargement...</p>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <ui-card class="error-card">
          <p>{{ error() }}</p>
          <ui-button variant="outline" size="sm" (onClick)="loadPayment()">
            Réessayer
          </ui-button>
        </ui-card>
      }

      @if (payment()) {
        <!-- Status Banner -->
        <div class="status-banner" [style.background]="getStatusGradient()">
          <div class="status-icon">{{ getStatusIcon() }}</div>
          <div class="status-info">
            <span class="status-label">
              {{ paymentService.getStatusLabel(payment()!.status) }}
            </span>
            <ui-price-display [amount]="payment()!.amount" size="xl" color="white" />
          </div>
        </div>

        <!-- Payment Info -->
        <ui-card class="info-card">
          <h3>Informations du paiement</h3>

          <div class="info-row">
            <span class="label">Type</span>
            <span class="value">
              {{ paymentService.getPaymentTypeLabel(payment()!.paymentType) }}
            </span>
          </div>

          @if (payment()!.paymentMethod) {
            <div class="info-row">
              <span class="label">Méthode</span>
              <span class="value method">
                <span class="method-icon" [style.background]="getMethodBg()">
                  {{ getMethodIcon() }}
                </span>
                {{ getMethodName() }}
              </span>
            </div>
          }

          @if (payment()!.phoneNumber) {
            <div class="info-row">
              <span class="label">Téléphone</span>
              <span class="value">
                {{ paymentService.formatPhoneNumber(payment()!.phoneNumber!) }}
              </span>
            </div>
          }

          @if (payment()!.transactionRef) {
            <div class="info-row">
              <span class="label">Référence</span>
              <span class="value mono">{{ payment()!.transactionRef }}</span>
            </div>
          }

          <div class="info-row">
            <span class="label">Date</span>
            <span class="value">{{ formatDate(payment()!.paidAt || payment()!.createdAt) }}</span>
          </div>
        </ui-card>

        <!-- Price Breakdown -->
        <ui-card class="breakdown-card">
          <h3>Détail du montant</h3>

          <div class="breakdown-row">
            <span class="label">Montant réparation</span>
            <ui-price-display [amount]="payment()!.repairerAmount" />
          </div>

          <div class="breakdown-row">
            <span class="label">Frais plateforme</span>
            <ui-price-display [amount]="payment()!.platformFee" />
          </div>

          <div class="breakdown-row total">
            <span class="label">Total payé</span>
            <ui-price-display [amount]="payment()!.amount" size="lg" />
          </div>
        </ui-card>

        <!-- Request Info -->
        @if (payment()!.request) {
          <ui-card class="request-card">
            <h3>Réparation associée</h3>

            @if (payment()!.request?.device) {
              <div class="device-info">
                <span class="device-icon">📱</span>
                <div class="device-details">
                  <span class="device-name">
                    {{ payment()!.request!.device!.brand }} {{ payment()!.request!.device!.model }}
                  </span>
                  @if (payment()!.request?.serviceType) {
                    <span class="service-type">
                      {{ payment()!.request!.serviceType!.name }}
                    </span>
                  }
                </div>
              </div>
            }

            <ui-button
              variant="outline"
              size="sm"
              [routerLink]="['/tracking', payment()!.requestId]"
              class="view-request-btn"
            >
              Voir le suivi
            </ui-button>
          </ui-card>
        }

        <!-- Repairer Info -->
        @if (payment()!.repairer) {
          <ui-card class="repairer-card">
            <h3>Réparateur</h3>

            <div class="repairer-info">
              <div class="repairer-avatar">
                {{ getRepairerInitials() }}
              </div>
              <div class="repairer-details">
                <span class="repairer-name">
                  {{ payment()!.repairer!.repairerProfile?.businessName ||
                     (payment()!.repairer!.firstName + ' ' + payment()!.repairer!.lastName) }}
                </span>
                <span class="repairer-label">Réparateur certifié</span>
              </div>
            </div>
          </ui-card>
        }

        <!-- Actions -->
        <div class="actions">
          @if (payment()!.status === 'completed') {
            <ui-button variant="outline" (onClick)="downloadReceipt()">
              📄 Télécharger le reçu
            </ui-button>
          }

          @if (canRequestRefund()) {
            <ui-button variant="danger" (onClick)="requestRefund()">
              Demander un remboursement
            </ui-button>
          }

          @if (payment()!.status === 'failed') {
            <ui-button variant="primary" (onClick)="retryPayment()">
              Réessayer le paiement
            </ui-button>
          }
        </div>

        <!-- Refund Modal -->
        @if (showRefundModal()) {
          <div class="modal-overlay" (click)="showRefundModal.set(false)">
            <div class="modal-content" (click)="$event.stopPropagation()">
              <h3>Demander un remboursement</h3>
              <p>Veuillez indiquer la raison de votre demande de remboursement :</p>

              <textarea
                [(ngModel)]="refundReason"
                placeholder="Décrivez la raison..."
                rows="4"
              ></textarea>

              <div class="modal-actions">
                <ui-button variant="outline" (onClick)="showRefundModal.set(false)">
                  Annuler
                </ui-button>
                <ui-button
                  variant="danger"
                  [loading]="isSubmitting()"
                  [disabled]="!refundReason.trim()"
                  (onClick)="submitRefund()"
                >
                  Envoyer la demande
                </ui-button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .payment-detail {
      padding: 1rem;
      padding-bottom: 5rem;
    }

    .header {
      margin-bottom: 1.5rem;

      .back-btn {
        background: none;
        border: none;
        color: #3b82f6;
        font-size: 0.875rem;
        padding: 0;
        margin-bottom: 0.5rem;
        cursor: pointer;
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: #64748b;
    }

    .error-card {
      padding: 1.5rem;
      text-align: center;
      background: #fef2f2;

      p {
        color: #dc2626;
        margin: 0 0 1rem 0;
      }
    }

    .status-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 1rem;
      margin-bottom: 1rem;

      .status-icon {
        font-size: 2.5rem;
      }

      .status-info {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .status-label {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.875rem;
        font-weight: 500;
      }
    }

    .info-card,
    .breakdown-card,
    .request-card,
    .repairer-card {
      padding: 1rem;
      margin-bottom: 1rem;

      h3 {
        font-size: 0.875rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 1rem 0;
      }
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      .label {
        color: #64748b;
        font-size: 0.875rem;
      }

      .value {
        color: #1e293b;
        font-weight: 500;
        font-size: 0.9375rem;

        &.mono {
          font-family: monospace;
          font-size: 0.8125rem;
        }

        &.method {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
      }

      .method-icon {
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 0.375rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
      }
    }

    .breakdown-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;

      .label {
        color: #64748b;
        font-size: 0.875rem;
      }

      &.total {
        border-top: 2px solid #e2e8f0;
        margin-top: 0.5rem;
        padding-top: 1rem;

        .label {
          font-weight: 600;
          color: #1e293b;
        }
      }
    }

    .device-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;

      .device-icon {
        font-size: 2rem;
      }

      .device-details {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .device-name {
        font-weight: 600;
        color: #1e293b;
      }

      .service-type {
        font-size: 0.8125rem;
        color: #64748b;
      }
    }

    .view-request-btn {
      width: 100%;
    }

    .repairer-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .repairer-avatar {
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 1rem;
      }

      .repairer-details {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .repairer-name {
        font-weight: 600;
        color: #1e293b;
      }

      .repairer-label {
        font-size: 0.75rem;
        color: #10b981;
      }
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      width: 100%;
      max-width: 400px;

      h3 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
      }

      p {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0 0 1rem 0;
      }

      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 0.875rem;
        resize: vertical;
        margin-bottom: 1rem;

        &:focus {
          outline: none;
          border-color: #3b82f6;
        }
      }

      .modal-actions {
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }
    }
  `]
})
export class PaymentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly paymentService = inject(PaymentService);

  readonly payment = signal<Payment | null>(null);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showRefundModal = signal(false);
  readonly isSubmitting = signal(false);

  refundReason = '';

  ngOnInit(): void {
    this.loadPayment();
  }

  async loadPayment(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de paiement manquant');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const payment = await this.paymentService.getPayment(id);
      this.payment.set(payment);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement du paiement');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/payment']);
  }

  getStatusGradient(): string {
    const status = this.payment()?.status;
    const gradients: Record<string, string> = {
      pending: 'linear-gradient(135deg, #f59e0b, #d97706)',
      processing: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      completed: 'linear-gradient(135deg, #10b981, #059669)',
      failed: 'linear-gradient(135deg, #ef4444, #dc2626)',
      refunded: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      blocked: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    };
    return gradients[status || 'pending'];
  }

  getStatusIcon(): string {
    const status = this.payment()?.status;
    const icons: Record<string, string> = {
      pending: '⏳',
      processing: '⚙️',
      completed: '✅',
      failed: '❌',
      refunded: '↩️',
      blocked: '🚫',
    };
    return icons[status || 'pending'];
  }

  getMethodIcon(): string {
    const method = this.payment()?.paymentMethod;
    const icons: Record<string, string> = {
      orange_money: '🟠',
      mtn_money: '🟡',
      wave: '🔵',
      card: '💳',
    };
    return icons[method || ''] || '💰';
  }

  getMethodBg(): string {
    const method = this.payment()?.paymentMethod;
    const colors: Record<string, string> = {
      orange_money: '#FFF3E0',
      mtn_money: '#FFF9E0',
      wave: '#E3F2FD',
      card: '#F5F5F5',
    };
    return colors[method || ''] || '#F5F5F5';
  }

  getMethodName(): string {
    const method = this.payment()?.paymentMethod;
    const names: Record<string, string> = {
      orange_money: 'Orange Money',
      mtn_money: 'MTN Mobile Money',
      wave: 'Wave',
      card: 'Carte bancaire',
    };
    return names[method || ''] || method || '';
  }

  getRepairerInitials(): string {
    const repairer = this.payment()?.repairer;
    if (!repairer) return '?';

    if (repairer.repairerProfile?.businessName) {
      return repairer.repairerProfile.businessName.charAt(0).toUpperCase();
    }

    const first = repairer.firstName?.charAt(0) || '';
    const last = repairer.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  canRequestRefund(): boolean {
    const payment = this.payment();
    if (!payment) return false;

    // Can only request refund for completed payments within 7 days
    if (payment.status !== 'completed') return false;

    const paidDate = new Date(payment.paidAt || payment.createdAt);
    const daysSincePaid = (Date.now() - paidDate.getTime()) / (1000 * 60 * 60 * 24);

    return daysSincePaid <= 7;
  }

  requestRefund(): void {
    this.showRefundModal.set(true);
    this.refundReason = '';
  }

  async submitRefund(): Promise<void> {
    const payment = this.payment();
    if (!payment || !this.refundReason.trim()) return;

    this.isSubmitting.set(true);

    try {
      const updated = await this.paymentService.requestRefund(
        payment.id,
        this.refundReason.trim()
      );
      this.payment.set(updated);
      this.showRefundModal.set(false);
    } catch (err: any) {
      // Show error in toast
      console.error('Refund request failed:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async retryPayment(): Promise<void> {
    const payment = this.payment();
    if (!payment) return;

    // Navigate to payment flow with the same request
    this.router.navigate(['/payment/new'], {
      queryParams: {
        requestId: payment.requestId,
        quoteId: payment.quoteId,
      },
    });
  }

  downloadReceipt(): void {
    // TODO: In production, this would generate/download a PDF receipt
  }
}

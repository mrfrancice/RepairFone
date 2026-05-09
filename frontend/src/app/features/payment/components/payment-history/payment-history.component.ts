import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaymentService, Payment, PaymentStatus } from '../../services/payment.service';
import { PaymentStore } from '../../stores/payment.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiEmptyStateComponent } from '../../../../shared/components/ui-empty-state/ui-empty-state.component';
import { UiErrorStateComponent } from '../../../../shared/components/ui-error-state/ui-error-state.component';
import { UiChipComponent } from '../../../../shared/components/ui-chip/ui-chip.component';
import { UiPriceDisplayComponent } from '../../../../shared/components/ui-price-display/ui-price-display.component';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { InfiniteScrollDirective } from '../../../../shared/directives/infinite-scroll.directive';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    UiCardComponent,
    UiLoadingComponent,
    UiEmptyStateComponent,
    UiErrorStateComponent,
    UiChipComponent,
    UiPriceDisplayComponent,
    FormatDatePipe,
    InfiniteScrollDirective,
    UiHeaderComponent,
  ],
  template: `
    <div class="payment-history">
      <ui-header
        [title]="authStore.isRepairer() ? 'Paiements reçus' : 'Mes paiements'"
        [subtitle]="authStore.isRepairer() ? 'Historique des paiements de vos clients' : 'Historique de vos transactions'"
      />

      <!-- Stats -->
      @if (store.hasPayments()) {
        <div class="stats-grid">
          <ui-card class="stat-card">
            <div class="stat-content">
              <span class="stat-label">{{ authStore.isRepairer() ? 'Total reçu' : 'Total dépensé' }}</span>
              <ui-price-display [amount]="authStore.isRepairer() ? store.totalReceived() : store.totalSpent()" size="lg" />
            </div>
          </ui-card>
          <ui-card class="stat-card">
            <div class="stat-content">
              <span class="stat-label">Transactions</span>
              <span class="stat-value">{{ store.completedPayments().length }}</span>
            </div>
          </ui-card>
        </div>
      }

      <!-- Filters -->
      <div class="filters">
        <button
          class="filter-btn"
          [class.active]="store.filterStatus() === null"
          (click)="setFilter(null)"
        >
          Tous
        </button>
        <button
          class="filter-btn"
          [class.active]="store.filterStatus() === 'completed'"
          (click)="setFilter('completed')"
        >
          Payés
        </button>
        <button
          class="filter-btn"
          [class.active]="store.filterStatus() === 'pending'"
          (click)="setFilter('pending')"
        >
          En attente
        </button>
        <button
          class="filter-btn"
          [class.active]="store.filterStatus() === 'failed'"
          (click)="setFilter('failed')"
        >
          Échoués
        </button>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="loading-container">
          <ui-loading size="lg" />
          <p>Chargement des paiements...</p>
        </div>
      }

      <!-- Error -->
      @if (!isLoading() && error()) {
        <ui-error-state
          [message]="error()!"
          severity="error"
          [showRetry]="true"
          (onRetry)="loadPayments()"
        />
      }

      <!-- Empty state -->
      @if (!isLoading() && !error() && store.filteredPayments().length === 0) {
        <ui-empty-state
          icon="💳"
          title="Aucun paiement"
          [description]="store.filterStatus() ? 'Aucun paiement avec ce statut' : 'Vous n\\'avez pas encore effectué de paiement'"
        />
      }

      <!-- Payment list -->
      @if (!isLoading() && store.filteredPayments().length > 0) {
        <div class="payment-list"
             appInfiniteScroll
             [useWindow]="true"
             [threshold]="200"
             [disabled]="isLoadingMore() || !hasMore()"
             (scrolled)="loadMore()">
          @for (payment of store.filteredPayments(); track payment.id) {
            <ui-card class="payment-card" [routerLink]="['/payment', payment.id]">
              <div class="payment-header">
                <div class="payment-info">
                  <span class="payment-type">
                    {{ paymentService.getPaymentTypeLabel(payment.paymentType) }}
                  </span>
                  @if (payment.request?.device) {
                    <span class="device-info">
                      {{ payment.request?.device?.brand }} {{ payment.request?.device?.model }}
                    </span>
                  }
                </div>
                <ui-chip
                  [label]="paymentService.getStatusLabel(payment.status)"
                  [color]="paymentService.getStatusColor(payment.status)"
                  size="sm"
                />
              </div>

              <div class="payment-body">
                <div class="amount-row">
                  <ui-price-display [amount]="authStore.isRepairer() ? payment.repairerAmount : payment.amount" size="lg" />
                  @if (payment.paymentMethod) {
                    <span class="method-badge" [style.background]="getMethodColor(payment.paymentMethod)">
                      {{ getMethodIcon(payment.paymentMethod) }}
                    </span>
                  }
                </div>

                @if (authStore.isRepairer() && payment.client) {
                  <div class="repairer-info">
                    <span class="label">Client:</span>
                    <span class="value">
                      {{ payment.client.firstName + ' ' + payment.client.lastName }}
                    </span>
                  </div>
                }

                @if (!authStore.isRepairer() && payment.repairer) {
                  <div class="repairer-info">
                    <span class="label">Réparateur:</span>
                    <span class="value">
                      {{ payment.repairer.repairerProfile?.businessName ||
                         (payment.repairer.firstName + ' ' + payment.repairer.lastName) }}
                    </span>
                  </div>
                }

                @if (payment.transactionRef) {
                  <div class="ref-info">
                    <span class="label">Réf:</span>
                    <span class="value">{{ payment.transactionRef }}</span>
                  </div>
                }
              </div>

              <div class="payment-footer">
                <span class="date">
                  {{ (payment.paidAt || payment.createdAt) | formatDate }}
                </span>
                <span class="arrow">→</span>
              </div>
            </ui-card>
          }
        </div>

        <!-- Loading indicator for infinite scroll -->
        @if (isLoadingMore()) {
          <div class="loading-more">
            <ui-loading size="sm" />
            <span>Chargement...</span>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .payment-history {
      padding: 1rem;
      padding-top: calc(var(--header-height, 100px) + 1rem);
      padding-bottom: 5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1.5rem;

      .stat-card {
        padding: 1rem;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1F2937;
      }
    }

    .filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;

      &::-webkit-scrollbar {
        display: none;
      }

      .filter-btn {
        padding: 0.5rem 1rem;
        border: 1px solid var(--color-neutral-200, #EEEEEE);
        background: var(--color-neutral-100, #F5F5F5);
        border-radius: 9999px;
        font-size: 0.875rem;
        color: var(--color-neutral-700, #374151);
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: var(--color-primary-500, #FF9800);
          color: var(--color-primary-500, #FF9800);
        }

        &.active {
          background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
          border-color: var(--color-primary-500, #FF9800);
          color: white;
          box-shadow: var(--shadow-warm, 0 8px 24px rgba(255, 152, 0, 0.20));
        }
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: #6B7280;
    }

    .error-card {
      padding: 1.5rem;
      text-align: center;
      background: #FFEBEE;

      p {
        color: var(--color-terracotta, #C62828);
        margin: 0 0 1rem 0;
      }
    }

    .payment-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .payment-card {
      padding: 1rem;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .payment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;

      .payment-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .payment-type {
        font-weight: 600;
        color: #1F2937;
        font-size: 0.9375rem;
      }

      .device-info {
        font-size: 0.75rem;
        color: #6B7280;
      }
    }

    .payment-body {
      .amount-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .method-badge {
        width: 2rem;
        height: 2rem;
        border-radius: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
      }

      .repairer-info,
      .ref-info {
        display: flex;
        gap: 0.5rem;
        font-size: 0.8125rem;
        margin-bottom: 0.25rem;

        .label {
          color: #6B7280;
        }

        .value {
          color: #1F2937;
        }
      }
    }

    .payment-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
      margin-top: 0.75rem;

      .date {
        font-size: 0.75rem;
        color: #9CA3AF;
      }

      .arrow {
        color: #9CA3AF;
      }
    }

    .loading-more {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.5rem;
      color: #6B7280;
      font-size: 0.875rem;
    }
  `]
})
export class PaymentHistoryComponent implements OnInit {
  readonly paymentService = inject(PaymentService);
  readonly store = inject(PaymentStore);
  readonly authStore = inject(AuthStore);

  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasMore = signal(false);

  private page = 1;
  private readonly limit = 10;

  ngOnInit(): void {
    this.loadPayments();
  }

  async loadPayments(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    this.page = 1;

    try {
      const result = await this.paymentService.getMyPayments({
        status: this.store.filterStatus() ?? undefined,
        page: this.page,
        limit: this.limit,
      });

      this.store.setPayments(result.data, result.total);
      this.hasMore.set(result.data.length < result.total);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement des paiements');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    this.isLoadingMore.set(true);
    this.page++;

    try {
      const result = await this.paymentService.getMyPayments({
        status: this.store.filterStatus() ?? undefined,
        page: this.page,
        limit: this.limit,
      });

      this.store.appendPayments(result.data);
      this.hasMore.set(
        this.store.payments().length < result.total
      );
    } catch (err: any) {
      this.page--;
      this.error.set(err.message || 'Erreur lors du chargement');
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  setFilter(status: PaymentStatus | null): void {
    this.store.setFilterStatus(status);
    this.loadPayments();
  }

  getMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      orange_money: '🟠',
      mtn_money: '🟡',
      wave: '🔵',
      card: '💳',
    };
    return icons[method] || '💰';
  }

  getMethodColor(method: string): string {
    const colors: Record<string, string> = {
      orange_money: '#FFF3E0',
      mtn_money: '#FFF9E0',
      wave: '#E3F2FD',
      card: '#F5F5F5',
    };
    return colors[method] || '#F5F5F5';
  }

}

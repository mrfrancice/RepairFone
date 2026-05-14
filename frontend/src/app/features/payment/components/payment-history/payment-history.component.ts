import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { PaymentsService, PaymentsStore, type Payment, type PaymentStatus } from '@app/domains/payments';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiEmptyStateComponent } from '../../../../shared/components/ui-empty-state/ui-empty-state.component';
import { UiErrorStateComponent } from '../../../../shared/components/ui-error-state/ui-error-state.component';
import { UiChipComponent } from '../../../../shared/components/ui-chip/ui-chip.component';
import { UiPriceDisplayComponent } from '../../../../shared/components/ui-price-display/ui-price-display.component';
import {
  UiDataGridComponent,
  UiDataGridColumnComponent,
} from '../../../../shared/components/ui-data-grid';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { HeaderSearchComponent } from '../../../../shared/components/header-search/header-search.component';

@Component({
  selector: 'app-payment-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    UiCardComponent,
    UiLoadingComponent,
    UiEmptyStateComponent,
    UiErrorStateComponent,
    UiChipComponent,
    UiPriceDisplayComponent,
    UiDataGridComponent,
    UiDataGridColumnComponent,
    FormatDatePipe,
    UiHeaderComponent,
    HeaderSearchComponent,
  ],
  template: `
    <div class="payment-history">
      <ui-header
        [title]="authStore.isRepairer() ? 'Paiements reçus' : 'Mes paiements'"
        [subtitle]="authStore.isRepairer() ? 'Historique des paiements de vos clients' : 'Historique de vos transactions'"
      >
        <app-header-search
          placeholder="Rechercher (type, méthode, réf, nom...)"
          (search)="onSearch($event)"
          (cleared)="onSearch('')"
        />
      </ui-header>

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
      @if (!isLoading() && !error() && searchedPayments().length === 0) {
        <ui-empty-state
          icon="💳"
          title="Aucun paiement"
          [description]="store.filterStatus() ? 'Aucun paiement avec ce statut' : 'Vous n\\'avez pas encore effectué de paiement'"
        />
      }

      <!-- Payments table -->
      @if (!isLoading() && searchedPayments().length > 0) {
        <ui-data-grid
          [data]="searchedPayments()"
          [pageSize]="10"
          [pageSizeOptions]="[10, 25, 50, 100]"
          [rowClickable]="true"
          emptyMessage="Aucun paiement"
          (rowClick)="goToDetail($event)"
        >
          <ui-data-grid-column key="type" header="Type" field="paymentType">
            <ng-template let-row>
              <div class="cell-type">
                <strong>{{ paymentService.getPaymentTypeLabel(row.paymentType) }}</strong>
                @if (row.request?.device) {
                  <span class="muted">{{ row.request.device.brand }} {{ row.request.device.model }}</span>
                }
              </div>
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="counterpart" header="{{ authStore.isRepairer() ? 'Client' : 'Réparateur' }}">
            <ng-template let-row>
              @if (authStore.isRepairer() && row.client) {
                {{ row.client.firstName }} {{ row.client.lastName }}
              } @else if (!authStore.isRepairer() && row.repairer) {
                {{ row.repairer.repairerProfile?.businessName || (row.repairer.firstName + ' ' + row.repairer.lastName) }}
              } @else {
                <span class="muted">—</span>
              }
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="amount" header="Montant" align="right" field="amount" [sortable]="true">
            <ng-template let-row>
              <ui-price-display
                [amount]="authStore.isRepairer() ? row.repairerAmount : row.amount"
                size="md"
              />
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="method" header="Méthode" align="center" width="100px">
            <ng-template let-row>
              @if (row.paymentMethod) {
                <span class="method-badge-cell" [style.background]="getMethodColor(row.paymentMethod)" [title]="row.paymentMethod">
                  {{ getMethodIcon(row.paymentMethod) }}
                </span>
              } @else {
                <span class="muted">—</span>
              }
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="status" header="Statut" field="status" [sortable]="true">
            <ng-template let-row>
              <ui-chip
                [label]="paymentService.getStatusLabel(row.status)"
                [color]="paymentService.getStatusColor(row.status)"
                size="sm"
              />
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="date" header="Date" field="paidAt" [sortable]="true" width="120px">
            <ng-template let-row>
              <span class="date">{{ (row.paidAt || row.createdAt) | formatDate }}</span>
            </ng-template>
          </ui-data-grid-column>
        </ui-data-grid>
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

    /* Cellules <ui-data-grid> */
    .cell-type {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .cell-type strong {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }

    .cell-type .muted {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .muted { color: #9ca3af; }

    .date {
      color: #6b7280;
      font-size: 0.8125rem;
      font-variant-numeric: tabular-nums;
    }

    .method-badge-cell {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      font-size: 1.125rem;
    }
  `]
})
export class PaymentHistoryComponent implements OnInit {
  readonly paymentService = inject(PaymentsService);
  readonly store = inject(PaymentsStore);
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');

  /** Filtre local sur la liste déjà filtrée par statut (recherche libre). */
  readonly searchedPayments = computed(() => {
    const list = this.store.filteredPayments();
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;
    return list.filter((p) => {
      const pieces: string[] = [
        this.paymentService.getPaymentTypeLabel(p.paymentType),
        p.paymentMethod ?? '',
        p.transactionRef ?? '',
        p.client ? `${p.client.firstName} ${p.client.lastName}` : '',
        p.repairer
          ? p.repairer.repairerProfile?.businessName ??
            `${p.repairer.firstName} ${p.repairer.lastName}`
          : '',
        p.request?.device?.brand ?? '',
        p.request?.device?.model ?? '',
        String(p.amount ?? ''),
      ];
      return pieces.some((s) => s.toLowerCase().includes(q));
    });
  });

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  ngOnInit(): void {
    this.loadPayments();
  }

  async loadPayments(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      // Charge le volume max accepté par l'API ; la pagination du DataGrid prend le relais en mémoire.
      const result = await this.paymentService.getMyPayments({
        status: this.store.filterStatus() ?? undefined,
        page: 1,
        limit: environment.api.maxLimit,
      });
      this.store.setPayments(result.data, result.total);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement des paiements');
    } finally {
      this.isLoading.set(false);
    }
  }

  setFilter(status: PaymentStatus | null): void {
    this.store.setFilterStatus(status);
    this.loadPayments();
  }

  goToDetail(payment: Payment): void {
    this.router.navigate(['/payments', payment.id]);
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

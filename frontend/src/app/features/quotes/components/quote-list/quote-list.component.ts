import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { QuotesService, Quote, QuoteStatus } from '../../services/quotes.service';
import { QuotesStore } from '../../stores/quotes.store';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiTabsComponent } from '../../../../shared/components/ui-tabs/ui-tabs.component';
import { UiBadgeComponent } from '../../../../shared/components/ui-badge/ui-badge.component';
import { UiSkeletonComponent } from '../../../../shared/components/ui-skeleton/ui-skeleton.component';
import { UiErrorStateComponent } from '../../../../shared/components/ui-error-state/ui-error-state.component';
import {
  UiDataGridComponent,
  UiDataGridColumnComponent,
} from '../../../../shared/components/ui-data-grid';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { TabItem } from '../../../../shared/models';
import { LoggerService } from '../../../../core/services/logger.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { HeaderSearchComponent } from '../../../../shared/components/header-search/header-search.component';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    UiButtonComponent,
    UiTabsComponent,
    UiBadgeComponent,
    UiSkeletonComponent,
    UiErrorStateComponent,
    UiDataGridComponent,
    UiDataGridColumnComponent,
    FormatDatePipe,
    UiHeaderComponent,
    HeaderSearchComponent,
  ],
  template: `
    <div class="quotes-container">
      <ui-header title="Mes devis" [showBack]="true" backRoute="/requests">
        @if (store.pendingCount() > 0) {
          <span header-actions class="pending-badge">{{ store.pendingCount() }}</span>
        }
        <app-header-search
          placeholder="Rechercher (réparateur, appareil, service...)"
          (search)="onSearch($event)"
          (cleared)="onSearch('')"
        />
      </ui-header>

      <!-- Filters -->
      <div class="filters-section">
        <ui-tabs
          [tabs]="filterTabs"
          [activeTab]="store.filterStatus() || 'all'"
          (tabChange)="onTabChange($event)"
        />
      </div>

      <!-- Content -->
      @if (isLoading()) {
        <div class="skeleton-list">
          @for (item of [1, 2, 3]; track item) {
            <div class="skeleton-card">
              <ui-skeleton variant="text" width="80px" height="24px" />
              <div class="skeleton-header">
                <ui-skeleton variant="avatar" width="48px" height="48px" />
                <div class="skeleton-info">
                  <ui-skeleton variant="text" width="60%" />
                  <ui-skeleton variant="text" width="40%" height="12px" />
                </div>
              </div>
              <ui-skeleton variant="text" [count]="2" />
            </div>
          }
        </div>
      } @else if (error()) {
        <ui-error-state
          [message]="error()!"
          severity="error"
          [showRetry]="true"
          (onRetry)="loadQuotes()"
        />
      } @else if (searchedQuotes().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📋</span>
          <h3>Aucun devis</h3>
          <p>
            @if (store.filterStatus()) {
              Aucun devis avec ce statut
            } @else {
              Vous n'avez pas encore reçu de devis
            }
          </p>
          <ui-button variant="primary" routerLink="/search">
            Trouver un réparateur
          </ui-button>
        </div>
      } @else {
        <ui-data-grid
          [data]="searchedQuotes()"
          [pageSize]="10"
          [pageSizeOptions]="[10, 25, 50, 100]"
          [rowClickable]="true"
          emptyMessage="Aucun devis"
          (rowClick)="viewQuote($event.id)"
        >
          <ui-data-grid-column key="repairer" header="Réparateur">
            <ng-template let-row>
              <div class="cell-repairer">
                <div class="cell-avatar">
                  @if (row.repairer?.avatarUrl) {
                    <img [src]="row.repairer?.avatarUrl" alt="" />
                  } @else {
                    <span>{{ getRepairerInitials(row) }}</span>
                  }
                </div>
                <div class="cell-repairer-text">
                  <strong>{{ getRepairerName(row) }}</strong>
                  @if (row.repairer?.repairerProfile?.rating) {
                    <span class="muted">⭐ {{ row.repairer?.repairerProfile?.rating?.toFixed(1) }}</span>
                  }
                </div>
              </div>
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="device" header="Appareil / Service">
            <ng-template let-row>
              <div class="cell-device">
                @if (row.request?.device) {
                  <strong>{{ row.request.device.brand }} {{ row.request.device.model }}</strong>
                }
                @if (row.request?.serviceType) {
                  <span class="muted">🔧 {{ row.request.serviceType.name }}</span>
                }
              </div>
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="amount" header="Montant" align="right" field="totalAmount" [sortable]="true" width="140px">
            <ng-template let-row>
              <span class="amount-cell">
                {{ row.totalAmount | number:'1.0-0' }}
                <span class="currency">FCFA</span>
              </span>
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="duration" header="Durée" align="center" width="120px">
            <ng-template let-row>
              <span class="muted">⏱️ {{ row.estimatedDuration }}</span>
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="status" header="Statut" field="status" [sortable]="true">
            <ng-template let-row>
              <ui-badge [variant]="getStatusVariant(row.status)" size="sm">
                {{ quotesService.getStatusLabel(row.status) }}
              </ui-badge>
              @if (row.status === 'pending') {
                @if (quotesService.isExpired(row)) {
                  <span class="expiry-badge expired">Expiré</span>
                } @else {
                  <span class="expiry-badge" [class.warning]="quotesService.getDaysUntilExpiry(row) <= 2">
                    {{ getExpiryText(row) }}
                  </span>
                }
              }
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="createdAt" header="Reçu le" field="createdAt" [sortable]="true" width="120px">
            <ng-template let-row>
              <span class="date">{{ row.createdAt | formatDate }}</span>
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="actions" header="Actions" align="right" width="180px">
            <ng-template let-row>
              @if (row.status === 'pending' && !quotesService.isExpired(row)) {
                <div class="action-buttons-inline" (click)="$event.stopPropagation()">
                  <ui-button variant="outline" size="sm" (click)="rejectQuote(row)">Refuser</ui-button>
                  <ui-button variant="primary" size="sm" (click)="acceptQuote(row)">Accepter</ui-button>
                </div>
              } @else {
                <span class="muted">—</span>
              }
            </ng-template>
          </ui-data-grid-column>
        </ui-data-grid>
      }
    </div>
  `,
  styles: [`
    .quotes-container {
      min-height: 100vh;
      background: #f5f5f5;
      padding-top: var(--header-height, 100px);
      padding-bottom: 2rem;
    }

    .pending-badge {
      background: var(--color-error, #F44336);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .filters-section {
      padding: 1rem;
      background: white;
      border-bottom: 1px solid #eee;
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .filter-tab {
      padding: 0.5rem 1rem;
      border: none;
      background: #f5f5f5;
      border-radius: 20px;
      font-size: 0.875rem;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .filter-tab.active {
      background: var(--color-primary-500, #FF9800);
      color: white;
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      gap: 1rem;
    }

    .skeleton-list {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .skeleton-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .skeleton-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .skeleton-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .empty-icon {
      font-size: 4rem;
    }

    .empty-state h3 {
      margin: 0;
      font-size: 1.25rem;
    }

    .empty-state p {
      margin: 0;
      color: #666;
    }

    .quotes-list {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .quote-card {
      background: white;
      border-radius: 16px;
      padding: 1rem;
      position: relative;
      cursor: pointer;
      transition: all 0.2s;
    }

    .quote-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .quote-status {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }

    .quote-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      padding-right: 80px;
    }

    .repairer-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .repairer-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      overflow: hidden;
      background: #EEEEEE;
    }

    .repairer-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-primary-500, #FF9800);
      color: white;
      font-weight: 600;
    }

    .repairer-details {
      display: flex;
      flex-direction: column;
    }

    .repairer-name {
      font-weight: 600;
      color: #1f2937;
    }

    .repairer-rating {
      font-size: 0.75rem;
      color: var(--color-mustard, #FFC107);
    }

    .quote-amount {
      text-align: right;
    }

    .amount {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--color-primary-500, #FF9800);
    }

    .currency {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .quote-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
      background: #FAFAFA;
      border-radius: 12px;
      margin-bottom: 1rem;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .detail-icon {
      font-size: 1rem;
    }

    .quote-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.75rem;
    }

    .quote-date {
      color: #9ca3af;
    }

    .expiry-badge {
      padding: 0.25rem 0.5rem;
      background: #F5F5F5;
      border-radius: 4px;
      color: #6b7280;
    }

    .expiry-badge.warning {
      background: #FFF8E1;
      color: #92400e;
    }

    .expiry-badge.expired {
      background: #FFEBEE;
      color: #991b1b;
    }

    .quote-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #EEEEEE;
    }

    /* Cellules <ui-data-grid> */
    .cell-repairer {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      min-width: 0;
    }

    .cell-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      font-weight: 700;
      font-size: 0.8125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .cell-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cell-repairer-text,
    .cell-device {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .cell-repairer-text strong,
    .cell-device strong {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }

    .cell-repairer-text .muted,
    .cell-device .muted {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .muted { color: #9ca3af; }

    .amount-cell {
      font-weight: 700;
      color: var(--color-primary-500, #FF9800);
      font-size: 0.9375rem;
      font-variant-numeric: tabular-nums;
    }

    .amount-cell .currency {
      font-size: 0.75rem;
      color: #9ca3af;
      font-weight: 500;
      margin-left: 0.25rem;
    }

    .expiry-badge {
      display: inline-block;
      margin-left: 0.5rem;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #6b7280;
    }

    .expiry-badge.warning {
      color: var(--color-warning-dark, #F57C00);
    }

    .expiry-badge.expired {
      color: var(--color-error, #F44336);
    }

    .date {
      color: #6b7280;
      font-size: 0.8125rem;
      font-variant-numeric: tabular-nums;
    }

    .action-buttons-inline {
      display: inline-flex;
      gap: 0.375rem;
      justify-content: flex-end;
    }
  `]
})
export class QuoteListComponent implements OnInit {
  readonly quotesService = inject(QuotesService);
  readonly store = inject(QuotesStore);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');

  /** Filtre local sur la liste déjà filtrée par statut. */
  readonly searchedQuotes = computed(() => {
    const list = this.store.filteredQuotes();
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;
    return list.filter((quote) => {
      const r = quote.repairer;
      const pieces: string[] = [
        r?.repairerProfile?.businessName ?? '',
        r ? `${r.firstName} ${r.lastName}` : '',
        quote.request?.device?.brand ?? '',
        quote.request?.device?.model ?? '',
        quote.request?.serviceType?.name ?? '',
        String(quote.totalAmount ?? ''),
      ];
      return pieces.some((s) => s.toLowerCase().includes(q));
    });
  });

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  readonly filterTabs: TabItem[] = [
    { id: 'all', label: 'Tous' },
    { id: 'pending', label: 'En attente' },
    { id: 'accepted', label: 'Acceptés' },
    { id: 'rejected', label: 'Refusés' },
  ];

  async ngOnInit(): Promise<void> {
    await this.loadQuotes();
  }

  async loadQuotes(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const result = await this.quotesService.getQuotes();
      this.store.setQuotes(result.data, result.total);
    } catch (err: any) {
      this.logger.error('QuoteListComponent', 'Error loading quotes', err);
      this.error.set(err.message || 'Impossible de charger les devis');
    } finally {
      this.isLoading.set(false);
    }
  }

  setFilter(status: QuoteStatus | null): void {
    this.store.setFilterStatus(status);
  }

  onTabChange(tabId: string): void {
    const status = tabId === 'all' ? null : tabId as QuoteStatus;
    this.setFilter(status);
  }

  getStatusVariant(status: string): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
    switch (status) {
      case 'pending': return 'warning';
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      case 'expired': return 'default';
      default: return 'primary';
    }
  }

  getRepairerName(quote: Quote): string {
    if (quote.repairer?.repairerProfile?.businessName) {
      return quote.repairer.repairerProfile.businessName;
    }
    if (quote.repairer?.firstName || quote.repairer?.lastName) {
      return `${quote.repairer.firstName || ''} ${quote.repairer.lastName || ''}`.trim();
    }
    return 'Réparateur';
  }

  getRepairerInitials(quote: Quote): string {
    const name = this.getRepairerName(quote);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getExpiryText(quote: Quote): string {
    const days = this.quotesService.getDaysUntilExpiry(quote);
    if (days <= 0) return 'aujourd\'hui';
    if (days === 1) return 'demain';
    return `dans ${days} jours`;
  }

  viewQuote(id: string): void {
    this.router.navigate(['/quotes', id]);
  }

  async acceptQuote(quote: Quote): Promise<void> {
    try {
      await this.quotesService.acceptQuote(quote.id);
      this.store.updateQuote(quote.id, { status: 'accepted' });

      // Redirect to payment page after successful acceptance
      this.router.navigate(['/payment/summary'], {
        queryParams: { requestId: quote.requestId, quoteId: quote.id }
      });
    } catch (err) {
      this.logger.error('QuoteListComponent', 'Error accepting quote', err);
    }
  }

  async rejectQuote(quote: Quote): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir refuser ce devis ?')) return;

    try {
      await this.quotesService.rejectQuote(quote.id);
      this.store.updateQuote(quote.id, { status: 'rejected' });
    } catch (err) {
      this.logger.error('QuoteListComponent', 'Error rejecting quote', err);
    }
  }
}

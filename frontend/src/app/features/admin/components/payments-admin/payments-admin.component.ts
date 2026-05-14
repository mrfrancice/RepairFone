import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AdminService,
  PaymentForAdmin,
  PaymentsAdminStats,
} from '../../services/admin.service';
import { UiHeaderComponent } from '@app/features/common/components';
import { HeaderSearchComponent } from '../../../../shared/components/header-search/header-search.component';
import {
  UiDataGridComponent,
  UiDataGridColumnComponent,
  DataGridPageEvent,
  DataGridSortEvent,
} from '../../../../shared/components/ui-data-grid';

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'blocked';
type SortField = 'createdAt' | 'amount' | 'status' | 'paidAt';

const SORT_FIELD_MAP: Record<string, SortField> = {
  amount: 'amount',
  status: 'status',
  paidAt: 'paidAt',
  createdAt: 'createdAt',
};

@Component({
  selector: 'app-payments-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    UiHeaderComponent,
    HeaderSearchComponent,
    UiDataGridComponent,
    UiDataGridColumnComponent,
  ],
  template: `
    <div class="admin-page">
      <ui-header
        title="Audit des paiements"
        [subtitle]="total() + ' paiement(s) au total'"
        [showBack]="true"
        [showProfile]="true"
        backRoute="/admin"
      >
        <app-header-search
          placeholder="N° paiement, référence, client..."
          (search)="onHeaderSearch($event)"
          (cleared)="clearSearch()"
        />
      </ui-header>

      <div class="admin-container">
        @if (stats(); as s) {
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Volume total</div>
              <div class="stat-value">{{ s.total }}</div>
            </div>
            <div class="stat-card success">
              <div class="stat-label">Revenu brut</div>
              <div class="stat-value">{{ formatAmount(s.revenue.gross) }}</div>
            </div>
            <div class="stat-card primary">
              <div class="stat-label">Frais plateforme</div>
              <div class="stat-value">{{ formatAmount(s.revenue.platformFees) }}</div>
            </div>
            <div class="stat-card warning">
              <div class="stat-label">Remboursés</div>
              <div class="stat-value">{{ formatAmount(s.revenue.refunded) }}</div>
            </div>
          </div>
        }

        <div class="filters-section">
          <div class="filter-group">
            <label>Statut</label>
            <div class="filter-buttons">
              @for (opt of statusOptions; track opt.value) {
                <button
                  class="filter-btn"
                  [class.active]="statusFilter() === opt.value"
                  (click)="setStatusFilter(opt.value)"
                >
                  {{ opt.label }}
                </button>
              }
            </div>
          </div>
        </div>

        @if (error()) {
          <div class="error-state">
            <p>{{ error() }}</p>
            <button class="btn btn-primary" (click)="loadPayments()">Réessayer</button>
          </div>
        } @else if (!isLoading() && payments().length === 0) {
          <div class="empty-state">
            <h3>Aucun paiement</h3>
            <p>Aucun paiement ne correspond aux filtres.</p>
          </div>
        } @else {
          <ui-data-grid
            [data]="payments()"
            [serverSide]="true"
            [total]="total()"
            [loading]="isLoading()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [rowClickable]="true"
            (pageChange)="onPageChange($event)"
            (sortChange)="onSortChange($event)"
            (rowClick)="openDetail($event)"
            emptyMessage="Aucun paiement"
          >
            <ui-data-grid-column key="paymentNumber" header="N° paiement" field="paymentNumber">
              <ng-template let-row>
                <span class="payment-number">{{ row.paymentNumber }}</span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="parties" header="Parties">
              <ng-template let-row>
                <div class="cell-parties">
                  <div class="client">{{ fullName(row.client) }}</div>
                  <div class="repairer">{{ row.repairer?.businessName || fullName(row.repairer?.user) }}</div>
                </div>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="amount" header="Montant" field="amount" align="right" [sortable]="true">
              <ng-template let-row>
                <span class="amount">{{ formatAmount(row.amount) }}</span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="method" header="Méthode">
              <ng-template let-row>
                <span class="method">{{ paymentMethodLabel(row.paymentMethod) }}</span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="status" header="Statut" field="status" [sortable]="true">
              <ng-template let-row>
                <span class="status-badge" [class]="row.status">
                  <span class="dot"></span>
                  {{ statusLabel(row.status) }}
                </span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="createdAt" header="Date" field="createdAt" [sortable]="true">
              <ng-template let-row>
                <span class="date">{{ row.createdAt | date:'dd/MM/yy HH:mm' }}</span>
              </ng-template>
            </ui-data-grid-column>
          </ui-data-grid>
        }
      </div>

      @if (selectedPayment(); as p) {
        <div class="drawer-overlay" (click)="closeDetail()">
          <aside class="drawer" (click)="$event.stopPropagation()">
            <header class="drawer-header">
              <div>
                <h2>{{ p.paymentNumber }}</h2>
                <span class="status-badge" [class]="p.status">
                  <span class="dot"></span>{{ statusLabel(p.status) }}
                </span>
              </div>
              <button class="close-btn" (click)="closeDetail()" aria-label="Fermer">×</button>
            </header>
            <div class="drawer-body">
              <section>
                <h3>Montants</h3>
                <dl>
                  <div><dt>Montant</dt><dd>{{ formatAmount(p.amount) }}</dd></div>
                  <div><dt>Frais plateforme</dt><dd>{{ formatAmount(p.platformFee || 0) }}</dd></div>
                  <div><dt>Net réparateur</dt><dd>{{ formatAmount(p.repairerAmount || 0) }}</dd></div>
                </dl>
              </section>
              <section>
                <h3>Méthode</h3>
                <dl>
                  <div><dt>Mode</dt><dd>{{ paymentMethodLabel(p.paymentMethod) }}</dd></div>
                  <div><dt>Type</dt><dd>{{ p.paymentType }}</dd></div>
                  @if (p.transactionRef) {
                    <div><dt>Réf. transaction</dt><dd>{{ p.transactionRef }}</dd></div>
                  }
                </dl>
              </section>
              <section>
                <h3>Client</h3>
                <p>{{ fullName(p.client) }} — {{ p.client?.phone || '—' }}</p>
              </section>
              <section>
                <h3>Réparateur</h3>
                <p>{{ p.repairer?.businessName || fullName(p.repairer?.user) }} — {{ p.repairer?.user?.phone || '—' }}</p>
              </section>
              @if (p.request) {
                <section>
                  <h3>Réparation</h3>
                  <p>
                    @if (p.request.device) {
                      {{ p.request.device.brand }} {{ p.request.device.model }}
                    }
                    @if (p.request.serviceType) {
                      — {{ p.request.serviceType.name }}
                    }
                  </p>
                </section>
              }
              <section>
                <h3>Dates</h3>
                <dl>
                  <div><dt>Créé le</dt><dd>{{ p.createdAt | date:'dd/MM/yy HH:mm' }}</dd></div>
                  @if (p.paidAt) {
                    <div><dt>Payé le</dt><dd>{{ p.paidAt | date:'dd/MM/yy HH:mm' }}</dd></div>
                  }
                </dl>
              </section>

              <!-- ==================== ACTIONS ADMIN ==================== -->
              <section class="admin-actions">
                <h3>Actions admin</h3>
                @if (p.status === 'completed') {
                  <button class="btn btn-warning btn-block" (click)="openBlockModal()">
                    Bloquer ce paiement
                  </button>
                  <button class="btn btn-danger btn-block" (click)="openRefundModal()">
                    Rembourser manuellement
                  </button>
                }
                @if (p.status === 'blocked') {
                  <button class="btn btn-success btn-block" (click)="unblock(p.id)" [disabled]="processingAction()">
                    Débloquer le paiement
                  </button>
                  <button class="btn btn-danger btn-block" (click)="openRefundModal()">
                    Rembourser manuellement
                  </button>
                }
                @if (p.status === 'refunded') {
                  <p class="muted-info">Ce paiement a été remboursé le {{ p.paidAt ? (p.createdAt | date:'dd/MM/yy') : '—' }}. Aucune action possible.</p>
                }
                @if (p.status === 'pending' || p.status === 'processing' || p.status === 'failed') {
                  <p class="muted-info">Aucune action admin disponible sur un paiement {{ statusLabel(p.status) | lowercase }}.</p>
                }
              </section>
            </div>
          </aside>
        </div>
      }

      <!-- ==================== MODAL REFUND ==================== -->
      @if (showRefundModal()) {
        <div class="modal-overlay" (click)="closeRefundModal()">
          <div class="modal danger" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h3>Confirmer le remboursement manuel</h3>
              <button class="close-btn" (click)="closeRefundModal()" aria-label="Fermer">×</button>
            </header>
            <div class="modal-body">
              <p class="warning-banner">
                <strong>Attention :</strong> Cette action marque le paiement comme remboursé en base.
                Elle n'effectue PAS le transfert réel vers le client — vous devez avoir effectué le
                remboursement (Orange Money, virement) AVANT d'utiliser ce bouton.
              </p>
              <div class="form-group">
                <label>Raison du remboursement *</label>
                <textarea
                  [(ngModel)]="refundReason"
                  rows="3"
                  placeholder="ex: Réparation non aboutie, refund accordé suite litige #..."
                  [disabled]="processingAction()"
                ></textarea>
              </div>
              @if (paymentActionError()) {
                <p class="error-msg">{{ paymentActionError() }}</p>
              }
            </div>
            <footer class="modal-footer">
              <button class="btn btn-outline" (click)="closeRefundModal()" [disabled]="processingAction()">
                Annuler
              </button>
              <button
                class="btn btn-danger"
                [disabled]="!refundReason.trim() || processingAction()"
                (click)="submitRefund()"
              >
                @if (processingAction()) { <span class="spinner-small"></span> }
                Confirmer le refund
              </button>
            </footer>
          </div>
        </div>
      }

      <!-- ==================== MODAL BLOCK ==================== -->
      @if (showBlockModal()) {
        <div class="modal-overlay" (click)="closeBlockModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <header class="modal-header warning">
              <h3>Bloquer le paiement</h3>
              <button class="close-btn" (click)="closeBlockModal()" aria-label="Fermer">×</button>
            </header>
            <div class="modal-body">
              <p class="muted-info">
                Le paiement sera marqué BLOCKED. Le réparateur ne pourra pas accéder aux fonds
                tant qu'il n'est pas débloqué.
              </p>
              <div class="form-group">
                <label>Raison du blocage *</label>
                <textarea
                  [(ngModel)]="blockReason"
                  rows="3"
                  placeholder="ex: Suspicion de fraude, dispute en cours..."
                  [disabled]="processingAction()"
                ></textarea>
              </div>
              @if (paymentActionError()) {
                <p class="error-msg">{{ paymentActionError() }}</p>
              }
            </div>
            <footer class="modal-footer">
              <button class="btn btn-outline" (click)="closeBlockModal()" [disabled]="processingAction()">
                Annuler
              </button>
              <button
                class="btn btn-warning"
                [disabled]="!blockReason.trim() || processingAction()"
                (click)="submitBlock()"
              >
                @if (processingAction()) { <span class="spinner-small"></span> }
                Confirmer le blocage
              </button>
            </footer>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { min-height: 100vh; background: #FAFAFA; }
    .admin-container { padding: 1rem; padding-top: 180px; padding-bottom: 100px; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: white;
      padding: 1.25rem;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      border-left: 4px solid #6b7280;
    }
    .stat-card.success { border-left-color: #2E7D32; }
    .stat-card.primary { border-left-color: var(--color-primary-500, #FF9800); }
    .stat-card.warning { border-left-color: #F57C00; }
    .stat-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1f2937; font-variant-numeric: tabular-nums; }

    .filters-section {
      padding: 1.25rem;
      background: white;
      border-radius: 16px;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .filter-group label {
      display: block;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 0.625rem;
    }
    .filter-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .filter-btn {
      padding: 0.5rem 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      background: white;
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover { border-color: #D1D5DB; background: #FAFAFA; }
    .filter-btn.active {
      background: linear-gradient(135deg, #1f2937, #374151);
      border-color: #1f2937;
      color: white;
    }

    .payment-number { font-family: monospace; font-size: 0.8125rem; color: #1f2937; }
    .cell-parties { display: flex; flex-direction: column; gap: 0.125rem; }
    .cell-parties .client { font-weight: 600; color: #1f2937; font-size: 0.875rem; }
    .cell-parties .repairer { color: #6b7280; font-size: 0.75rem; }
    .amount { font-variant-numeric: tabular-nums; font-weight: 600; color: #1f2937; }
    .method { color: #6b7280; font-size: 0.8125rem; }
    .date { color: #6b7280; font-size: 0.8125rem; font-variant-numeric: tabular-nums; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-badge.pending { background: #FFF8E1; color: #F57C00; }
    .status-badge.processing { background: #E3F2FD; color: #1565C0; }
    .status-badge.completed { background: #E8F5E9; color: #2E7D32; }
    .status-badge.failed, .status-badge.blocked { background: #FFEBEE; color: #C62828; }
    .status-badge.refunded { background: #F3E5F5; color: #6A1B9A; }

    .error-state, .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }

    .btn { padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825)); color: white; }

    /* Drawer */
    .drawer-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      z-index: 1100;
      display: flex; justify-content: flex-end;
    }
    .drawer {
      width: 100%;
      max-width: 480px;
      height: 100%;
      background: white;
      overflow-y: auto;
      overscroll-behavior: contain;
      box-shadow: -8px 0 24px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .drawer-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 1.5rem;
      background: linear-gradient(135deg, #1f2937, #374151);
      color: white;
    }
    .drawer-header h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .close-btn {
      width: 36px; height: 36px;
      border: none; background: rgba(255,255,255,0.15);
      color: white; border-radius: 12px;
      font-size: 1.5rem; cursor: pointer;
    }
    .drawer-body { padding: 1.5rem; }
    .drawer-body section { margin-bottom: 1.5rem; }
    .drawer-body section h3 {
      font-size: 0.75rem; font-weight: 700;
      color: #6b7280; text-transform: uppercase;
      letter-spacing: 0.5px; margin-bottom: 0.75rem;
    }
    .drawer-body dl { display: flex; flex-direction: column; gap: 0.5rem; }
    .drawer-body dl > div { display: flex; justify-content: space-between; }
    .drawer-body dt { color: #6b7280; font-size: 0.875rem; }
    .drawer-body dd { color: #1f2937; font-weight: 600; font-size: 0.875rem; font-variant-numeric: tabular-nums; }

    /* Admin actions in drawer */
    .admin-actions { padding-top: 1rem; border-top: 1px solid #EEEEEE; display: flex; flex-direction: column; gap: 0.5rem; }
    .admin-actions h3 { margin-bottom: 0.5rem; }
    .muted-info {
      color: #6b7280; font-size: 0.8125rem; padding: 0.75rem;
      background: #FAFAFA; border-radius: 8px;
      border-left: 3px solid #D1D5DB;
    }
    .btn-block { width: 100%; padding: 0.75rem; }
    .btn-warning { background: linear-gradient(135deg, #F57C00, #FF9800); color: white; }
    .btn-warning:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-danger { background: linear-gradient(135deg, #C62828, #EF5350); color: white; }
    .btn-danger:hover:not(:disabled) { transform: translateY(-1px); }
    .btn-success { background: linear-gradient(135deg, #2E7D32, #66BB6A); color: white; }
    .btn-outline { background: white; border: 2px solid #EEEEEE; color: #374151; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center; padding: 1rem;
      z-index: 1200;
    }
    .modal {
      background: white; border-radius: 20px; width: 100%; max-width: 480px;
      overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .modal-header {
      padding: 1.25rem 1.5rem; color: white;
      display: flex; justify-content: space-between; align-items: center;
      background: linear-gradient(135deg, #1f2937, #374151);
    }
    .modal-header.warning { background: linear-gradient(135deg, #F57C00, #FFB74D); }
    .modal.danger .modal-header { background: linear-gradient(135deg, #C62828, #EF5350); }
    .modal-header h3 { font-size: 1.125rem; }
    .modal-body { padding: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .form-group textarea {
      width: 100%; padding: 0.75rem; border: 2px solid #EEEEEE;
      border-radius: 10px; font-family: inherit; font-size: 0.9375rem; resize: vertical;
    }
    .form-group textarea:focus { outline: none; border-color: var(--color-primary-500, #FF9800); }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding: 1rem 1.5rem; background: #FAFAFA; border-top: 1px solid #EEEEEE;
    }
    .warning-banner {
      background: #FFF3E0; color: #E65100;
      padding: 0.75rem 1rem; border-radius: 10px;
      font-size: 0.8125rem; border-left: 4px solid #F57C00;
      margin-bottom: 1rem;
    }
    .error-msg { color: #C62828; font-size: 0.875rem; padding: 0.5rem 0.75rem; background: #FFEBEE; border-radius: 6px; }
    .spinner-small {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      display: inline-block; margin-right: 0.5rem;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class PaymentsAdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly payments = signal<PaymentForAdmin[]>([]);
  readonly total = signal(0);
  readonly stats = signal<PaymentsAdminStats | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sortField = signal<SortField>('createdAt');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly selectedPayment = signal<PaymentForAdmin | null>(null);
  readonly showRefundModal = signal(false);
  readonly showBlockModal = signal(false);
  readonly processingAction = signal(false);
  readonly paymentActionError = signal<string | null>(null);

  searchQuery = '';
  refundReason = '';
  blockReason = '';

  readonly statusOptions = [
    { value: 'all' as StatusFilter, label: 'Tous' },
    { value: 'pending' as StatusFilter, label: 'En attente' },
    { value: 'processing' as StatusFilter, label: 'En cours' },
    { value: 'completed' as StatusFilter, label: 'Payés' },
    { value: 'failed' as StatusFilter, label: 'Échoués' },
    { value: 'refunded' as StatusFilter, label: 'Remboursés' },
    { value: 'blocked' as StatusFilter, label: 'Bloqués' },
  ];

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['status']) {
          this.statusFilter.set(params['status'] as StatusFilter);
        }
        this.loadPayments();
        this.loadStats();
      });
  }

  async loadPayments(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await this.adminService.getPayments({
        status: this.statusFilter() === 'all' ? undefined : this.statusFilter(),
        page: this.page(),
        limit: this.pageSize(),
        search: this.searchQuery || undefined,
        sort: this.sortField(),
        order: this.sortOrder(),
      });
      this.payments.set(res.data);
      this.total.set(res.total);
    } catch (err: any) {
      this.error.set(err?.message || 'Erreur lors du chargement');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadStats(): Promise<void> {
    try {
      const s = await this.adminService.getPaymentsStats();
      this.stats.set(s);
    } catch {
      // stats non bloquant
    }
  }

  setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.router.navigate([], {
      queryParams: { status: status === 'all' ? null : status },
      queryParamsHandling: 'merge',
    });
    this.loadPayments();
  }

  onPageChange(e: DataGridPageEvent): void {
    this.page.set(e.page);
    this.pageSize.set(e.pageSize);
    this.loadPayments();
  }

  onSortChange(e: DataGridSortEvent): void {
    this.sortField.set(SORT_FIELD_MAP[e.field] ?? 'createdAt');
    this.sortOrder.set(e.direction);
    this.page.set(1);
    this.loadPayments();
  }

  onHeaderSearch(q: string): void {
    this.searchQuery = q;
    this.page.set(1);
    this.loadPayments();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.page.set(1);
    this.loadPayments();
  }

  async openDetail(payment: PaymentForAdmin): Promise<void> {
    try {
      const full = await this.adminService.getPaymentDetail(payment.id);
      this.selectedPayment.set(full);
    } catch (err: any) {
      this.error.set(err?.message || 'Erreur lors du chargement du détail');
    }
  }

  closeDetail(): void {
    this.selectedPayment.set(null);
    this.closeRefundModal();
    this.closeBlockModal();
  }

  // ===== Refund =====
  openRefundModal(): void {
    this.refundReason = '';
    this.paymentActionError.set(null);
    this.showRefundModal.set(true);
  }

  closeRefundModal(): void {
    this.showRefundModal.set(false);
  }

  async submitRefund(): Promise<void> {
    const payment = this.selectedPayment();
    if (!payment || !this.refundReason.trim() || this.processingAction()) return;
    this.processingAction.set(true);
    this.paymentActionError.set(null);
    try {
      const updated = await this.adminService.refundPayment(payment.id, this.refundReason.trim());
      this.selectedPayment.set(updated);
      this.closeRefundModal();
      this.loadPayments();
      this.loadStats();
    } catch (err: any) {
      this.paymentActionError.set(err?.error?.message || err?.message || 'Erreur lors du remboursement');
    } finally {
      this.processingAction.set(false);
    }
  }

  // ===== Block / Unblock =====
  openBlockModal(): void {
    this.blockReason = '';
    this.paymentActionError.set(null);
    this.showBlockModal.set(true);
  }

  closeBlockModal(): void {
    this.showBlockModal.set(false);
  }

  async submitBlock(): Promise<void> {
    const payment = this.selectedPayment();
    if (!payment || !this.blockReason.trim() || this.processingAction()) return;
    this.processingAction.set(true);
    this.paymentActionError.set(null);
    try {
      const updated = await this.adminService.blockPayment(payment.id, this.blockReason.trim());
      this.selectedPayment.set(updated);
      this.closeBlockModal();
      this.loadPayments();
      this.loadStats();
    } catch (err: any) {
      this.paymentActionError.set(err?.error?.message || err?.message || 'Erreur lors du blocage');
    } finally {
      this.processingAction.set(false);
    }
  }

  async unblock(paymentId: string): Promise<void> {
    if (this.processingAction()) return;
    this.processingAction.set(true);
    this.paymentActionError.set(null);
    try {
      const updated = await this.adminService.unblockPayment(paymentId);
      this.selectedPayment.set(updated);
      this.loadPayments();
      this.loadStats();
    } catch (err: any) {
      this.paymentActionError.set(err?.error?.message || err?.message || 'Erreur lors du déblocage');
    } finally {
      this.processingAction.set(false);
    }
  }

  fullName(p: { firstName?: string; lastName?: string } | null | undefined): string {
    if (!p) return '—';
    return [p.firstName, p.lastName].filter(Boolean).join(' ') || '—';
  }

  formatAmount(amount: number | string | null | undefined): string {
    if (amount == null) return '0 FCFA';
    const n = typeof amount === 'string' ? Number(amount) : amount;
    return `${n.toLocaleString('fr-FR')} FCFA`;
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      pending: 'En attente',
      processing: 'En cours',
      completed: 'Payé',
      failed: 'Échoué',
      refunded: 'Remboursé',
      blocked: 'Bloqué',
    };
    return map[s] ?? s;
  }

  paymentMethodLabel(m?: string | null): string {
    if (!m) return '—';
    const map: Record<string, string> = {
      orange_money: 'Orange Money',
      mtn_money: 'MTN Money',
      wave: 'Wave',
      cash: 'Espèces',
      card: 'Carte bancaire',
    };
    return map[m] ?? m;
  }
}

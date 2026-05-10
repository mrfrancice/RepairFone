import {
  Component,
  inject,
  signal,
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
  DisputeForAdmin,
  DisputesAdminStats,
} from '../../services/admin.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { HeaderSearchComponent } from '../../../../shared/components/header-search/header-search.component';
import {
  UiDataGridComponent,
  UiDataGridColumnComponent,
  DataGridPageEvent,
  DataGridSortEvent,
} from '../../../../shared/components/ui-data-grid';

type StatusFilter = 'all' | 'open' | 'in_review' | 'resolved' | 'closed' | 'rejected';
type SortField = 'createdAt' | 'status' | 'resolvedAt';

const SORT_FIELD_MAP: Record<string, SortField> = {
  status: 'status',
  resolvedAt: 'resolvedAt',
  createdAt: 'createdAt',
};

@Component({
  selector: 'app-disputes-admin',
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
        title="Audit des litiges"
        [subtitle]="total() + ' litige(s) au total'"
        [showBack]="true"
        [showProfile]="true"
        backRoute="/admin"
      >
        <app-header-search
          placeholder="Client, description..."
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
            <div class="stat-card warning">
              <div class="stat-label">Ouverts</div>
              <div class="stat-value">{{ s.byStatus['open'] || 0 }}</div>
            </div>
            <div class="stat-card success">
              <div class="stat-label">Résolus</div>
              <div class="stat-value">{{ s.byStatus['resolved'] || 0 }}</div>
            </div>
            <div class="stat-card primary">
              <div class="stat-label">Délai moyen</div>
              <div class="stat-value">
                @if (s.avgResolutionDays != null) {
                  {{ s.avgResolutionDays | number:'1.0-1' }} j
                } @else { — }
              </div>
            </div>
            <div class="stat-card danger">
              <div class="stat-label">Total remboursé</div>
              <div class="stat-value">{{ formatAmount(s.totalRefundedAmount) }}</div>
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
            <button class="btn btn-primary" (click)="loadDisputes()">Réessayer</button>
          </div>
        } @else if (!isLoading() && disputes().length === 0) {
          <div class="empty-state">
            <h3>Aucun litige</h3>
            <p>Aucun litige ne correspond aux filtres.</p>
          </div>
        } @else {
          <ui-data-grid
            [data]="disputes()"
            [serverSide]="true"
            [total]="total()"
            [loading]="isLoading()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [rowClickable]="true"
            (pageChange)="onPageChange($event)"
            (sortChange)="onSortChange($event)"
            (rowClick)="openDetail($event)"
            emptyMessage="Aucun litige"
          >
            <ui-data-grid-column key="client" header="Client">
              <ng-template let-row>
                <div class="cell-client">
                  <strong>{{ fullName(row.client) }}</strong>
                  <span>{{ row.client?.phone }}</span>
                </div>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="repairer" header="Réparateur">
              <ng-template let-row>
                <div class="cell-client">
                  <strong>{{ row.repairer?.businessName || fullName(row.repairer?.user) }}</strong>
                </div>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="reason" header="Motif">
              <ng-template let-row>
                <span class="reason">{{ reasonLabel(row.reason) }}</span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="status" header="Statut" field="status" [sortable]="true">
              <ng-template let-row>
                <span class="status-badge" [class]="row.status">
                  <span class="dot"></span>{{ statusLabel(row.status) }}
                </span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="refund" header="Remboursement" align="right">
              <ng-template let-row>
                <span class="refund">
                  @if (row.refundAmount) {
                    {{ formatAmount(row.refundAmount) }}
                  } @else { — }
                </span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="createdAt" header="Ouvert le" field="createdAt" [sortable]="true">
              <ng-template let-row>
                <span class="date">{{ row.createdAt | date:'dd/MM/yy' }}</span>
              </ng-template>
            </ui-data-grid-column>
          </ui-data-grid>
        }
      </div>

      @if (selectedDispute(); as d) {
        <div class="drawer-overlay" (click)="closeDetail()">
          <aside class="drawer" (click)="$event.stopPropagation()">
            <header class="drawer-header">
              <div>
                <h2>Litige #{{ d.id.slice(0, 8) }}</h2>
                <span class="status-badge" [class]="d.status">
                  <span class="dot"></span>{{ statusLabel(d.status) }}
                </span>
              </div>
              <button class="close-btn" (click)="closeDetail()" aria-label="Fermer">×</button>
            </header>
            <div class="drawer-body">
              <section>
                <h3>Motif</h3>
                <p>{{ reasonLabel(d.reason) }}</p>
              </section>
              <section>
                <h3>Description</h3>
                <p class="multiline">{{ d.description }}</p>
              </section>
              <section>
                <h3>Parties</h3>
                <p><strong>Client :</strong> {{ fullName(d.client) }} — {{ d.client?.phone || '—' }}</p>
                <p><strong>Réparateur :</strong> {{ d.repairer?.businessName || fullName(d.repairer?.user) }}</p>
              </section>
              @if (d.request?.device) {
                <section>
                  <h3>Appareil concerné</h3>
                  <p>{{ d.request?.device?.brand }} {{ d.request?.device?.model }}</p>
                </section>
              }
              @if (d.resolution || d.resolutionNotes) {
                <section>
                  <h3>Résolution</h3>
                  @if (d.resolution) {
                    <p><strong>Décision :</strong> {{ resolutionLabel(d.resolution) }}</p>
                  }
                  @if (d.refundAmount) {
                    <p><strong>Remboursement :</strong> {{ formatAmount(d.refundAmount) }}</p>
                  }
                  @if (d.resolutionNotes) {
                    <p class="multiline">{{ d.resolutionNotes }}</p>
                  }
                  @if (d.resolvedAt) {
                    <p class="muted">Résolu le {{ d.resolvedAt | date:'dd/MM/yy HH:mm' }}</p>
                  }
                </section>
              }
              @if (d.messages && d.messages.length > 0) {
                <section>
                  <h3>Messages ({{ d.messages.length }})</h3>
                  <div class="messages">
                    @for (m of d.messages; track m.id) {
                      <div class="message" [class]="m.senderType">
                        <div class="msg-meta">
                          <strong>{{ senderTypeLabel(m.senderType) }}</strong>
                          <span class="date">{{ m.createdAt | date:'dd/MM HH:mm' }}</span>
                        </div>
                        <p>{{ m.message }}</p>
                      </div>
                    }
                  </div>
                </section>
              }
              <section>
                <h3>Dates</h3>
                <dl>
                  <div><dt>Ouvert le</dt><dd>{{ d.createdAt | date:'dd/MM/yy HH:mm' }}</dd></div>
                  @if (d.resolvedAt) {
                    <div><dt>Résolu le</dt><dd>{{ d.resolvedAt | date:'dd/MM/yy HH:mm' }}</dd></div>
                  }
                </dl>
              </section>

              <!-- ==================== ACTIONS ADMIN ==================== -->
              @if (d.status !== 'resolved' && d.status !== 'closed') {
                <section class="admin-actions">
                  <h3>Actions admin</h3>

                  <!-- Note interne -->
                  <div class="note-form">
                    <label>Ajouter une note (publiée dans le fil)</label>
                    <textarea
                      [(ngModel)]="newNote"
                      placeholder="Note interne ou réponse au client / réparateur..."
                      rows="2"
                      [disabled]="processingAction()"
                    ></textarea>
                    <button
                      class="btn btn-outline"
                      [disabled]="!newNote.trim() || processingAction()"
                      (click)="submitNote(d.id)"
                    >
                      Publier la note
                    </button>
                  </div>

                  <button class="btn btn-primary btn-block" (click)="openResolveModal()">
                    Résoudre le litige
                  </button>
                </section>
              }
            </div>
          </aside>
        </div>
      }

      <!-- ==================== MODAL RÉSOLUTION ==================== -->
      @if (showResolveModal()) {
        <div class="modal-overlay" (click)="closeResolveModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <header class="modal-header">
              <h3>Résoudre le litige</h3>
              <button class="close-btn" (click)="closeResolveModal()" aria-label="Fermer">×</button>
            </header>
            <div class="modal-body">
              <div class="form-group">
                <label>Décision</label>
                <select [(ngModel)]="resolveForm.resolution" [disabled]="processingAction()">
                  <option value="">— Sélectionnez —</option>
                  <option value="refund_full">Remboursement intégral</option>
                  <option value="refund_partial">Remboursement partiel</option>
                  <option value="redo_repair">Reprise de la réparation</option>
                  <option value="no_action">Sans suite</option>
                  <option value="other">Autre</option>
                </select>
              </div>

              @if (resolveForm.resolution === 'refund_partial' || resolveForm.resolution === 'refund_full') {
                <div class="form-group">
                  <label>Montant remboursé (FCFA)</label>
                  <input
                    type="number"
                    [(ngModel)]="resolveForm.refundAmount"
                    placeholder="ex: 5000"
                    [disabled]="processingAction()"
                    min="0"
                  />
                </div>
              }

              <div class="form-group">
                <label>Notes de résolution</label>
                <textarea
                  [(ngModel)]="resolveForm.notes"
                  rows="4"
                  placeholder="Justifie la décision..."
                  [disabled]="processingAction()"
                ></textarea>
              </div>

              @if (resolveError()) {
                <p class="error-msg">{{ resolveError() }}</p>
              }
            </div>
            <footer class="modal-footer">
              <button class="btn btn-outline" (click)="closeResolveModal()" [disabled]="processingAction()">
                Annuler
              </button>
              <button
                class="btn btn-primary"
                [disabled]="!resolveForm.resolution || processingAction()"
                (click)="submitResolve()"
              >
                @if (processingAction()) {
                  <span class="spinner-small"></span>
                }
                Confirmer la résolution
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
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .stat-card {
      background: white; padding: 1.25rem; border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      border-left: 4px solid #6b7280;
    }
    .stat-card.success { border-left-color: #2E7D32; }
    .stat-card.primary { border-left-color: var(--color-primary-500, #FF9800); }
    .stat-card.warning { border-left-color: #F57C00; }
    .stat-card.danger { border-left-color: #C62828; }
    .stat-label { font-size: 0.75rem; color: #6b7280; text-transform: uppercase; margin-bottom: 0.5rem; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: #1f2937; font-variant-numeric: tabular-nums; }

    .filters-section {
      padding: 1.25rem; background: white; border-radius: 16px;
      margin-bottom: 1.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }
    .filter-group label { display: block; font-size: 0.6875rem; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 0.625rem; }
    .filter-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .filter-btn {
      padding: 0.5rem 1rem; border: 2px solid #EEEEEE; border-radius: 12px;
      background: white; color: #6b7280;
      font-size: 0.875rem; font-weight: 500; cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover { border-color: #D1D5DB; background: #FAFAFA; }
    .filter-btn.active {
      background: linear-gradient(135deg, #1f2937, #374151);
      border-color: #1f2937; color: white;
    }

    .cell-client { display: flex; flex-direction: column; }
    .cell-client strong { font-weight: 600; color: #1f2937; font-size: 0.875rem; }
    .cell-client span { font-size: 0.75rem; color: #9ca3af; font-variant-numeric: tabular-nums; }
    .reason { color: #374151; font-size: 0.8125rem; }
    .refund { font-variant-numeric: tabular-nums; font-weight: 600; color: #C62828; }
    .date { color: #6b7280; font-size: 0.8125rem; font-variant-numeric: tabular-nums; }

    .status-badge {
      display: inline-flex; align-items: center; gap: 0.375rem;
      padding: 0.25rem 0.625rem; border-radius: 6px;
      font-size: 0.6875rem; font-weight: 600; text-transform: uppercase;
    }
    .status-badge .dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
    .status-badge.open { background: #FFEBEE; color: #C62828; }
    .status-badge.in_review { background: #FFF3E0; color: #F57C00; }
    .status-badge.resolved { background: #E8F5E9; color: #2E7D32; }
    .status-badge.closed { background: #F5F5F5; color: #6b7280; }
    .status-badge.rejected { background: #F3E5F5; color: #6A1B9A; }

    .error-state, .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 4rem 2rem; text-align: center;
      background: white; border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }

    .btn { padding: 0.75rem 1.25rem; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; }
    .btn-primary { background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825)); color: white; }

    .drawer-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
      z-index: 1100; display: flex; justify-content: flex-end;
    }
    .drawer {
      width: 100%; max-width: 480px; height: 100%;
      background: white; overflow-y: auto; overscroll-behavior: contain;
      box-shadow: -8px 0 24px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    .drawer-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      padding: 1.5rem; background: linear-gradient(135deg, #1f2937, #374151); color: white;
    }
    .drawer-header h2 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .close-btn {
      width: 36px; height: 36px; border: none; background: rgba(255,255,255,0.15);
      color: white; border-radius: 12px; font-size: 1.5rem; cursor: pointer;
    }
    .drawer-body { padding: 1.5rem; }
    .drawer-body section { margin-bottom: 1.5rem; }
    .drawer-body section h3 {
      font-size: 0.75rem; font-weight: 700; color: #6b7280;
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.75rem;
    }
    .drawer-body p { color: #1f2937; font-size: 0.875rem; margin-bottom: 0.5rem; }
    .drawer-body p.multiline { white-space: pre-wrap; }
    .drawer-body p.muted { color: #9ca3af; font-size: 0.75rem; }
    .drawer-body dl { display: flex; flex-direction: column; gap: 0.5rem; }
    .drawer-body dl > div { display: flex; justify-content: space-between; }
    .drawer-body dt { color: #6b7280; font-size: 0.875rem; }
    .drawer-body dd { color: #1f2937; font-weight: 600; font-size: 0.875rem; }

    .messages { display: flex; flex-direction: column; gap: 0.75rem; }
    .message {
      padding: 0.75rem 1rem; border-radius: 12px;
      background: #F5F5F5;
    }
    .message.support { background: #FFF3E0; }
    .message.repairer { background: #E3F2FD; }
    .message.client { background: #E8F5E9; }
    .msg-meta { display: flex; justify-content: space-between; margin-bottom: 0.375rem; font-size: 0.75rem; color: #6b7280; }
    .message p { font-size: 0.8125rem; margin: 0; }

    /* Admin actions in drawer */
    .admin-actions { padding-top: 1rem; border-top: 1px solid #EEEEEE; }
    .note-form { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
    .note-form label { font-size: 0.75rem; color: #6b7280; font-weight: 600; }
    .note-form textarea {
      width: 100%; padding: 0.625rem; border: 2px solid #EEEEEE; border-radius: 8px;
      font-family: inherit; font-size: 0.875rem; resize: vertical;
    }
    .btn { padding: 0.625rem 1rem; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; font-size: 0.875rem; }
    .btn-outline { background: white; border: 2px solid #EEEEEE; color: #374151; }
    .btn-outline:hover:not(:disabled) { border-color: var(--color-primary-500, #FF9800); color: var(--color-primary-500, #FF9800); }
    .btn-block { width: 100%; padding: 0.75rem; }
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
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #1f2937, #374151); color: white;
      display: flex; justify-content: space-between; align-items: center;
    }
    .modal-header h3 { font-size: 1.125rem; }
    .modal-body { padding: 1.5rem; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem; }
    .form-group input, .form-group select, .form-group textarea {
      width: 100%; padding: 0.75rem; border: 2px solid #EEEEEE;
      border-radius: 10px; font-family: inherit; font-size: 0.9375rem;
    }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
      outline: none; border-color: var(--color-primary-500, #FF9800);
    }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding: 1rem 1.5rem; background: #FAFAFA; border-top: 1px solid #EEEEEE;
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
export class DisputesAdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly disputes = signal<DisputeForAdmin[]>([]);
  readonly total = signal(0);
  readonly stats = signal<DisputesAdminStats | null>(null);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sortField = signal<SortField>('createdAt');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');
  readonly statusFilter = signal<StatusFilter>('all');
  readonly selectedDispute = signal<DisputeForAdmin | null>(null);
  readonly showResolveModal = signal(false);
  readonly processingAction = signal(false);
  readonly resolveError = signal<string | null>(null);

  searchQuery = '';
  newNote = '';
  resolveForm: {
    resolution: '' | 'refund_full' | 'refund_partial' | 'redo_repair' | 'no_action' | 'other';
    notes: string;
    refundAmount: number | null;
  } = { resolution: '', notes: '', refundAmount: null };

  readonly statusOptions = [
    { value: 'all' as StatusFilter, label: 'Tous' },
    { value: 'open' as StatusFilter, label: 'Ouverts' },
    { value: 'in_review' as StatusFilter, label: 'En revue' },
    { value: 'resolved' as StatusFilter, label: 'Résolus' },
    { value: 'closed' as StatusFilter, label: 'Clôturés' },
    { value: 'rejected' as StatusFilter, label: 'Rejetés' },
  ];

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['status']) {
          this.statusFilter.set(params['status'] as StatusFilter);
        }
        this.loadDisputes();
        this.loadStats();
      });
  }

  async loadDisputes(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const res = await this.adminService.getDisputes({
        status: this.statusFilter() === 'all' ? undefined : this.statusFilter(),
        page: this.page(),
        limit: this.pageSize(),
        search: this.searchQuery || undefined,
        sort: this.sortField(),
        order: this.sortOrder(),
      });
      this.disputes.set(res.data);
      this.total.set(res.total);
    } catch (err: any) {
      this.error.set(err?.message || 'Erreur lors du chargement');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadStats(): Promise<void> {
    try {
      const s = await this.adminService.getDisputesStats();
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
    this.loadDisputes();
  }

  onPageChange(e: DataGridPageEvent): void {
    this.page.set(e.page);
    this.pageSize.set(e.pageSize);
    this.loadDisputes();
  }

  onSortChange(e: DataGridSortEvent): void {
    this.sortField.set(SORT_FIELD_MAP[e.field] ?? 'createdAt');
    this.sortOrder.set(e.direction);
    this.page.set(1);
    this.loadDisputes();
  }

  onHeaderSearch(q: string): void {
    this.searchQuery = q;
    this.page.set(1);
    this.loadDisputes();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.page.set(1);
    this.loadDisputes();
  }

  async openDetail(dispute: DisputeForAdmin): Promise<void> {
    try {
      const full = await this.adminService.getDisputeDetail(dispute.id);
      this.selectedDispute.set(full);
    } catch (err: any) {
      this.error.set(err?.message || 'Erreur lors du chargement du détail');
    }
  }

  closeDetail(): void {
    this.selectedDispute.set(null);
    this.newNote = '';
    this.closeResolveModal();
  }

  async submitNote(disputeId: string): Promise<void> {
    if (!this.newNote.trim() || this.processingAction()) return;
    this.processingAction.set(true);
    try {
      await this.adminService.addDisputeNote(disputeId, this.newNote.trim());
      // Recharger le détail pour voir la note dans le fil
      const refreshed = await this.adminService.getDisputeDetail(disputeId);
      this.selectedDispute.set(refreshed);
      this.newNote = '';
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'Erreur publication note');
    } finally {
      this.processingAction.set(false);
    }
  }

  openResolveModal(): void {
    this.resolveForm = { resolution: '', notes: '', refundAmount: null };
    this.resolveError.set(null);
    this.showResolveModal.set(true);
  }

  closeResolveModal(): void {
    this.showResolveModal.set(false);
  }

  async submitResolve(): Promise<void> {
    const dispute = this.selectedDispute();
    if (!dispute || !this.resolveForm.resolution || this.processingAction()) return;
    this.processingAction.set(true);
    this.resolveError.set(null);
    try {
      const updated = await this.adminService.resolveDispute(dispute.id, {
        resolution: this.resolveForm.resolution,
        notes: this.resolveForm.notes || undefined,
        refundAmount: this.resolveForm.refundAmount ?? undefined,
      });
      this.selectedDispute.set(updated);
      this.closeResolveModal();
      // Refresh list + stats
      this.loadDisputes();
      this.loadStats();
    } catch (err: any) {
      this.resolveError.set(err?.error?.message || err?.message || 'Erreur lors de la résolution');
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
      open: 'Ouvert',
      in_review: 'En revue',
      resolved: 'Résolu',
      closed: 'Clôturé',
      rejected: 'Rejeté',
    };
    return map[s] ?? s;
  }

  reasonLabel(r: string): string {
    const map: Record<string, string> = {
      non_conforming_repair: 'Réparation non conforme',
      delay: 'Retard',
      price_not_respected: 'Prix non respecté',
      damage: 'Dommage',
      poor_quality: 'Qualité médiocre',
      communication: 'Communication',
      other: 'Autre',
    };
    return map[r] ?? r;
  }

  resolutionLabel(r: string): string {
    const map: Record<string, string> = {
      refund_full: 'Remboursement intégral',
      refund_partial: 'Remboursement partiel',
      redo_repair: 'Reprise réparation',
      no_action: 'Sans suite',
      other: 'Autre',
    };
    return map[r] ?? r;
  }

  senderTypeLabel(t: string): string {
    const map: Record<string, string> = {
      client: 'Client',
      repairer: 'Réparateur',
      support: 'Support RepairFone',
    };
    return map[t] ?? t;
  }
}

import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { DisputesService, Dispute, DisputeStatus } from '../../services/disputes.service';
import { DisputesStore } from '../../stores/disputes.store';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiEmptyStateComponent } from '../../../../shared/components/ui-empty-state/ui-empty-state.component';
import { UiErrorStateComponent } from '../../../../shared/components/ui-error-state/ui-error-state.component';
import { UiChipComponent } from '../../../../shared/components/ui-chip/ui-chip.component';
import {
  UiDataGridComponent,
  UiDataGridColumnComponent,
} from '../../../../shared/components/ui-data-grid';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { HeaderSearchComponent } from '../../../../shared/components/header-search/header-search.component';

@Component({
  selector: 'app-dispute-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    UiCardComponent,
    UiButtonComponent,
    UiLoadingComponent,
    UiEmptyStateComponent,
    UiErrorStateComponent,
    UiChipComponent,
    UiDataGridComponent,
    UiDataGridColumnComponent,
    FormatDatePipe,
    UiHeaderComponent,
    HeaderSearchComponent,
  ],
  template: `
    <div class="dispute-list">
      <ui-header title="Mes litiges" subtitle="Suivez vos réclamations">
        <app-header-search
          placeholder="Rechercher (motif, description, réparateur...)"
          (search)="onSearch($event)"
          (cleared)="onSearch('')"
        />
      </ui-header>

      <!-- Stats -->
      @if (store.hasDisputes()) {
        <div class="stats-grid">
          <ui-card class="stat-card open">
            <div class="stat-content">
              <span class="stat-value">{{ store.openDisputes().length }}</span>
              <span class="stat-label">En cours</span>
            </div>
          </ui-card>
          <ui-card class="stat-card resolved">
            <div class="stat-content">
              <span class="stat-value">{{ store.resolvedDisputes().length }}</span>
              <span class="stat-label">Résolus</span>
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
          [class.active]="store.filterStatus() === 'open'"
          (click)="setFilter('open')"
        >
          Ouverts
        </button>
        <button
          class="filter-btn"
          [class.active]="store.filterStatus() === 'in_review'"
          (click)="setFilter('in_review')"
        >
          En examen
        </button>
        <button
          class="filter-btn"
          [class.active]="store.filterStatus() === 'resolved'"
          (click)="setFilter('resolved')"
        >
          Résolus
        </button>
      </div>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="loading-container">
          <ui-loading size="lg" />
          <p>Chargement des litiges...</p>
        </div>
      }

      <!-- Error -->
      @if (!isLoading() && error()) {
        <ui-error-state
          [message]="error()!"
          severity="error"
          [showRetry]="true"
          (onRetry)="loadDisputes()"
        />
      }

      <!-- Empty state -->
      @if (!isLoading() && !error() && searchedDisputes().length === 0) {
        <ui-empty-state
          icon="⚖️"
          title="Aucun litige"
          [description]="store.filterStatus() ? 'Aucun litige avec ce statut' : 'Vous n\\'avez pas de litige en cours'"
        >
          <p class="empty-hint">
            Vous pouvez signaler un problème depuis le suivi de votre réparation
          </p>
        </ui-empty-state>
      }

      <!-- Disputes table -->
      @if (!isLoading() && searchedDisputes().length > 0) {
        <ui-data-grid
          [data]="searchedDisputes()"
          [pageSize]="10"
          [pageSizeOptions]="[10, 25, 50, 100]"
          [rowClickable]="true"
          emptyMessage="Aucun litige"
          (rowClick)="goToDetail($event)"
        >
          <ui-data-grid-column key="reason" header="Motif" field="reason" [sortable]="true">
            <ng-template let-row>
              <div class="cell-reason">
                <span class="reason-icon">{{ disputesService.getReasonIcon(row.reason) }}</span>
                <div class="cell-reason-text">
                  <strong>{{ disputesService.getReasonLabel(row.reason) }}</strong>
                  @if (row.request?.device) {
                    <span class="muted">{{ row.request.device.brand }} {{ row.request.device.model }}</span>
                  }
                </div>
                @if (isRecent(row)) {
                  <span class="new-badge-cell">Nouveau</span>
                }
              </div>
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="repairer" header="Réparateur">
            <ng-template let-row>
              @if (row.repairer) {
                {{ row.repairer.repairerProfile?.businessName || (row.repairer.firstName + ' ' + row.repairer.lastName) }}
              } @else {
                <span class="muted">—</span>
              }
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="description" header="Description">
            <ng-template let-row>
              <span class="description-cell">
                {{ row.description | slice:0:80 }}{{ row.description.length > 80 ? '…' : '' }}
              </span>
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="messages" header="Échanges" align="center" width="100px">
            <ng-template let-row>
              @if (row.messages.length > 0) {
                <span class="message-count-cell">💬 {{ row.messages.length }}</span>
              } @else {
                <span class="muted">—</span>
              }
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="status" header="Statut" field="status" [sortable]="true">
            <ng-template let-row>
              <ui-chip
                [label]="disputesService.getStatusLabel(row.status)"
                [color]="disputesService.getStatusColor(row.status)"
                size="sm"
              />
            </ng-template>
          </ui-data-grid-column>

          <ui-data-grid-column key="date" header="Créé le" field="createdAt" [sortable]="true" width="120px">
            <ng-template let-row>
              <span class="date">{{ row.createdAt | formatDate }}</span>
            </ng-template>
          </ui-data-grid-column>
        </ui-data-grid>
      }

      <!-- Help section -->
      <ui-card class="help-card">
        <h3>Besoin d'aide ?</h3>
        <p>Notre équipe support est disponible pour vous aider à résoudre vos litiges.</p>
        <div class="help-actions">
          <ui-button variant="outline" size="sm">
            📧 support&#64;repairfone.ci
          </ui-button>
          <ui-button variant="outline" size="sm">
            📞 +225 07 00 00 00 00
          </ui-button>
        </div>
      </ui-card>
    </div>
  `,
  styles: [`
    .dispute-list {
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

        &.open {
          border-left: 4px solid var(--color-mustard, #FFC107);
        }

        &.resolved {
          border-left: 4px solid var(--color-secondary, #4CAF50);
        }
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: #1F2937;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #6B7280;
        text-transform: uppercase;
        letter-spacing: 0.05em;
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
        border: 1px solid #e2e8f0;
        background: white;
        border-radius: 9999px;
        font-size: 0.875rem;
        color: #6B7280;
        white-space: nowrap;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: #D1D5DB;
        }

        &.active {
          background: var(--color-primary-500, #FF9800);
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

    .empty-hint {
      font-size: 0.8125rem;
      color: #9CA3AF;
      margin-top: 0.5rem;
    }

    .disputes {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .dispute-card {
      padding: 1rem;
      cursor: pointer;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
    }

    .dispute-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;

      .dispute-reason {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .reason-icon {
        font-size: 1.25rem;
      }

      .reason-label {
        font-weight: 600;
        color: #1F2937;
        font-size: 0.9375rem;
      }
    }

    .dispute-body {
      .device-info {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.8125rem;
        color: #6B7280;
        margin-bottom: 0.5rem;

        .icon {
          font-size: 0.875rem;
        }
      }

      .description {
        font-size: 0.875rem;
        color: #4B5563;
        line-height: 1.5;
        margin: 0 0 0.75rem 0;
      }

      .repairer-info {
        display: flex;
        gap: 0.5rem;
        font-size: 0.8125rem;

        .label {
          color: #6B7280;
        }

        .value {
          color: #1F2937;
          font-weight: 500;
        }
      }
    }

    .dispute-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
      margin-top: 0.75rem;

      .footer-left {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .date {
        font-size: 0.75rem;
        color: #9CA3AF;
      }

      .message-count {
        font-size: 0.75rem;
        color: #6B7280;
      }

      .arrow {
        color: #9CA3AF;
      }
    }

    .new-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      background: var(--color-error, #F44336);
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.125rem 0.375rem;
      border-radius: 9999px;
      text-transform: uppercase;
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

    .help-card {
      margin-top: 2rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #1F2937;
        margin: 0 0 0.5rem 0;
      }

      p {
        font-size: 0.875rem;
        color: #6B7280;
        margin: 0 0 1rem 0;
      }

      .help-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
    }

    /* Cellules <ui-data-grid> */
    .cell-reason {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      min-width: 0;
    }

    .cell-reason .reason-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .cell-reason-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .cell-reason-text strong {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }

    .cell-reason-text .muted {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .new-badge-cell {
      background: linear-gradient(135deg, var(--color-error, #F44336), #EF5350);
      color: white;
      font-size: 0.625rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }

    .description-cell {
      color: #4b5563;
      font-size: 0.8125rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .message-count-cell {
      font-size: 0.8125rem;
      color: #6b7280;
      font-variant-numeric: tabular-nums;
    }

    .muted { color: #9ca3af; }

    .date {
      color: #6b7280;
      font-size: 0.8125rem;
      font-variant-numeric: tabular-nums;
    }
  `]
})
export class DisputeListComponent implements OnInit {
  readonly disputesService = inject(DisputesService);
  readonly store = inject(DisputesStore);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchQuery = signal('');

  /** Filtre local sur la liste déjà filtrée par statut. */
  readonly searchedDisputes = computed(() => {
    const list = this.store.filteredDisputes();
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return list;
    return list.filter((d) => {
      const pieces: string[] = [
        this.disputesService.getReasonLabel(d.reason),
        d.description ?? '',
        d.repairer
          ? d.repairer.repairerProfile?.businessName ??
            `${d.repairer.firstName} ${d.repairer.lastName}`
          : '',
        d.request?.device?.brand ?? '',
        d.request?.device?.model ?? '',
      ];
      return pieces.some((s) => s.toLowerCase().includes(q));
    });
  });

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  ngOnInit(): void {
    this.loadDisputes();
  }

  async loadDisputes(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.disputesService.getMyDisputes({
        status: this.store.filterStatus() ?? undefined,
        page: 1,
        limit: environment.api.maxLimit,
      });
      this.store.setDisputes(result.data, result.total);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement des litiges');
    } finally {
      this.isLoading.set(false);
    }
  }

  setFilter(status: DisputeStatus | null): void {
    this.store.setFilterStatus(status);
    this.loadDisputes();
  }

  goToDetail(dispute: Dispute): void {
    this.router.navigate(['/disputes', dispute.id]);
  }

  isRecent(dispute: Dispute): boolean {
    const createdDate = new Date(dispute.createdAt);
    const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceCreated <= 1 && dispute.status === 'open';
  }
}

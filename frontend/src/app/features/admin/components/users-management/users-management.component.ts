import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, UserForAdmin } from '../../services/admin.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { HeaderSearchComponent } from '../../../../shared/components/header-search/header-search.component';
import {
  UiDataGridComponent,
  UiDataGridColumnComponent,
  DataGridPageEvent,
  DataGridSortEvent,
} from '../../../../shared/components/ui-data-grid';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';
import { StatusLabelsService, UserStatus } from '../../../../shared/services/status-labels.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type RoleFilter = 'all' | 'client' | 'repairer';
type StatusFilter = 'all' | 'pending' | 'active' | 'suspended' | 'deactivated';
type UsersSortField = 'createdAt' | 'firstName' | 'role' | 'status';

const SORT_FIELD_MAP: Record<string, UsersSortField> = {
  user: 'firstName',
  firstName: 'firstName',
  role: 'role',
  status: 'status',
  createdAt: 'createdAt',
};

@Component({
  selector: 'app-users-management',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    UiHeaderComponent,
    HeaderSearchComponent,
    UiDataGridComponent,
    UiDataGridColumnComponent,
    InitialsPipe,
  ],
  template: `
    <div class="admin-page">
      <!-- Header Banner avec search projetée -->
      <ui-header
        title="Gestion des utilisateurs"
        [subtitle]="total() + ' utilisateur(s) au total'"
        [showBack]="true"
        [showProfile]="true"
        backRoute="/admin"
      >
        <app-header-search
          placeholder="Rechercher un utilisateur..."
          (search)="onHeaderSearch($event)"
          (cleared)="clearSearch()"
        />
      </ui-header>

      <div class="admin-container">

        <!-- Filters -->
        <div class="filters-section">
          <div class="filter-group">
            <label>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
              Role
            </label>
            <div class="filter-buttons">
              <button
                class="filter-btn"
                [class.active]="roleFilter() === 'all'"
                (click)="setRoleFilter('all')"
              >
                Tous
              </button>
              <button
                class="filter-btn client"
                [class.active]="roleFilter() === 'client'"
                (click)="setRoleFilter('client')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Clients
              </button>
              <button
                class="filter-btn repairer"
                [class.active]="roleFilter() === 'repairer'"
                (click)="setRoleFilter('repairer')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2"/>
                </svg>
                Réparateurs
              </button>
            </div>
          </div>

          <div class="filter-group">
            <label>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2"/>
              </svg>
              Statut
            </label>
            <div class="filter-buttons">
              <button
                class="filter-btn"
                [class.active]="statusFilter() === 'all'"
                (click)="setStatusFilter('all')"
              >
                Tous
              </button>
              <button
                class="filter-btn active-status"
                [class.active]="statusFilter() === 'active'"
                (click)="setStatusFilter('active')"
              >
                <span class="status-dot active"></span>
                Actifs
              </button>
              <button
                class="filter-btn suspended-status"
                [class.active]="statusFilter() === 'suspended'"
                (click)="setStatusFilter('suspended')"
              >
                <span class="status-dot suspended"></span>
                Suspendus
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des utilisateurs...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <div class="error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <p>{{ error() }}</p>
            <button class="btn btn-primary" (click)="loadUsers()">Réessayer</button>
          </div>
        } @else if (users().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3>Aucun utilisateur</h3>
            <p>Aucun utilisateur ne correspond aux filtres selectionnes</p>
          </div>
        } @else {
          <ui-data-grid
            [data]="users()"
            [serverSide]="true"
            [total]="total()"
            [loading]="isLoading()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[10, 25, 50, 100]"
            (pageChange)="onPageChange($event)"
            (sortChange)="onSortChange($event)"
            emptyMessage="Aucun utilisateur"
          >
            <ui-data-grid-column key="user" header="Utilisateur" field="firstName" [sortable]="true">
              <ng-template let-row>
                <div class="cell-user">
                  <div class="avatar" [class]="row.role">
                    @if (row.avatarUrl) {
                      <img [src]="row.avatarUrl" [alt]="getUserName(row)" />
                    } @else {
                      <span>{{ row.firstName | initials : row.lastName }}</span>
                    }
                    <span class="status-indicator" [class]="row.status"></span>
                  </div>
                  <div class="cell-user-text">
                    <strong>{{ getUserName(row) }}</strong>
                    @if (row.repairerProfile?.businessName) {
                      <span class="muted-business">{{ row.repairerProfile?.businessName }}</span>
                    }
                  </div>
                </div>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="contact" header="Contact" field="phone">
              <ng-template let-row>
                <div class="cell-contact">
                  <span class="phone">{{ row.phone }}</span>
                  @if (row.email) {
                    <span class="email">{{ row.email }}</span>
                  }
                </div>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="role" header="Rôle" field="role" [sortable]="true">
              <ng-template let-row>
                <span class="role-badge" [class]="row.role">{{ getRoleLabel(row.role) }}</span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="status" header="Statut" field="status" [sortable]="true">
              <ng-template let-row>
                <span class="status-badge" [class]="row.status">
                  <span class="badge-dot"></span>
                  {{ statusLabels.getUserStatusLabel(row.status) }}
                </span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="createdAt" header="Inscription" field="createdAt" [sortable]="true">
              <ng-template let-row>
                <span class="date">{{ row.createdAt | date:'dd/MM/yy' }}</span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="actions" header="Actions" align="right" width="180px">
              <ng-template let-row>
                <div class="action-buttons-inline">
                  @if (row.status === 'suspended' || row.status === 'deactivated') {
                    <button
                      class="icon-btn success"
                      (click)="activateUser(row.id); $event.stopPropagation()"
                      [disabled]="isProcessing()"
                      title="Activer"
                      aria-label="Activer"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                  } @else {
                    <button
                      class="icon-btn warning"
                      (click)="openSuspendModal(row); $event.stopPropagation()"
                      [disabled]="isProcessing()"
                      title="Suspendre"
                      aria-label="Suspendre"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M4.93 4.93L19.07 19.07" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </button>
                  }
                  @if (row.role === 'repairer' && row.repairerProfile) {
                    <a
                      [routerLink]="['/admin/repairers']"
                      [queryParams]="{search: row.phone}"
                      class="icon-btn neutral"
                      title="Voir profil réparateur"
                      aria-label="Voir profil réparateur"
                      (click)="$event.stopPropagation()"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                      </svg>
                    </a>
                  }
                </div>
              </ng-template>
            </ui-data-grid-column>
          </ui-data-grid>
        }
      </div>

      <!-- Suspend Modal -->
      @if (showSuspendModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header warning">
              <div class="modal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M4.93 4.93L19.07 19.07" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <h3>Suspendre le compte</h3>
              <button class="close-btn" (click)="closeModal()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="user-preview">
                <div class="preview-avatar" [class]="selectedUser()?.role">
                  {{ selectedUser()?.firstName | initials : selectedUser()?.lastName }}
                </div>
                <div class="preview-info">
                  <strong>{{ getUserName(selectedUser()!) }}</strong>
                  <span>{{ selectedUser()?.phone }}</span>
                </div>
              </div>
              <div class="form-group">
                <label for="reason">Raison de la suspension (optionnel)</label>
                <textarea
                  id="reason"
                  [(ngModel)]="suspendReason"
                  placeholder="Indiquez la raison de la suspension..."
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="closeModal()">Annuler</button>
              <button
                class="btn btn-warning"
                (click)="confirmSuspend()"
                [disabled]="isProcessing()"
              >
                @if (isProcessing()) {
                  <span class="spinner-small"></span>
                }
                Suspendre
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      min-height: 100vh;
      background: #FAFAFA;
    }

    /* Container — pleine largeur (cohérent avec /admin/repairers) */
    .admin-container {
      padding: 1rem;
      padding-top: 180px;
      padding-bottom: 100px;
    }

    /* Filters */
    .filters-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1.25rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    @media (min-width: 640px) {
      .filters-section {
        flex-direction: row;
        align-items: flex-start;
      }
    }

    .filter-group {
      flex: 1;
    }

    .filter-group label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.625rem;
    }

    .filter-group label svg {
      color: var(--color-primary-500, #FF9800);
    }

    .filter-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .filter-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
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

    .filter-btn:hover {
      border-color: #D1D5DB;
      background: #FAFAFA;
    }

    .filter-btn.active {
      background: linear-gradient(135deg, #1f2937, #374151);
      border-color: #1f2937;
      color: white;
    }

    .filter-btn.client.active {
      background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3));
      border-color: var(--color-ocean, #1565C0);
    }

    .filter-btn.repairer.active {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      border-color: var(--color-primary-500, #FF9800);
    }

    .filter-btn.active-status.active {
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-secondary-light, #81C784));
      border-color: var(--color-secondary, #4CAF50);
    }

    .filter-btn.suspended-status.active {
      background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00));
      border-color: var(--color-mustard, #FFC107);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-dot.active {
      background: var(--color-secondary, #4CAF50);
    }

    .status-dot.suspended {
      background: var(--color-mustard, #FFC107);
    }

    .filter-btn.active .status-dot {
      background: white;
    }

    /* Loading/Error/Empty States */
    .loading-state, .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #FFE5D9;
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-icon, .empty-icon {
      color: var(--color-primary-500, #FF9800);
      margin-bottom: 1rem;
      opacity: 0.8;
    }

    .empty-icon {
      color: #D1D5DB;
    }

    .error-state p, .empty-state p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    /* Users List */
    .users-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .user-card {
      background: white;
      border-radius: 20px;
      padding: 1.25rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
    }

    .user-card:hover {
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    }

    .user-main {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .avatar {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 1.25rem;
      flex-shrink: 0;
      overflow: hidden;
      position: relative;
    }

    .avatar.client {
      background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3));
    }

    .avatar.repairer {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
    }

    .avatar.admin {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
    }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .status-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 3px solid white;
    }

    .status-indicator.pending { background: var(--color-mustard, #FFC107); }
    .status-indicator.active { background: var(--color-secondary, #4CAF50); }
    .status-indicator.suspended { background: var(--color-error, #F44336); }
    .status-indicator.deactivated { background: #6b7280; }

    .user-info {
      flex: 1;
      min-width: 0;
    }

    .user-info h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.375rem;
    }

    .user-contact, .user-email {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.25rem;
    }

    .user-contact svg, .user-email svg {
      color: #9ca3af;
    }

    .user-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.625rem;
    }

    .role-badge, .status-badge, .business-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .role-badge.client { background: #E3F2FD; color: var(--color-primary-900, #E65100); }
    .role-badge.repairer { background: #FFF3E0; color: var(--color-primary-900, #E65100); }
    .role-badge.admin { background: #FFF3E0; color: var(--color-primary-500, #FF9800); }

    .status-badge.pending { background: #FFF8E1; color: #F57C00; }
    .status-badge.active { background: #E8F5E9; color: #2E7D32; }
    .status-badge.suspended { background: #FFEBEE; color: var(--color-terracotta, #C62828); }
    .status-badge.deactivated { background: #F5F5F5; color: #4b5563; }

    .business-badge {
      background: #F5F5F5;
      color: #374151;
    }

    .user-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      padding: 1rem 0;
      border-top: 1px solid #F5F5F5;
      border-bottom: 1px solid #F5F5F5;
      margin-bottom: 1rem;
    }

    @media (max-width: 640px) {
      .user-details {
        grid-template-columns: 1fr;
      }
    }

    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
    }

    .detail-icon {
      width: 32px;
      height: 32px;
      border-radius: 12px;
      background: #FAFAFA;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary-500, #FF9800);
      flex-shrink: 0;
    }

    .detail-content {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .detail-label {
      font-size: 0.6875rem;
      font-weight: 500;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .detail-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1f2937;
    }

    .verification-badges {
      display: flex;
      gap: 0.375rem;
    }

    .verified-badge {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.125rem 0.5rem;
      background: linear-gradient(135deg, var(--color-secondary-50, #E8F5E9), var(--color-secondary-100, #C8E6C9));
      color: #2E7D32;
      border-radius: 4px;
      font-size: 0.625rem;
      font-weight: 600;
    }

    .not-verified {
      font-size: 0.75rem;
      color: #9ca3af;
      font-style: italic;
    }

    .user-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    /* Buttons */
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9375rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      box-shadow: 0 4px 14px rgba(255, 152, 0, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
    }

    .btn-success {
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-secondary-light, #81C784));
      color: white;
      box-shadow: 0 4px 14px rgba(76, 175, 80, 0.3);
    }

    .btn-success:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    }

    .btn-warning {
      background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00));
      color: white;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
    }

    .btn-warning:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    }

    .btn-outline {
      background: white;
      border: 2px solid #EEEEEE;
      color: #374151;
    }

    .btn-outline:hover:not(:disabled) {
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
      padding: 1rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .pagination-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      background: white;
      color: #374151;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
    }

    .pagination-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-indicator {
      padding: 0.5rem 1rem;
    }

    .current-page {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      font-weight: 700;
      border-radius: 12px;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 24px;
      width: 100%;
      max-width: 420px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: modalSlideIn 0.3s ease;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #374151, #1f2937);
      color: white;
    }

    .modal-header.warning {
      background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00));
    }

    .modal-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-header h3 {
      flex: 1;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .modal-body {
      padding: 1.5rem;
    }

    .user-preview {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #FAFAFA;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .preview-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
    }

    .preview-avatar.repairer {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
    }

    .preview-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .preview-info strong {
      font-size: 1rem;
      color: #1f2937;
    }

    .preview-info span {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .form-group {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-group textarea {
      width: 100%;
      padding: 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      resize: none;
      font-family: inherit;
      font-size: 0.9375rem;
      transition: all 0.2s;
    }

    .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem;
      border-top: 1px solid #F5F5F5;
      background: #FAFAFA;
    }

    .spinner-small {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* ============================================
       Cellules custom <ui-data-grid>
       ============================================ */
    .cell-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }

    .cell-user .avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 0.8125rem;
      font-weight: 700;
    }

    .cell-user .status-indicator {
      width: 10px;
      height: 10px;
      border-width: 2px;
    }

    .cell-user-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .cell-user-text strong {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cell-user-text .muted-business {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .cell-contact {
      display: flex;
      flex-direction: column;
    }

    .cell-contact .phone {
      font-variant-numeric: tabular-nums;
      color: #1f2937;
      font-size: 0.875rem;
    }

    .cell-contact .email {
      font-size: 0.75rem;
      color: #9ca3af;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 220px;
    }

    .date {
      color: #6b7280;
      font-size: 0.8125rem;
      font-variant-numeric: tabular-nums;
    }

    /* Status-badge dot inside DataGrid */
    .cell-user + td .status-badge .badge-dot,
    .status-badge .badge-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
      margin-right: 0.25rem;
    }

    /* Boutons d'action inline */
    .action-buttons-inline {
      display: inline-flex;
      gap: 0.25rem;
      justify-content: flex-end;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .icon-btn:hover:not(:disabled) {
      background: #F5F5F5;
    }

    .icon-btn:focus-visible {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: 1px;
    }

    .icon-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon-btn.success { color: var(--color-secondary, #4CAF50); }
    .icon-btn.success:hover:not(:disabled) { background: #E8F5E9; }

    .icon-btn.warning { color: var(--color-warning-dark, #F57C00); }
    .icon-btn.warning:hover:not(:disabled) { background: #FFF3E0; }

    .icon-btn.neutral { color: #6b7280; }
    .icon-btn.neutral:hover:not(:disabled) { background: #F5F5F5; color: var(--color-primary-500, #FF9800); }
  `],
})
export class UsersManagementComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly statusLabels = inject(StatusLabelsService);

  readonly isLoading = signal(true);
  readonly isProcessing = signal(false);
  readonly error = signal<string | null>(null);
  readonly users = signal<UserForAdmin[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly sortField = signal<UsersSortField>('createdAt');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');
  readonly roleFilter = signal<RoleFilter>('all');
  readonly statusFilter = signal<StatusFilter>('all');

  // Modal
  readonly showSuspendModal = signal(false);
  readonly selectedUser = signal<UserForAdmin | null>(null);

  searchQuery = '';
  suspendReason = '';

  private searchTimeout: any;

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['role']) {
          this.roleFilter.set(params['role'] as RoleFilter);
        }
        if (params['status']) {
          this.statusFilter.set(params['status'] as StatusFilter);
        }
        this.loadUsers();
      });
  }

  async loadUsers(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.adminService.getUsers({
        role: this.roleFilter() === 'all' ? undefined : this.roleFilter(),
        status: this.statusFilter() === 'all' ? undefined : this.statusFilter(),
        page: this.page(),
        limit: this.pageSize(),
        search: this.searchQuery || undefined,
        sort: this.sortField(),
        order: this.sortOrder(),
      });
      this.users.set(result.data);
      this.total.set(result.total);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement');
    } finally {
      this.isLoading.set(false);
    }
  }

  onPageChange(event: DataGridPageEvent): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }

  onSortChange(event: DataGridSortEvent): void {
    const mapped = SORT_FIELD_MAP[event.field] ?? 'createdAt';
    this.sortField.set(mapped);
    this.sortOrder.set(event.direction);
    this.page.set(1);
    this.loadUsers();
  }

  setRoleFilter(role: RoleFilter): void {
    this.roleFilter.set(role);
    this.page.set(1);
    this.updateQueryParams();
    this.loadUsers();
  }

  setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.updateQueryParams();
    this.loadUsers();
  }

  private updateQueryParams(): void {
    this.router.navigate([], {
      queryParams: {
        role: this.roleFilter() === 'all' ? null : this.roleFilter(),
        status: this.statusFilter() === 'all' ? null : this.statusFilter(),
      },
      queryParamsHandling: 'merge',
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadUsers();
    }, 300);
  }

  onHeaderSearch(query: string): void {
    this.searchQuery = query;
    this.page.set(1);
    this.loadUsers();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.page.set(1);
    this.loadUsers();
  }

  getUserName(user: UserForAdmin | null): string {
    if (!user) return 'Utilisateur';
    if (user.firstName || user.lastName) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    return 'Utilisateur';
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      client: 'Client',
      repairer: 'Reparateur',
      admin: 'Admin',
    };
    return labels[role] || role;
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadUsers();
    }
  }

  nextPage(): void {
    this.page.update((p) => p + 1);
    this.loadUsers();
  }

  async activateUser(id: string): Promise<void> {
    this.isProcessing.set(true);
    try {
      await this.adminService.activateUser(id);
      await this.loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      this.isProcessing.set(false);
    }
  }

  openSuspendModal(user: UserForAdmin): void {
    this.selectedUser.set(user);
    this.suspendReason = '';
    this.showSuspendModal.set(true);
  }

  closeModal(): void {
    this.showSuspendModal.set(false);
    this.selectedUser.set(null);
  }

  async confirmSuspend(): Promise<void> {
    const user = this.selectedUser();
    if (!user) return;

    this.isProcessing.set(true);
    try {
      await this.adminService.deactivateUser(user.id, this.suspendReason || undefined);
      this.closeModal();
      await this.loadUsers();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      this.isProcessing.set(false);
    }
  }
}

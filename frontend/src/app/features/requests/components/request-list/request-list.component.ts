import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RequestsService, RepairRequest, RequestStatus, RequestStats } from '../../services/requests.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-request-list',
  standalone: true,
  imports: [CommonModule, RouterLink, UiHeaderComponent],
  template: `
    <div class="requests-container">
      <!-- Header avec gradient orange -->
      <ui-header
        [title]="isRepairer() ? 'Demandes reçues' : 'Mes demandes'"
        [subtitle]="isRepairer() ? 'Gérez vos réparations' : 'Suivez vos réparations'"
        [showIcon]="true"
      >
        <svg header-icon width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
        @if (!isRepairer()) {
          <a header-actions routerLink="/search" class="btn-new-request">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </a>
        }
      </ui-header>

      <!-- Stats -->
      @if (stats()) {
        <div class="stats-section">
          <div class="stats-grid">
            <div class="stat-card" (click)="filterByStatus(null)" [class.active]="!activeFilter()">
              <div class="stat-icon stat-icon-all">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
              </div>
              <span class="stat-value">{{ stats()?.total }}</span>
              <span class="stat-label">Total</span>
            </div>
            <div class="stat-card stat-pending" (click)="filterByStatus('pending')" [class.active]="activeFilter() === 'pending'">
              <div class="stat-icon stat-icon-pending">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <span class="stat-value">{{ stats()?.pending }}</span>
              <span class="stat-label">En analyse</span>
            </div>
            <div class="stat-card stat-accepted" (click)="filterByStatus('accepted')" [class.active]="activeFilter() === 'accepted'">
              <div class="stat-icon stat-icon-accepted">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <span class="stat-value">{{ stats()?.accepted }}</span>
              <span class="stat-label">Acceptées</span>
            </div>
            <div class="stat-card stat-rejected" (click)="filterByStatus('rejected')" [class.active]="activeFilter() === 'rejected'">
              <div class="stat-icon stat-icon-rejected">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <span class="stat-value">{{ stats()?.rejected }}</span>
              <span class="stat-label">Rejetées</span>
            </div>
            <div class="stat-card stat-completed" (click)="filterByStatus('completed')" [class.active]="activeFilter() === 'completed'">
              <div class="stat-icon stat-icon-completed">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
              </div>
              <span class="stat-value">{{ stats()?.completed }}</span>
              <span class="stat-label">Terminées</span>
            </div>
            <div class="stat-card stat-delivered" (click)="filterByStatus('delivered')" [class.active]="activeFilter() === 'delivered'">
              <div class="stat-icon stat-icon-delivered">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <span class="stat-value">{{ stats()?.delivered }}</span>
              <span class="stat-label">Livrées</span>
            </div>
          </div>
        </div>
      }

      <!-- Request List -->
      <div class="requests-content">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des demandes...</p>
          </div>
        } @else if (requests().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <h3>Aucune demande</h3>
            @if (isRepairer()) {
              <p>Vous n'avez pas encore reçu de demande de réparation</p>
            } @else {
              <p>Vous n'avez pas encore de demande de réparation</p>
              <a routerLink="/search" class="btn btn-primary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                Rechercher un réparateur
              </a>
            }
          </div>
        } @else {
          <div class="request-list">
            @for (request of requests(); track request.id) {
              <a [routerLink]="['/requests', request.id]" class="request-card">
                <div class="request-status-badge" [class]="'status-' + request.status">
                  {{ requestsService.getStatusLabel(request.status) }}
                </div>

                <div class="request-main">
                  <div class="request-device-info">
                    <div class="device-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                        <line x1="12" y1="18" x2="12.01" y2="18"/>
                      </svg>
                    </div>
                    <div class="device-details">
                      <h3 class="request-device">
                        {{ request.device?.brand }} {{ request.device?.model }}
                      </h3>
                      <p class="request-service">{{ request.serviceType?.name }}</p>
                    </div>
                  </div>

                  <div class="request-person">
                    @if (isClient()) {
                      <div class="person-avatar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      </div>
                      <span>{{ request.repairer?.repairerProfile?.businessName ||
                        (request.repairer?.firstName + ' ' + request.repairer?.lastName) }}</span>
                    } @else {
                      <div class="person-avatar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                      <span>{{ request.client?.firstName }} {{ request.client?.lastName }}</span>
                    }
                  </div>

                  <div class="request-footer">
                    <div class="request-date">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {{ formatDate(request.createdAt) }}
                    </div>
                    @if (request.estimatedPrice) {
                      <div class="request-price">
                        {{ request.estimatedPrice | number }} FCFA
                      </div>
                    }
                  </div>
                </div>

                <div class="request-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .requests-container {
      min-height: 100vh;
      background: #f8fafc;
      padding-bottom: 2rem;
    }

    .btn-new-request {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      color: white;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-new-request:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    /* Stats Section */
    .stats-section {
      padding: 0 1rem;
      padding-top: 100px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      background: white;
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(6, 1fr);
      }
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem;
      border-radius: 12px;
      background: #f8fafc;
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .stat-card:hover {
      background: #f1f5f9;
      transform: translateY(-2px);
    }

    .stat-card.active {
      background: #fff7ed;
      border-color: #FF6B35;
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .stat-icon-all {
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      color: white;
    }

    .stat-icon-pending {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      color: white;
    }

    .stat-icon-accepted {
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white;
    }

    .stat-icon-rejected {
      background: linear-gradient(135deg, #ef4444, #f87171);
      color: white;
    }

    .stat-icon-completed {
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
      color: white;
    }

    .stat-icon-delivered {
      background: linear-gradient(135deg, #06b6d4, #22d3ee);
      color: white;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #64748b;
      margin-top: 0.25rem;
    }

    /* Content */
    .requests-content {
      padding: 1rem;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 4rem 1rem;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f1f5f9;
      border-top-color: #FF6B35;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      color: #64748b;
      font-size: 0.9375rem;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .empty-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: #FF6B35;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #64748b;
      margin-bottom: 1.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(255, 107, 53, 0.4);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
    }

    /* Request List */
    .request-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .request-card {
      display: flex;
      align-items: stretch;
      background: white;
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      text-decoration: none;
      color: inherit;
      transition: all 0.2s;
      border: 1px solid transparent;
    }

    .request-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
      border-color: #FF6B35;
    }

    .request-status-badge {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      transform: rotate(180deg);
      padding: 0.75rem 0.5rem;
      border-radius: 8px;
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-right: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .status-pending {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e;
    }

    .status-accepted {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #065f46;
    }

    .status-rejected {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: #991b1b;
    }

    .status-in_progress {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      color: #1e40af;
    }

    .status-completed {
      background: linear-gradient(135deg, #ede9fe, #ddd6fe);
      color: #5b21b6;
    }

    .status-delivered {
      background: linear-gradient(135deg, #cffafe, #a5f3fc);
      color: #0e7490;
    }

    .status-cancelled {
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      color: #475569;
    }

    .request-main {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .request-device-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .device-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .device-details {
      min-width: 0;
    }

    .request-device {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.125rem 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .request-service {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .request-person {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #475569;
      padding: 0.5rem 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
    }

    .person-avatar {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
    }

    .request-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .request-date {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .request-price {
      font-weight: 700;
      color: #FF6B35;
      font-size: 0.9375rem;
      padding: 0.25rem 0.625rem;
      background: #fff7ed;
      border-radius: 6px;
    }

    .request-arrow {
      display: flex;
      align-items: center;
      color: #cbd5e1;
      padding-left: 0.75rem;
      margin-left: 0.5rem;
      border-left: 1px solid #f1f5f9;
      transition: all 0.2s;
    }

    .request-card:hover .request-arrow {
      color: #FF6B35;
      transform: translateX(4px);
    }
  `],
})
export class RequestListComponent implements OnInit {
  readonly requestsService = inject(RequestsService);
  private readonly authStore = inject(AuthStore);

  readonly requests = signal<RepairRequest[]>([]);
  readonly stats = signal<RequestStats | null>(null);
  readonly isLoading = signal(true);
  readonly activeFilter = signal<RequestStatus | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const [requestsResult, statsResult] = await Promise.all([
        this.requestsService.getMyRequests({ status: this.activeFilter() || undefined }),
        this.requestsService.getStats(),
      ]);

      this.requests.set(requestsResult.data);
      this.stats.set(statsResult);
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  filterByStatus(status: RequestStatus | null): void {
    this.activeFilter.set(status);
    this.loadData();
  }

  isClient(): boolean {
    return this.authStore.user()?.role === 'client';
  }

  isRepairer(): boolean {
    return this.authStore.user()?.role === 'repairer';
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

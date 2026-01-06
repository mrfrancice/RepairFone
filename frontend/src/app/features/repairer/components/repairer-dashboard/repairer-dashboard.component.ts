import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RepairerService, RepairerStats, RepairerRequest } from '../../services/repairer.service';
import { RepairerStore } from '../../stores/repairer.store';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiChipComponent } from '../../../../shared/components/ui-chip/ui-chip.component';
import { UiPriceDisplayComponent } from '../../../../shared/components/ui-price-display/ui-price-display.component';

@Component({
  selector: 'app-repairer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    UiCardComponent,
    UiButtonComponent,
    UiLoadingComponent,
    UiChipComponent,
    UiPriceDisplayComponent,
  ],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <header class="header">
        <div class="header-content">
          <div class="greeting">
            <h1>Bonjour{{ store.profile()?.businessName ? ', ' + store.profile()?.businessName : '' }} !</h1>
            <p class="date">{{ todayDate }}</p>
          </div>
          <button class="notification-btn" routerLink="/repairer/notifications">
            🔔
            @if (notificationCount() > 0) {
              <span class="badge">{{ notificationCount() }}</span>
            }
          </button>
        </div>

        <!-- Verification Status -->
        @if (store.profile() && !store.isVerified()) {
          <div class="verification-banner" [class.pending]="store.profile()?.verificationStatus === 'pending'">
            @if (store.profile()?.verificationStatus === 'pending') {
              <span class="icon">⏳</span>
              <span>Vérification en cours...</span>
            } @else {
              <span class="icon">⚠️</span>
              <span>Complétez votre profil pour être vérifié</span>
              <button routerLink="/repairer/profile/setup">Compléter →</button>
            }
          </div>
        }
      </header>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="loading-container">
          <ui-loading size="lg" />
          <p>Chargement...</p>
        </div>
      }

      @if (!isLoading()) {
        <!-- Stats Cards -->
        <section class="stats-section">
          <div class="stats-grid">
            <ui-card class="stat-card primary" routerLink="/repairer/requests" [queryParams]="{filter: 'new'}">
              <div class="stat-icon">📥</div>
              <div class="stat-content">
                <span class="stat-value">{{ store.stats()?.pendingRequests || 0 }}</span>
                <span class="stat-label">Nouvelles demandes</span>
              </div>
            </ui-card>

            <ui-card class="stat-card" routerLink="/repairer/requests" [queryParams]="{filter: 'in_progress'}">
              <div class="stat-icon">🔧</div>
              <div class="stat-content">
                <span class="stat-value">{{ store.stats()?.inProgressRequests || 0 }}</span>
                <span class="stat-label">En cours</span>
              </div>
            </ui-card>

            <ui-card class="stat-card revenue">
              <div class="stat-icon">💰</div>
              <div class="stat-content">
                <ui-price-display [amount]="store.monthlyRevenue()" size="md" />
                <span class="stat-label">Revenus</span>
              </div>
            </ui-card>

            <ui-card class="stat-card rating">
              <div class="stat-icon">⭐</div>
              <div class="stat-content">
                <span class="stat-value">{{ (store.stats()?.averageRating || 0).toFixed(1) }}</span>
                <span class="stat-label">Note moyenne</span>
              </div>
            </ui-card>

            <ui-card class="stat-card quality">
              <div class="stat-icon">📊</div>
              <div class="stat-content">
                <span class="stat-value">{{ store.qualityScore() }}%</span>
                <span class="stat-label">Score qualité</span>
              </div>
            </ui-card>
          </div>
        </section>

        <!-- Quality Score -->
        <section class="quality-section">
          <ui-card class="quality-card">
            <div class="quality-header">
              <h3>Score Qualité</h3>
              <span class="quality-badge" [style.background]="repairerService.getQualityScoreColor(store.qualityScore())">
                {{ repairerService.getQualityScoreLabel(store.qualityScore()) }}
              </span>
            </div>

            <div class="quality-score">
              <div class="score-circle" [style.--score]="store.qualityScore()">
                <span class="score-value">{{ store.qualityScore() }}</span>
                <span class="score-max">/100</span>
              </div>
            </div>

            <div class="quality-metrics">
              <div class="metric">
                <span class="metric-label">Taux de réponse</span>
                <span class="metric-value">{{ store.stats()?.responseRate || 0 }}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Taux de complétion</span>
                <span class="metric-value">{{ store.stats()?.completionRate || 0 }}%</span>
              </div>
              <div class="metric">
                <span class="metric-label">Temps de réponse</span>
                <span class="metric-value">{{ store.stats()?.averageResponseTime || 0 }}h</span>
              </div>
            </div>
          </ui-card>
        </section>

        <!-- New Requests -->
        <section class="requests-section">
          <div class="section-header">
            <h2>Nouvelles demandes</h2>
            <a routerLink="/repairer/requests" class="view-all">Voir tout →</a>
          </div>

          @if (store.pendingRequests().length === 0) {
            <ui-card class="empty-card">
              <span class="empty-icon">📭</span>
              <p>Aucune nouvelle demande</p>
            </ui-card>
          } @else {
            <div class="requests-list">
              @for (request of store.pendingRequests().slice(0, 3); track request.id) {
                <ui-card class="request-card" [routerLink]="['/repairer/requests', request.id]">
                  <div class="request-header">
                    <div class="device-info">
                      <span class="device-icon">📱</span>
                      <div class="device-details">
                        <span class="device-name">
                          {{ request.device?.brand || '' }} {{ request.device?.model || '' }}
                        </span>
                        <span class="service-type">{{ request.serviceType?.name || 'Service' }}</span>
                      </div>
                    </div>
                    @if (request.urgency === 'express') {
                      <ui-chip label="Express" color="danger" size="sm" />
                    }
                  </div>

                  <div class="request-body">
                    <p class="problem">{{ request.problemDescription | slice:0:80 }}...</p>
                    <div class="request-meta">
                      @if (request.distance) {
                        <span class="distance">📍 {{ request.distance.toFixed(1) }} km</span>
                      }
                      <span class="time">{{ getTimeAgo(request.createdAt) }}</span>
                    </div>
                  </div>

                  <div class="request-actions">
                    <ui-button variant="outline" size="sm" (onClick)="$event.stopPropagation()">
                      Refuser
                    </ui-button>
                    <ui-button variant="primary" size="sm" (onClick)="$event.stopPropagation()">
                      Accepter
                    </ui-button>
                  </div>
                </ui-card>
              }
            </div>
          }
        </section>

        <!-- Quick Actions -->
        <section class="actions-section">
          <h2>Actions rapides</h2>
          <div class="actions-grid">
            <ui-card class="action-card" routerLink="/repairer/requests">
              <span class="action-icon">📋</span>
              <span class="action-label">Demandes</span>
            </ui-card>
            <ui-card class="action-card" routerLink="/repairer/quotes">
              <span class="action-icon">📝</span>
              <span class="action-label">Devis</span>
            </ui-card>
            <ui-card class="action-card" routerLink="/repairer/payments">
              <span class="action-icon">💳</span>
              <span class="action-label">Paiements</span>
            </ui-card>
            <ui-card class="action-card" routerLink="/repairer/profile">
              <span class="action-icon">👤</span>
              <span class="action-label">Profil</span>
            </ui-card>
          </div>
        </section>

        <!-- Badges -->
        @if (store.profile()?.badges && store.profile()!.badges.length > 0) {
          <section class="badges-section">
            <h2>Vos badges</h2>
            <div class="badges-grid">
              @for (badge of store.profile()!.badges; track badge.id) {
                <div class="badge-item" [style.border-color]="repairerService.getBadgeInfo(badge.type).color">
                  <span class="badge-icon">{{ repairerService.getBadgeInfo(badge.type).icon }}</span>
                  <span class="badge-label">{{ repairerService.getBadgeInfo(badge.type).label }}</span>
                </div>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #f9fafb;
      padding-bottom: 5rem;
    }

    .header {
      background: linear-gradient(135deg, #FF6B35, #F9A825);
      padding: 1.5rem 1rem 1rem;
      color: white;

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }

      .greeting {
        h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin: 0 0 0.25rem 0;
        }

        .date {
          font-size: 0.875rem;
          opacity: 0.9;
          margin: 0;
        }
      }

      .notification-btn {
        position: relative;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        font-size: 1.25rem;
        cursor: pointer;

        .badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
        }
      }
    }

    .verification-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 0.5rem;
      font-size: 0.875rem;

      &.pending {
        background: rgba(245, 158, 11, 0.2);
      }

      .icon {
        font-size: 1rem;
      }

      button {
        margin-left: auto;
        background: white;
        color: #FF6B35;
        border: none;
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
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

    .stats-section {
      padding: 1rem;
      margin-top: -0.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;

      @media (min-width: 640px) {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .stat-card {
      padding: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }

      &.primary {
        background: linear-gradient(135deg, #FF6B35, #F97316);
        color: white;

        .stat-label {
          color: rgba(255, 255, 255, 0.9);
        }
      }

      &.revenue {
        background: linear-gradient(135deg, #F9A825, #F57C00);
        color: white;

        .stat-label {
          color: rgba(255, 255, 255, 0.9);
        }

        .stat-value {
          color: white;
        }
      }

      &.rating {
        .stat-value {
          color: #F9A825;
        }
      }

      &.quality {
        .stat-value {
          color: #4CAF50;
        }
      }

      .stat-icon {
        font-size: 1.5rem;
      }

      .stat-content {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
      }

      .stat-label {
        font-size: 0.75rem;
        color: #64748b;
      }
    }

    .quality-section {
      padding: 0 1rem;
      margin-bottom: 1rem;
    }

    .quality-card {
      padding: 1rem;

      .quality-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }

        .quality-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
        }
      }

      .quality-score {
        display: flex;
        justify-content: center;
        margin-bottom: 1rem;

        .score-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: conic-gradient(
            #4CAF50 calc(var(--score) * 3.6deg),
            #e2e8f0 0
          );
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;

          &::before {
            content: '';
            position: absolute;
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
          }

          .score-value, .score-max {
            position: relative;
            z-index: 1;
          }

          .score-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
          }

          .score-max {
            font-size: 0.75rem;
            color: #64748b;
          }
        }
      }

      .quality-metrics {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
        text-align: center;

        .metric {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .metric-label {
          font-size: 0.625rem;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-value {
          font-size: 1rem;
          font-weight: 600;
          color: #1e293b;
        }
      }
    }

    .requests-section, .actions-section, .badges-section {
      padding: 0 1rem;
      margin-bottom: 1.5rem;

      h2 {
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.75rem 0;
      }
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;

      h2 {
        margin: 0;
      }

      .view-all {
        font-size: 0.875rem;
        color: #FF6B35;
        text-decoration: none;
      }
    }

    .empty-card {
      padding: 2rem;
      text-align: center;

      .empty-icon {
        font-size: 2rem;
        display: block;
        margin-bottom: 0.5rem;
      }

      p {
        color: #64748b;
        margin: 0;
      }
    }

    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .request-card {
      padding: 1rem;
      cursor: pointer;

      .request-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
      }

      .device-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .device-icon {
        font-size: 1.25rem;
      }

      .device-details {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .device-name {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.9375rem;
      }

      .service-type {
        font-size: 0.75rem;
        color: #64748b;
      }

      .request-body {
        margin-bottom: 0.75rem;

        .problem {
          font-size: 0.8125rem;
          color: #475569;
          margin: 0 0 0.5rem 0;
          line-height: 1.4;
        }

        .request-meta {
          display: flex;
          gap: 1rem;
          font-size: 0.75rem;
          color: #94a3b8;
        }
      }

      .request-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .action-card {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-2px);
      }

      .action-icon {
        font-size: 1.5rem;
      }

      .action-label {
        font-size: 0.75rem;
        color: #64748b;
        text-align: center;
      }
    }

    .badges-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .badge-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: white;
      border: 2px solid;
      border-radius: 9999px;

      .badge-icon {
        font-size: 1rem;
      }

      .badge-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: #1e293b;
      }
    }
  `]
})
export class RepairerDashboardComponent implements OnInit {
  readonly repairerService = inject(RepairerService);
  readonly store = inject(RepairerStore);

  readonly isLoading = signal(false);
  readonly notificationCount = signal(0);

  readonly todayDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const [profile, stats, requests] = await Promise.all([
        this.repairerService.getMyProfile(),
        this.repairerService.getStats(),
        this.repairerService.getRequests({ status: 'new', limit: 5 }),
      ]);

      this.store.setProfile(profile);
      this.store.setStats(stats);
      this.store.setRequests(requests.data, requests.total);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  }
}

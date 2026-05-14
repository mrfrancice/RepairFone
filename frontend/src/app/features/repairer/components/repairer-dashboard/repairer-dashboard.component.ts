import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RepairersService, RepairersStore, type RepairerStats, type RepairerRequest } from '@app/domains/repairers';
import { AuthStore } from '../../../../core/stores/auth.store';
import { LoggerService } from '../../../../core/services/logger.service';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiHeaderComponent } from '@app/features/common/components';
import { UiErrorStateComponent } from '../../../../shared/components/ui-error-state/ui-error-state.component';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';

@Component({
  selector: 'app-repairer-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    UiLoadingComponent,
    UiHeaderComponent,
    UiErrorStateComponent,
    InitialsPipe,
  ],
  template: `
    <div class="dashboard">
      <!-- Header -->
      <ui-header
        [title]="getGreeting()"
        [subtitle]="todayDate"
        [showBack]="false"
        [showProfile]="true"
      >
        <div header-actions class="header-actions">
          <button
            class="availability-btn"
            [class.available]="store.profile()?.isAvailable"
            (click)="toggleAvailability()"
          >
            <span class="status-dot"></span>
            {{ store.profile()?.isAvailable ? 'Disponible' : 'Indisponible' }}
          </button>
        </div>
      </ui-header>

      <div class="dashboard-content">
        <!-- Loading -->
        @if (isLoading()) {
          <div class="loading-container">
            <ui-loading size="lg" />
            <p>Chargement du tableau de bord...</p>
          </div>
        }

        <!-- Error -->
        @if (!isLoading() && error()) {
          <ui-error-state
            [message]="error()!"
            severity="error"
            [showRetry]="true"
            (onRetry)="loadDashboardData()"
          />
        }

        @if (!isLoading() && !error()) {
          <!-- Profile Summary Card -->
          <section class="profile-summary">
            <div class="profile-card">
              <div class="profile-left">
                <div class="profile-avatar">
                  @if (authStore.user()?.avatarUrl) {
                    <img [src]="authStore.user()?.avatarUrl" alt="Photo" />
                  } @else {
                    <span class="avatar-placeholder">
                      {{ authStore.user()?.firstName | initials : authStore.user()?.lastName }}
                    </span>
                  }
                  <span class="verification-badge" [class.verified]="store.isVerified()">
                    @if (store.isVerified()) {
                      ✓
                    } @else {
                      !
                    }
                  </span>
                </div>
                <div class="profile-info">
                  <h2 class="business-name">{{ store.profile()?.businessName || 'Mon Atelier' }}</h2>
                  <div class="profile-meta">
                    @if (store.profile()?.commune) {
                      <span class="location">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {{ store.profile()?.commune }}, {{ store.profile()?.city || 'Abidjan' }}
                      </span>
                    }
                    <span class="member-since">
                      Membre depuis {{ getMemberSince() }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="profile-right">
                <div class="rating-badge">
                  <span class="rating-value">{{ getRatingOutOf5().toFixed(1) }}</span>
                  <div class="rating-stars">
                    @for (star of [1,2,3,4,5]; track star) {
                      <span class="star" [class.filled]="star <= Math.round(getRatingOutOf5())">★</span>
                    }
                  </div>
                  <span class="rating-count">{{ store.stats()?.totalReviews || 0 }} avis</span>
                </div>
              </div>
            </div>

            <!-- Verification Banner -->
            @if (store.profile() && !store.isVerified()) {
              <div class="verification-banner" [class.pending]="store.profile()?.verificationStatus === 'pending'">
                @if (store.profile()?.verificationStatus === 'pending' || store.profile()?.verificationStatus === 'under_review') {
                  <span class="banner-icon">⏳</span>
                  <span class="banner-text">Vérification en cours de traitement...</span>
                } @else {
                  <span class="banner-icon">⚠️</span>
                  <span class="banner-text">Complétez votre profil pour être vérifié</span>
                  <button routerLink="/repairer/profile/setup" class="banner-btn">Compléter</button>
                }
              </div>
            }
          </section>

          <!-- Stats Grid -->
          <section class="stats-section">
            <div class="stats-grid">
              <!-- Nouvelles demandes -->
              <div class="stat-card highlight" routerLink="/repairer/requests" [queryParams]="{filter: 'new'}">
                <div class="stat-icon-wrap orange">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ store.stats()?.pendingRequests || 0 }}</span>
                  <span class="stat-label">Nouvelles demandes</span>
                </div>
                @if ((store.stats()?.pendingRequests || 0) > 0) {
                  <span class="stat-badge pulse">Nouveau</span>
                }
              </div>

              <!-- En cours -->
              <div class="stat-card" routerLink="/repairer/requests" [queryParams]="{filter: 'in_progress'}">
                <div class="stat-icon-wrap blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ store.stats()?.inProgressRequests || 0 }}</span>
                  <span class="stat-label">En cours</span>
                </div>
              </div>

              <!-- Complétées -->
              <div class="stat-card" routerLink="/repairer/requests" [queryParams]="{filter: 'completed'}">
                <div class="stat-icon-wrap green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ store.stats()?.completedRequests || 0 }}</span>
                  <span class="stat-label">Complétées</span>
                </div>
              </div>

              <!-- Revenus du mois -->
              <div class="stat-card revenue" routerLink="/payments">
                <div class="stat-icon-wrap gold">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value revenue-value">{{ formatCurrency(store.monthlyRevenue()) }}</span>
                  <span class="stat-label">Revenus ce mois</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Performance Section -->
          <section class="performance-section">
            <div class="section-header">
              <h3>Performance</h3>
              <span class="quality-badge" [style.background]="repairerService.getQualityScoreColor(store.qualityScore())">
                {{ repairerService.getQualityScoreLabel(store.qualityScore()) }}
              </span>
            </div>

            <div class="performance-grid">
              <!-- Score Qualité -->
              <div class="perf-card score-card">
                <div class="score-circle" [style.--score]="store.qualityScore()">
                  <svg viewBox="0 0 36 36" class="circular-chart">
                    <path class="circle-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path class="circle"
                      [style.stroke]="repairerService.getQualityScoreColor(store.qualityScore())"
                      [style.stroke-dasharray]="store.qualityScore() + ', 100'"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div class="score-text">
                    <span class="score-number">{{ store.qualityScore() }}</span>
                    <span class="score-label">/ 100</span>
                  </div>
                </div>
                <span class="card-title">Score Qualité</span>
              </div>

              <!-- Taux de réponse -->
              <div class="perf-card">
                <div class="perf-value">{{ store.stats()?.responseRate || 0 }}%</div>
                <div class="perf-label">Taux de réponse</div>
                <div class="perf-bar">
                  <div class="perf-bar-fill" [style.width.%]="store.stats()?.responseRate || 0"></div>
                </div>
              </div>

              <!-- Taux de complétion -->
              <div class="perf-card">
                <div class="perf-value">{{ store.stats()?.completionRate || 0 }}%</div>
                <div class="perf-label">Taux de complétion</div>
                <div class="perf-bar">
                  <div class="perf-bar-fill green" [style.width.%]="store.stats()?.completionRate || 0"></div>
                </div>
              </div>

              <!-- Temps de réponse -->
              <div class="perf-card">
                <div class="perf-value">{{ store.stats()?.averageResponseTime || 0 }}h</div>
                <div class="perf-label">Temps de réponse moyen</div>
                <div class="perf-indicator" [class.good]="(store.stats()?.averageResponseTime || 0) < 2">
                  @if ((store.stats()?.averageResponseTime || 0) < 2) {
                    <span>⚡ Excellent</span>
                  } @else if ((store.stats()?.averageResponseTime || 0) < 6) {
                    <span>👍 Bon</span>
                  } @else {
                    <span>⏰ À améliorer</span>
                  }
                </div>
              </div>
            </div>
          </section>

          <!-- Nouvelles demandes -->
          <section class="requests-section">
            <div class="section-header">
              <h3>Nouvelles demandes</h3>
              <a routerLink="/repairer/requests" class="view-all">Voir tout →</a>
            </div>

            @if (store.pendingRequests().length === 0) {
              <div class="empty-state">
                <div class="empty-icon">📭</div>
                <p class="empty-title">Aucune nouvelle demande</p>
                <p class="empty-subtitle">Les nouvelles demandes de réparation apparaîtront ici</p>
              </div>
            } @else {
              <div class="requests-list">
                @for (request of store.pendingRequests().slice(0, 3); track request.id) {
                  <div class="request-card" [routerLink]="['/repairer/requests', request.id]">
                    <div class="request-left">
                      <div class="device-icon">📱</div>
                      <div class="request-info">
                        <span class="device-name">
                          {{ request.device?.brand || 'Appareil' }} {{ request.device?.model || '' }}
                        </span>
                        <span class="service-type">{{ request.serviceType?.name || 'Réparation' }}</span>
                      </div>
                    </div>
                    <div class="request-right">
                      @if (request.urgency === 'express') {
                        <span class="urgency-badge">⚡ Express</span>
                      }
                      @if (request.distance) {
                        <span class="distance">{{ request.distance.toFixed(1) }} km</span>
                      }
                      <span class="time-ago">{{ getTimeAgo(request.createdAt) }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Actions rapides -->
          <section class="quick-actions">
            <h3>Actions rapides</h3>
            <div class="actions-grid">
              <a class="action-item" routerLink="/repairer/requests">
                <div class="action-icon orange">📋</div>
                <span>Demandes</span>
              </a>
              <a class="action-item" routerLink="/quotes">
                <div class="action-icon blue">📝</div>
                <span>Devis</span>
              </a>
              <a class="action-item" routerLink="/payments">
                <div class="action-icon green">💰</div>
                <span>Paiements</span>
              </a>
              <a class="action-item" routerLink="/profile">
                <div class="action-icon purple">⚙️</div>
                <span>Paramètres</span>
              </a>
            </div>
          </section>

          <!-- Specialties -->
          @if (store.profile()?.specialties && store.profile()!.specialties.length > 0) {
            <section class="specialties-section">
              <h3>Vos spécialités</h3>
              <div class="specialties-list">
                @for (specialty of store.profile()!.specialties; track specialty) {
                  <span class="specialty-chip">{{ specialty }}</span>
                }
              </div>
            </section>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      min-height: 100vh;
      background: #f5f7fa;
    }

    .dashboard-content {
      padding: 1rem;
      padding-top: var(--header-height, 100px);
      padding-bottom: 100px;
      max-width: 800px;
      margin: 0 auto;
    }

    /* Header Actions */
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .availability-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--color-error, #F44336);
      }

      &.available .status-dot {
        background: var(--color-secondary, #4CAF50);
      }

      &:hover {
        background: rgba(255, 255, 255, 0.3);
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

    /* Profile Summary */
    .profile-summary {
      margin-bottom: 1.5rem;
    }

    .profile-card {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .profile-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .profile-avatar {
      position: relative;
      width: 60px;
      height: 60px;

      img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-primary-900, #E65100));
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        font-weight: 600;
      }

      .verification-badge {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: var(--color-mustard, #FFC107);
        color: white;
        font-size: 0.75rem;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;

        &.verified {
          background: var(--color-secondary, #4CAF50);
        }
      }
    }

    .profile-info {
      .business-name {
        font-size: 1.125rem;
        font-weight: 600;
        color: #1F2937;
        margin: 0 0 0.25rem 0;
      }

      .profile-meta {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        font-size: 0.75rem;
        color: #6B7280;

        .location {
          display: flex;
          align-items: center;
          gap: 0.25rem;

          svg {
            color: var(--color-primary-500, #FF9800);
          }
        }
      }
    }

    .profile-right {
      .rating-badge {
        text-align: center;

        .rating-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--color-mustard, #FFC107);
        }

        .rating-stars {
          display: flex;
          justify-content: center;
          gap: 0.125rem;
          margin: 0.125rem 0;

          .star {
            font-size: 0.875rem;
            color: #e2e8f0;

            &.filled {
              color: var(--color-mustard, #FFC107);
            }
          }
        }

        .rating-count {
          font-size: 0.625rem;
          color: #9CA3AF;
        }
      }
    }

    .verification-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
      padding: 0.75rem 1rem;
      background: #FFF8E1;
      border-radius: 12px;
      border-left: 4px solid var(--color-mustard, #FFC107);

      &.pending {
        background: #E3F2FD;
        border-left-color: var(--color-ocean, #1565C0);
      }

      .banner-icon {
        font-size: 1.25rem;
      }

      .banner-text {
        flex: 1;
        font-size: 0.875rem;
        color: #1F2937;
      }

      .banner-btn {
        padding: 0.375rem 0.875rem;
        background: var(--color-primary-500, #FF9800);
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
      }
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: 1.5rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      position: relative;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      &.highlight {
        border: 2px solid var(--color-primary-500, #FF9800);
      }
    }

    .stat-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;

      &.orange {
        background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-primary-900, #E65100));
        color: white;
      }

      &.blue {
        background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-primary-500, #FF9800));
        color: white;
      }

      &.green {
        background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-success-dark, #2E7D32));
        color: white;
      }

      &.gold {
        background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00));
        color: white;
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;

      .stat-value {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1F2937;

        &.revenue-value {
          font-size: 1.125rem;
        }
      }

      .stat-label {
        font-size: 0.75rem;
        color: #6B7280;
      }
    }

    .stat-badge {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      padding: 0.25rem 0.5rem;
      background: var(--color-primary-500, #FF9800);
      color: white;
      font-size: 0.625rem;
      font-weight: 600;
      border-radius: 4px;
      text-transform: uppercase;

      &.pulse {
        animation: pulse 2s infinite;
      }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }

    /* Performance Section */
    .performance-section {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #1F2937;
        margin: 0;
      }

      .quality-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.6875rem;
        font-weight: 600;
        color: white;
      }

      .view-all {
        font-size: 0.8125rem;
        color: var(--color-primary-500, #FF9800);
        text-decoration: none;
        font-weight: 500;
      }
    }

    .performance-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .perf-card {
      text-align: center;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 12px;

      &.score-card {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 1rem;
        background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      }

      .card-title {
        font-size: 0.75rem;
        color: #6B7280;
        margin-top: 0.5rem;
      }
    }

    .score-circle {
      position: relative;
      width: 100px;
      height: 100px;

      .circular-chart {
        display: block;
        width: 100%;
        height: 100%;
      }

      .circle-bg {
        fill: none;
        stroke: #e2e8f0;
        stroke-width: 3;
      }

      .circle {
        fill: none;
        stroke-width: 3;
        stroke-linecap: round;
        transform: rotate(-90deg);
        transform-origin: center;
        transition: stroke-dasharray 0.5s ease;
      }

      .score-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;

        .score-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1F2937;
          display: block;
        }

        .score-label {
          font-size: 0.625rem;
          color: #9CA3AF;
        }
      }
    }

    .perf-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1F2937;
    }

    .perf-label {
      font-size: 0.6875rem;
      color: #6B7280;
      margin-bottom: 0.5rem;
    }

    .perf-bar {
      height: 4px;
      background: #e2e8f0;
      border-radius: 2px;
      overflow: hidden;

      .perf-bar-fill {
        height: 100%;
        background: var(--color-primary-500, #FF9800);
        border-radius: 2px;
        transition: width 0.5s ease;

        &.green {
          background: var(--color-secondary, #4CAF50);
        }
      }
    }

    .perf-indicator {
      font-size: 0.625rem;
      color: var(--color-mustard, #FFC107);
      margin-top: 0.25rem;

      &.good {
        color: var(--color-secondary, #4CAF50);
      }
    }

    /* Requests Section */
    .requests-section {
      margin-bottom: 1.5rem;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #1F2937;
        margin: 0;
      }
    }

    .empty-state {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      .empty-icon {
        font-size: 3rem;
        margin-bottom: 0.75rem;
      }

      .empty-title {
        font-size: 1rem;
        font-weight: 600;
        color: #1F2937;
        margin: 0 0 0.25rem 0;
      }

      .empty-subtitle {
        font-size: 0.8125rem;
        color: #9CA3AF;
        margin: 0;
      }
    }

    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .request-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }
    }

    .request-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .device-icon {
        font-size: 1.5rem;
      }

      .request-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;

        .device-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #1F2937;
        }

        .service-type {
          font-size: 0.75rem;
          color: #6B7280;
        }
      }
    }

    .request-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;

      .urgency-badge {
        background: #FFF8E1;
        color: var(--color-primary-700, #F57C00);
        padding: 0.125rem 0.5rem;
        border-radius: 4px;
        font-size: 0.625rem;
        font-weight: 600;
      }

      .distance {
        font-size: 0.75rem;
        color: #6B7280;
      }

      .time-ago {
        font-size: 0.6875rem;
        color: #9CA3AF;
      }
    }

    /* Quick Actions */
    .quick-actions {
      margin-bottom: 1.5rem;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #1F2937;
        margin: 0 0 0.75rem 0;
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .action-item {
      background: white;
      border-radius: 12px;
      padding: 1rem 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .action-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;

        &.orange { background: #FFF3E0; }
        &.blue { background: #E3F2FD; }
        &.green { background: #E8F5E9; }
        &.purple { background: #faf5ff; }
      }

      span {
        font-size: 0.6875rem;
        color: #6B7280;
        font-weight: 500;
      }
    }

    /* Specialties */
    .specialties-section {
      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #1F2937;
        margin: 0 0 0.75rem 0;
      }
    }

    .specialties-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .specialty-chip {
      background: white;
      border: 1px solid #e2e8f0;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      color: #4B5563;
    }
  `]
})
export class RepairerDashboardComponent implements OnInit {
  readonly repairerService = inject(RepairersService);
  readonly store = inject(RepairersStore);
  readonly authStore = inject(AuthStore);
  private readonly logger = inject(LoggerService);
  readonly Math = Math;

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly todayDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  ngOnInit(): void {
    this.loadDashboardData();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    let greeting = 'Bonjour';
    if (hour >= 18) greeting = 'Bonsoir';
    else if (hour < 5) greeting = 'Bonne nuit';

    const name = this.store.profile()?.businessName
      || this.authStore.user()?.firstName
      || 'Réparateur';

    return `${greeting}, ${name}`;
  }

  getMemberSince(): string {
    const profile = this.store.profile();
    if (!profile?.createdAt) return 'récemment';

    const date = new Date(profile.createdAt);
    return date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  getRatingOutOf5(): number {
    const rating = this.store.stats()?.averageRating || 0;
    return Math.max(0, Math.min(5, (rating + 5) / 2));
  }

  formatCurrency(amount: number): string {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + 'M';
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + 'K';
    }
    return amount.toLocaleString('fr-FR');
  }

  async loadDashboardData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const [profile, stats, requests] = await Promise.all([
        this.repairerService.getMyProfile(),
        this.repairerService.getStats(),
        this.repairerService.getRequests({ status: 'new', limit: 5 }),
      ]);

      this.store.setProfile(profile);
      this.store.setStats(stats);
      this.store.setRequests(requests.data, requests.total);
    } catch (err: any) {
      this.logger.error('RepairerDashboardComponent', 'Error loading dashboard', err);
      this.error.set(err.message || 'Impossible de charger le tableau de bord');
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

  async toggleAvailability(): Promise<void> {
    const currentProfile = this.store.profile();
    if (!currentProfile) return;

    const newAvailability = !currentProfile.isAvailable;

    try {
      await this.repairerService.updateAvailability(newAvailability);
      this.store.setProfile({
        ...currentProfile,
        isAvailable: newAvailability,
      });
    } catch (err) {
      this.logger.error('RepairerDashboardComponent', 'Error toggling availability', err);
    }
  }
}

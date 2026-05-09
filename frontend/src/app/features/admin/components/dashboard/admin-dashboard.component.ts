import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminService, DashboardSummary, VerificationStats } from '../../services/admin.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { NotificationBellComponent } from '../../../../shared/components/notification-bell/notification-bell.component';
import { HeaderSearchComponent } from '../../../../shared/components/header-search/header-search.component';
import { UiSkeletonComponent } from '../../../../shared/components/ui-skeleton/ui-skeleton.component';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, NotificationBellComponent, HeaderSearchComponent, UiSkeletonComponent, InitialsPipe],
  template: `
    <div class="admin-page">
      <!-- Header like home -->
      <header class="admin-header">
        <div class="header-top">
          <div class="header-left">
            <div class="logo-section">
              <div class="logo-icon">
                <svg viewBox="0 0 32 32" fill="none">
                  <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="rgba(255,255,255,0.18)"/>
                  <path d="M20 11l-2 2m0 0l-2-2m2 2v6m-4 2h8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="header-titles">
                <h1 class="app-title">RepairFone</h1>
                <p class="welcome-msg">{{ getGreeting() }}, {{ getUserName() }}</p>
              </div>
            </div>
          </div>
          <div class="header-right">
            <span class="status-online">
              <span class="status-dot"></span>
              En ligne
            </span>
            <span class="role-badge">{{ getRoleLabel() }}</span>
            <app-notification-bell />
            <button class="profile-btn" (click)="goToProfile()">
              @if (authStore.user()?.avatarUrl) {
                <img [src]="authStore.user()?.avatarUrl" alt="Profil" />
              } @else {
                <div class="profile-placeholder">
                  {{ authStore.user()?.firstName | initials : authStore.user()?.lastName }}
                </div>
              }
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <app-header-search
          placeholder="Rechercher un utilisateur, réparateur..."
          (search)="onSearchChange($event)"
        />
      </header>

      <div class="page-content">
        @if (isLoading()) {
          <!-- Skeleton Loading State -->
          <div class="skeleton-dashboard">
            <!-- Stats Grid Skeleton -->
            <section class="stats-section">
              <div class="section-title-skeleton">
                <ui-skeleton variant="circle" width="20px" height="20px" animation="shimmer" />
                <ui-skeleton variant="text" width="120px" height="16px" animation="shimmer" />
              </div>
              <ui-skeleton
                variant="dashboard-card"
                [count]="4"
                animation="shimmer"
                ariaLabel="Chargement des statistiques"
              />
            </section>

            <!-- Actions Grid Skeleton -->
            <section class="actions-section">
              <div class="section-title-skeleton">
                <ui-skeleton variant="circle" width="20px" height="20px" animation="shimmer" />
                <ui-skeleton variant="text" width="100px" height="16px" animation="shimmer" />
              </div>
              <div class="actions-skeleton-grid">
                <ui-skeleton variant="card" width="100%" height="180px" animation="shimmer" />
                <ui-skeleton variant="card" width="100%" height="180px" animation="shimmer" />
                <ui-skeleton variant="card" width="100%" height="180px" animation="shimmer" />
              </div>
            </section>

            <!-- Details Grid Skeleton -->
            <div class="details-grid">
              <div class="detail-card">
                <div class="detail-title-skeleton">
                  <ui-skeleton variant="circle" width="18px" height="18px" animation="shimmer" />
                  <ui-skeleton variant="text" width="140px" height="14px" animation="shimmer" />
                </div>
                <div class="stat-bars-skeleton">
                  <ui-skeleton variant="rectangle" width="100%" height="40px" animation="shimmer" />
                  <ui-skeleton variant="rectangle" width="100%" height="40px" animation="shimmer" />
                  <ui-skeleton variant="rectangle" width="100%" height="40px" animation="shimmer" />
                </div>
              </div>
              <div class="detail-card">
                <div class="detail-title-skeleton">
                  <ui-skeleton variant="circle" width="18px" height="18px" animation="shimmer" />
                  <ui-skeleton variant="text" width="120px" height="14px" animation="shimmer" />
                </div>
                <div class="status-list-skeleton">
                  <ui-skeleton variant="rectangle" width="100%" height="36px" animation="shimmer" />
                  <ui-skeleton variant="rectangle" width="100%" height="36px" animation="shimmer" />
                  <ui-skeleton variant="rectangle" width="100%" height="36px" animation="shimmer" />
                  <ui-skeleton variant="rectangle" width="100%" height="36px" animation="shimmer" />
                  <ui-skeleton variant="rectangle" width="100%" height="36px" animation="shimmer" />
                </div>
              </div>
            </div>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <div class="error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <p>{{ error() }}</p>
            <button class="btn btn-primary" (click)="loadData()">Réessayer</button>
          </div>
        } @else {
          <!-- Alert Banner for Pending -->
          @if ((stats()?.pending || 0) > 0) {
            <a routerLink="/admin/repairers" [queryParams]="{status: 'pending'}" class="alert-banner">
              <div class="alert-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="alert-content">
                <strong>{{ stats()?.pending }} reparateur(s) en attente</strong>
                <span>Cliquez pour verifier les demandes</span>
              </div>
              <svg class="alert-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          }

          <!-- Stats Overview -->
          <section class="stats-section">
            <h2 class="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 20V10M12 20V4M6 20V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Vue d'ensemble
            </h2>
            <div class="stats-grid">
              <div class="stat-card primary">
                <div class="stat-icon-wrapper">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ dashboard()?.users?.total || 0 }}</span>
                  <span class="stat-label">Utilisateurs</span>
                </div>
              </div>

              <div class="stat-card success">
                <div class="stat-icon-wrapper">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M22 4L12 14.01L9 11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ stats()?.verified || 0 }}</span>
                  <span class="stat-label">Réparateurs vérifiés</span>
                </div>
              </div>

              <div class="stat-card warning">
                <div class="stat-icon-wrapper">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ stats()?.pending || 0 }}</span>
                  <span class="stat-label">En attente</span>
                </div>
              </div>

              <div class="stat-card danger">
                <div class="stat-icon-wrapper">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M12 9V13M12 17H12.01M4.93 4.93L19.07 19.07M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ dashboard()?.users?.suspended || 0 }}</span>
                  <span class="stat-label">Suspendus</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Quick Actions -->
          <section class="actions-section">
            <h2 class="section-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              Actions rapides
            </h2>
            <div class="actions-grid">
              <a routerLink="/admin/repairers" [queryParams]="{status: 'pending'}" class="action-card highlight">
                <div class="action-header">
                  <div class="action-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  @if ((stats()?.pending || 0) > 0) {
                    <span class="action-badge">{{ stats()?.pending }}</span>
                  }
                </div>
                <h3>Verifier les reparateurs</h3>
                <p>Valider ou rejeter les demandes d'inscription</p>
                <span class="action-link">
                  Acceder
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </a>

              <a routerLink="/admin/repairers" class="action-card">
                <div class="action-header">
                  <div class="action-icon orange">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>
                <h3>Gerer les reparateurs</h3>
                <p>Voir et gerer tous les profils</p>
                <span class="action-link">
                  Acceder
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </a>

              <a routerLink="/admin/users" class="action-card">
                <div class="action-header">
                  <div class="action-icon blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>
                <h3>Gerer les utilisateurs</h3>
                <p>Activer ou suspendre des comptes</p>
                <span class="action-link">
                  Acceder
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
              </a>
            </div>
          </section>

          <!-- Detailed Stats -->
          <div class="details-grid">
            <!-- User Distribution -->
            <section class="detail-card">
              <h3 class="detail-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Repartition utilisateurs
              </h3>
              <div class="stat-bars">
                <div class="stat-bar-item">
                  <div class="stat-bar-header">
                    <span class="stat-bar-label">Clients</span>
                    <span class="stat-bar-value">{{ dashboard()?.users?.clients || 0 }}</span>
                  </div>
                  <div class="stat-bar-track">
                    <div class="stat-bar-fill clients" [style.width.%]="getPercentage(dashboard()?.users?.clients, dashboard()?.users?.total)"></div>
                  </div>
                </div>
                <div class="stat-bar-item">
                  <div class="stat-bar-header">
                    <span class="stat-bar-label">Réparateurs</span>
                    <span class="stat-bar-value">{{ dashboard()?.users?.repairers || 0 }}</span>
                  </div>
                  <div class="stat-bar-track">
                    <div class="stat-bar-fill repairers" [style.width.%]="getPercentage(dashboard()?.users?.repairers, dashboard()?.users?.total)"></div>
                  </div>
                </div>
                <div class="stat-bar-item">
                  <div class="stat-bar-header">
                    <span class="stat-bar-label">Actifs</span>
                    <span class="stat-bar-value success">{{ dashboard()?.users?.active || 0 }}</span>
                  </div>
                  <div class="stat-bar-track">
                    <div class="stat-bar-fill active" [style.width.%]="getPercentage(dashboard()?.users?.active, dashboard()?.users?.total)"></div>
                  </div>
                </div>
              </div>
            </section>

            <!-- Repairer Status -->
            <section class="detail-card">
              <h3 class="detail-title">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Statuts reparateurs
              </h3>
              <div class="status-list">
                <a routerLink="/admin/repairers" [queryParams]="{status: 'pending'}" class="status-item">
                  <span class="status-dot pending"></span>
                  <span class="status-label">En attente</span>
                  <span class="status-count">{{ stats()?.pending || 0 }}</span>
                </a>
                <a routerLink="/admin/repairers" [queryParams]="{status: 'under_review'}" class="status-item">
                  <span class="status-dot review"></span>
                  <span class="status-label">En revision</span>
                  <span class="status-count">{{ stats()?.underReview || 0 }}</span>
                </a>
                <a routerLink="/admin/repairers" [queryParams]="{status: 'verified'}" class="status-item">
                  <span class="status-dot verified"></span>
                  <span class="status-label">Verifies</span>
                  <span class="status-count">{{ stats()?.verified || 0 }}</span>
                </a>
                <a routerLink="/admin/repairers" [queryParams]="{status: 'rejected'}" class="status-item">
                  <span class="status-dot rejected"></span>
                  <span class="status-label">Rejetes</span>
                  <span class="status-count">{{ stats()?.rejected || 0 }}</span>
                </a>
                <a routerLink="/admin/repairers" [queryParams]="{status: 'suspended'}" class="status-item">
                  <span class="status-dot suspended"></span>
                  <span class="status-label">Suspendus</span>
                  <span class="status-count">{{ stats()?.suspended || 0 }}</span>
                </a>
              </div>
            </section>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .admin-page {
      min-height: 100vh;
      background: #FAFAFA;
    }

    /* Header sombre charte uniforme */
    .admin-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background:
        radial-gradient(ellipse at 92% 50%, rgba(255, 152, 0, 0.22) 0%, transparent 55%),
        linear-gradient(135deg, #1A1A1A 0%, #0F0F0F 100%);
      border-bottom-left-radius: 30px;
      border-bottom-right-radius: 30px;
      padding: 1rem 1.25rem;
      padding-top: calc(1rem + env(safe-area-inset-top, 0));
      border-bottom: 2px solid var(--color-primary-500, #FF9800);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.35);
    }

    .logo-icon svg {
      width: 28px;
      height: 28px;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
    }

    .app-title {
      font-family: 'Poppins', 'Inter', sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: white;
      margin: 0;
      line-height: 1.2;
    }

    .welcome-msg {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.65);
      margin: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-online {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: rgba(76, 175, 80, 0.18);
      border: 1px solid rgba(76, 175, 80, 0.35);
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #A5D6A7;
    }

    .status-online .status-dot {
      width: 8px;
      height: 8px;
      background: var(--color-secondary, #4CAF50);
      border-radius: 50%;
      animation: statusPulse 2s infinite;
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
    }

    @keyframes statusPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .role-badge {
      padding: 0.375rem 0.75rem;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.35);
    }

    .profile-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid var(--color-primary-500, #FF9800);
      background: rgba(255, 255, 255, 0.08);
      overflow: hidden;
      cursor: pointer;
      padding: 0;
      transition: all 150ms ease;
    }

    .profile-btn:hover {
      border-color: var(--color-gold-800, #F9A825);
      transform: scale(1.05);
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.18);
    }

    .profile-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
    }

    /* Container */
    .page-content {
      padding: 1rem;
      padding-top: 180px;
      padding-bottom: 100px;
    }

    /* Loading & Error */
    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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

    .error-icon {
      color: var(--color-primary-500, #FF9800);
      margin-bottom: 1rem;
    }

    .error-state p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    /* Alert Banner */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: linear-gradient(135deg, #FFF3E0 0%, #FFE8CC 100%);
      border: 2px solid #FFD4B8;
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .alert-banner:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 152, 0, 0.2);
    }

    .alert-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .alert-content {
      flex: 1;
    }

    .alert-content strong {
      display: block;
      color: var(--color-primary-900, #E65100);
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }

    .alert-content span {
      color: #F57C00;
      font-size: 0.875rem;
    }

    .alert-arrow {
      color: var(--color-primary-500, #FF9800);
    }

    /* Section Titles */
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1rem;
    }

    .section-title svg {
      color: var(--color-primary-500, #FF9800);
    }

    /* Stats Section */
    .stats-section {
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    @media (min-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .stat-card {
      background: white;
      border-radius: 20px;
      padding: 1.25rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    }

    .stat-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
    }

    .stat-card.primary::before { background: linear-gradient(90deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825)); }
    .stat-card.success::before { background: linear-gradient(90deg, var(--color-secondary, #4CAF50), var(--color-secondary-light, #81C784)); }
    .stat-card.warning::before { background: linear-gradient(90deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00)); }
    .stat-card.danger::before { background: linear-gradient(90deg, var(--color-error, #F44336), #EF5350); }

    .stat-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-card.primary .stat-icon-wrapper { background: #FFF3E0; color: var(--color-primary-500, #FF9800); }
    .stat-card.success .stat-icon-wrapper { background: #E8F5E9; color: var(--color-secondary, #4CAF50); }
    .stat-card.warning .stat-icon-wrapper { background: #FFF8E1; color: var(--color-mustard, #FFC107); }
    .stat-card.danger .stat-icon-wrapper { background: #FFEBEE; color: var(--color-error, #F44336); }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #1f2937;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #6b7280;
      margin-top: 0.375rem;
    }

    /* Actions Section */
    .actions-section {
      margin-bottom: 2rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 768px) {
      .actions-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .action-card {
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      text-decoration: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
      border: 2px solid transparent;
    }

    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      border-color: #FFE5D9;
    }

    .action-card.highlight {
      background: linear-gradient(135deg, #FFF9F5 0%, #FFF3E0 100%);
      border-color: #FFD4B8;
    }

    .action-card.highlight:hover {
      border-color: var(--color-primary-500, #FF9800);
    }

    .action-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .action-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
    }

    .action-icon.orange {
      background: linear-gradient(135deg, #FF9800, #FFB74D);
    }

    .action-icon.blue {
      background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3));
    }

    .action-badge {
      background: linear-gradient(135deg, var(--color-error, #F44336), #EF5350);
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      min-width: 24px;
      text-align: center;
    }

    .action-card h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.375rem;
    }

    .action-card p {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 1rem;
      flex: 1;
    }

    .action-link {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-primary-500, #FF9800);
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 768px) {
      .details-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .detail-card {
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .detail-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #F5F5F5;
    }

    .detail-title svg {
      color: var(--color-primary-500, #FF9800);
    }

    /* Stat Bars */
    .stat-bars {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stat-bar-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .stat-bar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .stat-bar-label {
      font-size: 0.875rem;
      color: #374151;
    }

    .stat-bar-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }

    .stat-bar-value.success { color: var(--color-secondary, #4CAF50); }

    .stat-bar-track {
      height: 8px;
      background: #F5F5F5;
      border-radius: 4px;
      overflow: hidden;
    }

    .stat-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .stat-bar-fill.clients { background: linear-gradient(90deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3)); }
    .stat-bar-fill.repairers { background: linear-gradient(90deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825)); }
    .stat-bar-fill.active { background: linear-gradient(90deg, var(--color-secondary, #4CAF50), var(--color-secondary-light, #81C784)); }

    /* Status List */
    .status-list {
      display: flex;
      flex-direction: column;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 0;
      border-bottom: 1px solid #F5F5F5;
      text-decoration: none;
      transition: all 0.2s;
    }

    .status-item:last-child {
      border-bottom: none;
    }

    .status-item:hover {
      background: #FAFAFA;
      margin: 0 -1rem;
      padding-left: 1rem;
      padding-right: 1rem;
      border-radius: 12px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-dot.pending { background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00)); }
    .status-dot.review { background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3)); }
    .status-dot.verified { background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-secondary-light, #81C784)); }
    .status-dot.rejected { background: linear-gradient(135deg, var(--color-error, #F44336), #EF5350); }
    .status-dot.suspended { background: linear-gradient(135deg, #6b7280, #9ca3af); }

    .status-label {
      flex: 1;
      font-size: 0.875rem;
      color: #374151;
    }

    .status-count {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
      background: #F5F5F5;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
    }

    /* Button */
    .btn {
      padding: 0.875rem 1.75rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      box-shadow: 0 4px 14px rgba(255, 152, 0, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
    }

    /* Skeleton Styles */
    .skeleton-dashboard {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .section-title-skeleton {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .actions-skeleton-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 768px) {
      .actions-skeleton-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .detail-title-skeleton {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #F5F5F5;
    }

    .stat-bars-skeleton,
    .status-list-skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);
  readonly authStore = inject(AuthStore);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<DashboardSummary | null>(null);
  readonly stats = signal<VerificationStats | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  // Header methods
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon apres-midi';
    return 'Bonsoir';
  }

  getUserName(): string {
    const user = this.authStore.user();
    return user?.firstName || 'Admin';
  }

  getRoleLabel(): string {
    const role = this.authStore.user()?.role;
    const labels: Record<string, string> = {
      repairer: 'Réparateur',
      client: 'Client',
      admin: 'Admin',
    };
    return labels[role || ''] || 'Utilisateur';
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  async loadData(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const [dashboardData, statsData] = await Promise.all([
        this.adminService.getDashboard(),
        this.adminService.getVerificationStats(),
      ]);
      this.dashboard.set(dashboardData);
      this.stats.set(statsData);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement');
    } finally {
      this.isLoading.set(false);
    }
  }

  getPercentage(value: number | undefined, total: number | undefined): number {
    if (!value || !total || total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  onSearchChange(query: string): void {
    // Naviguer vers la page de recherche admin ou filtrer
    if (query) {
      this.router.navigate(['/admin/users'], { queryParams: { search: query } });
    }
  }
}

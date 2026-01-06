import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, DashboardSummary, VerificationStats } from '../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-page">
      <!-- Header Banner -->
      <header class="admin-header">
        <div class="header-content">
          <div class="header-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" stroke-width="2"/>
              <path d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="header-text">
            <h1>Administration</h1>
            <p>Gerez votre plateforme RepairFone</p>
          </div>
        </div>
        <div class="header-decoration"></div>
      </header>

      <div class="admin-container">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement du tableau de bord...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <div class="error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <p>{{ error() }}</p>
            <button class="btn btn-primary" (click)="loadData()">Reessayer</button>
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
                  <span class="stat-label">Reparateurs verifies</span>
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
                    <span class="stat-bar-label">Reparateurs</span>
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
      background: #f8f9fa;
    }

    /* Header */
    .admin-header {
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 50%, #FF9800 100%);
      padding: 2rem 1rem;
      padding-top: calc(2rem + env(safe-area-inset-top, 0));
      position: relative;
      overflow: hidden;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      position: relative;
      z-index: 1;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      backdrop-filter: blur(10px);
    }

    .header-text h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.25rem;
    }

    .header-text p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.875rem;
    }

    .header-decoration {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .header-decoration::after {
      content: '';
      position: absolute;
      top: 60%;
      left: -30%;
      width: 150px;
      height: 150px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 50%;
    }

    /* Container */
    .admin-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
      margin-top: -1rem;
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
      border-top-color: #FF6B35;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-icon {
      color: #FF6B35;
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
      background: linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%);
      border: 2px solid #FFD4B8;
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .alert-banner:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(255, 107, 53, 0.2);
    }

    .alert-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #FF6B35, #FF9800);
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
      color: #E85A24;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }

    .alert-content span {
      color: #B45309;
      font-size: 0.875rem;
    }

    .alert-arrow {
      color: #FF6B35;
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
      color: #FF6B35;
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

    .stat-card.primary::before { background: linear-gradient(90deg, #FF6B35, #FF9800); }
    .stat-card.success::before { background: linear-gradient(90deg, #10b981, #34d399); }
    .stat-card.warning::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .stat-card.danger::before { background: linear-gradient(90deg, #ef4444, #f87171); }

    .stat-icon-wrapper {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-card.primary .stat-icon-wrapper { background: #FFF4E6; color: #FF6B35; }
    .stat-card.success .stat-icon-wrapper { background: #ecfdf5; color: #10b981; }
    .stat-card.warning .stat-icon-wrapper { background: #fffbeb; color: #f59e0b; }
    .stat-card.danger .stat-icon-wrapper { background: #fef2f2; color: #ef4444; }

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
      background: linear-gradient(135deg, #FFF9F5 0%, #FFF4E6 100%);
      border-color: #FFD4B8;
    }

    .action-card.highlight:hover {
      border-color: #FF6B35;
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
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      color: white;
    }

    .action-icon.orange {
      background: linear-gradient(135deg, #FF9800, #FFB74D);
    }

    .action-icon.blue {
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
    }

    .action-badge {
      background: linear-gradient(135deg, #ef4444, #f87171);
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
      color: #FF6B35;
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
      border-bottom: 1px solid #f3f4f6;
    }

    .detail-title svg {
      color: #FF6B35;
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

    .stat-bar-value.success { color: #10b981; }

    .stat-bar-track {
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .stat-bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .stat-bar-fill.clients { background: linear-gradient(90deg, #3b82f6, #60a5fa); }
    .stat-bar-fill.repairers { background: linear-gradient(90deg, #FF6B35, #FF9800); }
    .stat-bar-fill.active { background: linear-gradient(90deg, #10b981, #34d399); }

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
      border-bottom: 1px solid #f3f4f6;
      text-decoration: none;
      transition: all 0.2s;
    }

    .status-item:last-child {
      border-bottom: none;
    }

    .status-item:hover {
      background: #f9fafb;
      margin: 0 -1rem;
      padding-left: 1rem;
      padding-right: 1rem;
      border-radius: 8px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-dot.pending { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
    .status-dot.review { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
    .status-dot.verified { background: linear-gradient(135deg, #10b981, #34d399); }
    .status-dot.rejected { background: linear-gradient(135deg, #ef4444, #f87171); }
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
      background: #f3f4f6;
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
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      color: white;
      box-shadow: 0 4px 14px rgba(255, 107, 53, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
    }
  `],
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);
  readonly dashboard = signal<DashboardSummary | null>(null);
  readonly stats = signal<VerificationStats | null>(null);

  ngOnInit(): void {
    this.loadData();
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
}

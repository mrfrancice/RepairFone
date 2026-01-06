import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/stores/auth.store';
import { RequestsService } from '../../../requests/services/requests.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { HeaderSearchComponent } from '../../../../shared/components/header-search/header-search.component';
import { UiAvatarComponent } from '../../../../shared/components/ui-avatar/ui-avatar.component';
import { BottomNavComponent } from '../../../../shared/components/bottom-nav/bottom-nav.component';
import { NotificationBellComponent } from '../../../../shared/components/notification-bell/notification-bell.component';

interface NearbyRepairer {
  id: string;
  name: string;
  businessName?: string;
  avatarUrl?: string;
  rating: number;
  reviewCount: number;
  specialty: string;
  isVerified: boolean;
  isAvailable: boolean;
  responseTime: number; // in minutes
  distance: number; // in km
  completedRepairs: number;
}

interface QuickService {
  id: string;
  icon: string;
  label: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    HeaderSearchComponent,
    UiAvatarComponent,
    BottomNavComponent,
    NotificationBellComponent,
  ],
  template: `
    <div class="home-container">
      <!-- Header with gradient -->
      <header class="home-header">
        <div class="header-top">
          <div class="header-left">
            <div class="logo-section">
              <div class="logo-icon">
                <svg viewBox="0 0 32 32" fill="none">
                  <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="white"/>
                  <path d="M20 11l-2 2m0 0l-2-2m2 2v6m-4 2h8" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="header-titles">
                <h1 class="app-title">RepairFone</h1>
                <p class="welcome-msg">{{ getGreeting() }}, {{ getUserName() }}</p>
              </div>
            </div>
          </div>
          <div class="header-right">
            @if (authStore.isAuthenticated()) {
              <button class="location-chip" (click)="changeLocation(); $event.stopPropagation()">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 8.667a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M8 14s5-3.5 5-7.333a5 5 0 10-10 0C3 10.5 8 14 8 14z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                @if (locationStatus() === 'loading') {
                  <span>...</span>
                } @else if (locationStatus() === 'success') {
                  <span>{{ getShortAddress() }}</span>
                } @else {
                  <span>Localiser</span>
                }
              </button>
              <span class="status-online">
                <span class="status-dot"></span>
                En ligne
              </span>
              <app-notification-bell />
            }
            <button class="profile-btn" (click)="goToProfile()">
              @if (authStore.user()?.avatarUrl) {
                <img [src]="authStore.user()?.avatarUrl" alt="Profil" />
              } @else {
                <div class="profile-placeholder">
                  {{ getInitials() }}
                </div>
              }
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <app-header-search
          placeholder="Rechercher un appareil, problème..."
          (search)="onSearch($event)"
        />
      </header>

      <!-- Main Content -->
      <main class="home-content">
        <!-- Main Action Cards -->
        <section class="action-section">
          <div class="action-cards">
            <button class="action-card repair-card" (click)="goToRepair()">
              <div class="action-icon-wrapper repair">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M20 12l-4 4m0 0l-4-4m4 4v-8M12 22h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="16" cy="16" r="10" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <div class="action-text">
                <h3>Réparation</h3>
                <p>Trouvez un réparateur près de vous</p>
              </div>
              <div class="action-arrow">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>

            <button class="action-card advice-card" (click)="goToAdvice()">
              <div class="action-icon-wrapper advice">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 22v-2m0-8v4m0 6a10 10 0 110-20 10 10 0 010 20z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="action-text">
                <h3>Conseils</h3>
                <p>Consultez un expert en ligne</p>
              </div>
              <div class="action-arrow">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </button>
          </div>
        </section>

        <!-- Quick Services -->
        <section class="quick-services-section">
          <div class="section-header">
            <h2>Services rapides</h2>
          </div>
          <div class="services-scroll">
            @for (service of quickServices(); track service.id) {
              <button class="service-chip" (click)="selectService(service.id)">
                <span class="service-icon" [style.background]="service.color">{{ service.icon }}</span>
                <span class="service-label">{{ service.label }}</span>
              </button>
            }
          </div>
        </section>

        <!-- Nearby Repairers -->
        <section class="repairers-section">
          <div class="section-header">
            <h2>Réparateurs proches</h2>
            <a routerLink="/search" class="see-all-link">
              Voir tout
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
          </div>

          @if (isLoadingRepairers()) {
            <div class="repairers-loading">
              @for (i of [1, 2, 3]; track i) {
                <div class="repairer-skeleton">
                  <div class="skeleton-avatar"></div>
                  <div class="skeleton-content">
                    <div class="skeleton-line w-70"></div>
                    <div class="skeleton-line w-50"></div>
                    <div class="skeleton-line w-40"></div>
                  </div>
                </div>
              }
            </div>
          } @else if (nearbyRepairers().length === 0) {
            <div class="empty-repairers">
              <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="#E5E7EB" stroke-width="2"/>
                  <path d="M24 16v8m0 8h.01" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <p>Aucun réparateur trouvé</p>
              <span>Activez la localisation pour voir les réparateurs proches</span>
            </div>
          } @else {
            <div class="repairers-list">
              @for (repairer of nearbyRepairers(); track repairer.id) {
                <div class="repairer-card" (click)="viewRepairer(repairer.id)">
                  <div class="repairer-avatar">
                    <ui-avatar
                      [src]="repairer.avatarUrl"
                      [name]="repairer.businessName || repairer.name"
                      size="lg"
                    />
                    @if (repairer.isAvailable) {
                      <span class="availability-dot online"></span>
                    }
                  </div>

                  <div class="repairer-info">
                    <div class="repairer-name-row">
                      <h4>{{ repairer.businessName || repairer.name }}</h4>
                      @if (repairer.isVerified) {
                        <span class="verified-badge" title="Vérifié">
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M7 0L8.5 2.5L11.5 2L10 5L12 8L9 8L7 11L5 8L2 8L4 5L2.5 2L5.5 2.5L7 0Z" fill="#10B981"/>
                            <path d="M5 7l1.5 1.5L9 5.5" stroke="white" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                        </span>
                      }
                    </div>

                    <p class="repairer-specialty">{{ repairer.specialty }}</p>

                    <div class="repairer-meta">
                      <div class="meta-item rating">
                        <span class="star">&#9733;</span>
                        <span class="value">{{ repairer.rating.toFixed(1) }}</span>
                        <span class="count">({{ repairer.reviewCount }})</span>
                      </div>
                      <span class="meta-separator">&#8226;</span>
                      <div class="meta-item distance">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M6 6.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" stroke="currentColor" stroke-width="1.2"/>
                          <path d="M6 11s4-2.5 4-5.5a4 4 0 10-8 0C2 8.5 6 11 6 11z" stroke="currentColor" stroke-width="1.2"/>
                        </svg>
                        {{ formatDistance(repairer.distance) }}
                      </div>
                    </div>

                    <div class="repairer-badges">
                      @if (repairer.responseTime <= 15) {
                        <span class="badge fast">⚡ Réponse rapide</span>
                      }
                      @if (repairer.completedRepairs >= 100) {
                        <span class="badge experienced">{{ repairer.completedRepairs }}+ réparations</span>
                      }
                    </div>
                  </div>

                  <div class="repairer-action">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7.5 15l5-5-5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <!-- Recent Requests (if authenticated) -->
        @if (authStore.isAuthenticated() && activeRequests().length > 0) {
          <section class="requests-section">
            <div class="section-header">
              <h2>Demandes en cours</h2>
              <a routerLink="/requests" class="see-all-link">
                Voir tout
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </a>
            </div>

            <div class="requests-list">
              @for (request of activeRequests(); track request.id) {
                <div class="request-card" (click)="viewRequest(request.id)">
                  <div class="request-status" [style.background]="getStatusColor(request.status)">
                    <span class="status-icon">{{ getStatusIcon(request.status) }}</span>
                  </div>
                  <div class="request-info">
                    <h4>{{ request.deviceName }}</h4>
                    <p>{{ getStatusLabel(request.status) }}</p>
                  </div>
                  <span class="request-time">{{ formatTime(request.updatedAt) }}</span>
                </div>
              }
            </div>
          </section>
        }

        <!-- Problem Categories -->
        <section class="categories-section">
          <div class="section-header">
            <h2>Problèmes fréquents</h2>
          </div>
          <div class="categories-grid">
            @for (category of problemCategories(); track category.id) {
              <button class="category-item" (click)="searchByProblem(category.name)">
                <span class="category-icon">{{ category.icon }}</span>
                <span class="category-name">{{ category.name }}</span>
              </button>
            }
          </div>
        </section>

        <!-- Promo Banner -->
        <section class="promo-section">
          <div class="promo-banner">
            <div class="promo-content">
              <span class="promo-tag">NOUVEAU</span>
              <h3>Devenez réparateur</h3>
              <p>Rejoignez notre réseau et développez votre activité</p>
              <button class="promo-btn" (click)="goToRepairerSignup()">
                En savoir plus
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <div class="promo-illustration">
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="35" fill="rgba(255,255,255,0.1)"/>
                <path d="M50 30l-10 10m0 0L30 30m10 10v-15M35 50h10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </section>
      </main>

      <!-- Bottom spacing for nav -->
      <div class="bottom-spacer"></div>
    </div>

    <app-bottom-nav />
  `,
  styles: [`
    /* ============================================
       CONTAINER
    ============================================ */
    .home-container {
      min-height: 100vh;
      min-height: 100dvh;
      background: #F9FAFB;
      padding-bottom: 80px;
    }

    /* ============================================
       HEADER
    ============================================ */
    .home-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 100%);
      padding: 1.25rem 1.25rem 1.75rem;
      padding-top: calc(1.25rem + env(safe-area-inset-top, 0));
      border-radius: 0 0 24px 24px;
      box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
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
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
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
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      margin: 0;
      line-height: 1.2;
    }

    .welcome-msg {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-online {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: rgba(16, 185, 129, 0.2);
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #ecfdf5;
      backdrop-filter: blur(4px);
    }

    .status-online .status-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      animation: statusPulse 2s infinite;
    }

    @keyframes statusPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .platform-badge {
      padding: 0.375rem 0.75rem;
      background: white;
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #FF6B35;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .role-badge {
      padding: 0.375rem 0.75rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      backdrop-filter: blur(4px);
    }

    .profile-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      overflow: hidden;
      cursor: pointer;
      padding: 0;
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
    }

    /* Location Chip */
    .location-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      color: white;
      font-size: 0.6875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      max-width: 120px;
    }

    .location-chip:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .location-chip svg {
      flex-shrink: 0;
      opacity: 0.9;
    }

    .location-chip span {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* ============================================
       MAIN CONTENT
    ============================================ */
    .home-content {
      padding: 1.25rem;
      margin-top: 180px;
      position: relative;
      z-index: 1;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1F2937;
      margin: 0;
    }

    .see-all-link {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      color: #FF6B35;
      text-decoration: none;
      font-weight: 500;
    }

    /* ============================================
       ACTION CARDS
    ============================================ */
    .action-section {
      margin-bottom: 1.5rem;
    }

    .action-cards {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .action-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: white;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      text-align: left;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.2s ease;
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .action-icon-wrapper {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .action-icon-wrapper.repair {
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 100%);
      color: white;
    }

    .action-icon-wrapper.advice {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
    }

    .action-text {
      flex: 1;
    }

    .action-text h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1F2937;
      margin: 0 0 0.25rem;
    }

    .action-text p {
      font-size: 0.8125rem;
      color: #6B7280;
      margin: 0;
    }

    .action-arrow {
      color: #9CA3AF;
    }

    /* ============================================
       QUICK SERVICES
    ============================================ */
    .quick-services-section {
      margin-bottom: 1.5rem;
    }

    .services-scroll {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }

    .services-scroll::-webkit-scrollbar {
      display: none;
    }

    .service-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: white;
      border: none;
      border-radius: 24px;
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      transition: all 0.2s;
    }

    .service-chip:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .service-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
    }

    .service-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #374151;
    }

    /* ============================================
       REPAIRERS
    ============================================ */
    .repairers-section {
      margin-bottom: 1.5rem;
    }

    .repairers-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .repairer-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 16px;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
      transition: all 0.2s;
    }

    .repairer-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .repairer-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .availability-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
    }

    .availability-dot.online {
      background: #10B981;
    }

    .repairer-info {
      flex: 1;
      min-width: 0;
    }

    .repairer-name-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-bottom: 0.25rem;
    }

    .repairer-name-row h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1F2937;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .verified-badge {
      flex-shrink: 0;
    }

    .repairer-specialty {
      font-size: 0.75rem;
      color: #6B7280;
      margin: 0 0 0.375rem;
    }

    .repairer-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .meta-item.rating .star {
      color: #F59E0B;
    }

    .meta-item.rating .value {
      font-weight: 600;
      color: #1F2937;
    }

    .meta-item.rating .count {
      color: #9CA3AF;
    }

    .meta-separator {
      color: #D1D5DB;
    }

    .meta-item.distance {
      color: #6B7280;
    }

    .repairer-badges {
      display: flex;
      gap: 0.375rem;
      flex-wrap: wrap;
    }

    .badge {
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-size: 0.625rem;
      font-weight: 500;
    }

    .badge.fast {
      background: #FEF3C7;
      color: #92400E;
    }

    .badge.experienced {
      background: #EFF6FF;
      color: #1E40AF;
    }

    .repairer-action {
      color: #9CA3AF;
      flex-shrink: 0;
    }

    /* Loading skeleton */
    .repairers-loading {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .repairer-skeleton {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 16px;
    }

    .skeleton-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .skeleton-line {
      height: 12px;
      background: linear-gradient(90deg, #E5E7EB 25%, #F3F4F6 50%, #E5E7EB 75%);
      background-size: 200% 100%;
      border-radius: 6px;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-line.w-70 { width: 70%; }
    .skeleton-line.w-50 { width: 50%; }
    .skeleton-line.w-40 { width: 40%; }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Empty state */
    .empty-repairers {
      text-align: center;
      padding: 2rem 1rem;
      background: white;
      border-radius: 16px;
    }

    .empty-icon {
      margin-bottom: 1rem;
    }

    .empty-repairers p {
      font-weight: 500;
      color: #374151;
      margin: 0 0 0.25rem;
    }

    .empty-repairers span {
      font-size: 0.8125rem;
      color: #9CA3AF;
    }

    /* ============================================
       REQUESTS
    ============================================ */
    .requests-section {
      margin-bottom: 1.5rem;
    }

    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .request-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem;
      background: white;
      border-radius: 12px;
      cursor: pointer;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
    }

    .request-status {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .status-icon {
      font-size: 1.25rem;
    }

    .request-info {
      flex: 1;
      min-width: 0;
    }

    .request-info h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1F2937;
      margin: 0 0 0.125rem;
    }

    .request-info p {
      font-size: 0.75rem;
      color: #6B7280;
      margin: 0;
    }

    .request-time {
      font-size: 0.6875rem;
      color: #9CA3AF;
    }

    /* ============================================
       CATEGORIES
    ============================================ */
    .categories-section {
      margin-bottom: 1.5rem;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 0.5rem;
      background: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .category-item:hover {
      background: #FFF5F0;
    }

    .category-icon {
      font-size: 1.5rem;
    }

    .category-name {
      font-size: 0.6875rem;
      color: #374151;
      text-align: center;
      line-height: 1.3;
    }

    /* ============================================
       PROMO
    ============================================ */
    .promo-section {
      margin-bottom: 1rem;
    }

    .promo-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
      border-radius: 16px;
      overflow: hidden;
    }

    .promo-content {
      flex: 1;
    }

    .promo-tag {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      font-size: 0.625rem;
      font-weight: 600;
      color: white;
      margin-bottom: 0.5rem;
    }

    .promo-banner h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.25rem;
    }

    .promo-banner p {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
      margin: 0 0 0.75rem;
    }

    .promo-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 1rem;
      background: white;
      color: #1E40AF;
      border: none;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .promo-btn:hover {
      transform: scale(1.02);
    }

    .promo-illustration {
      opacity: 0.5;
    }

    /* ============================================
       BOTTOM SPACER
    ============================================ */
    .bottom-spacer {
      height: 20px;
    }

    /* ============================================
       RESPONSIVE
    ============================================ */
    @media (max-width: 360px) {
      .categories-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (min-width: 640px) {
      .action-cards {
        flex-direction: row;
      }

      .action-card {
        flex: 1;
      }
    }
  `],
})
export class HomeComponent implements OnInit {
  readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly requestsService = inject(RequestsService);
  private readonly settingsService = inject(SettingsService);

  readonly locationStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly userAddress = signal<string>('Abidjan, Cote d\'Ivoire');
  readonly isLoadingRepairers = signal(true);
  readonly nearbyRepairers = signal<NearbyRepairer[]>([]);
  readonly activeRequests = signal<any[]>([]);

  // Now loaded from settings service
  readonly quickServices = computed(() => this.settingsService.getQuickFilters());
  readonly problemCategories = computed(() => this.settingsService.getProblemCategoriesForHome());

  ngOnInit(): void {
    this.settingsService.loadAllSettings().catch(() => {});
    this.detectLocation();
    this.loadNearbyRepairers();
    if (this.authStore.isAuthenticated()) {
      this.loadActiveRequests();
    }
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon apres-midi';
    return 'Bonsoir';
  }

  getUserName(): string {
    if (this.authStore.isAuthenticated()) {
      const user = this.authStore.user();
      return user?.firstName || 'Utilisateur';
    }
    return 'visiteur';
  }

  getInitials(): string {
    if (this.authStore.isAuthenticated()) {
      const user = this.authStore.user();
      const first = user?.firstName?.[0] || '';
      const last = user?.lastName?.[0] || '';
      return (first + last).toUpperCase() || 'U';
    }
    return 'U';
  }

  getRoleLabel(): string {
    const role = this.authStore.user()?.role;
    const labels: Record<string, string> = {
      repairer: 'Réparateur',
      client: 'Client',
      admin: 'Admin',
    };
    return labels[role || ''] || 'Visiteur';
  }

  async detectLocation(): Promise<void> {
    this.locationStatus.set('loading');
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // In production, reverse geocode this position
            this.userAddress.set('Cocody, Abidjan');
            this.locationStatus.set('success');
          },
          () => {
            this.locationStatus.set('error');
          },
          { timeout: 10000 }
        );
      } else {
        this.locationStatus.set('error');
      }
    } catch {
      this.locationStatus.set('error');
    }
  }

  loadNearbyRepairers(): void {
    this.isLoadingRepairers.set(true);
    // Simulated data - in production, this would call an API
    setTimeout(() => {
      this.nearbyRepairers.set([
        {
          id: '1',
          name: 'Kouame Jean',
          businessName: 'Tech Repair Pro',
          rating: 4.8,
          reviewCount: 127,
          specialty: 'iPhone & Samsung',
          isVerified: true,
          isAvailable: true,
          responseTime: 10,
          distance: 1.2,
          completedRepairs: 245,
        },
        {
          id: '2',
          name: 'Yao Sylvain',
          businessName: 'Mobile Fix CI',
          rating: 4.6,
          reviewCount: 89,
          specialty: 'Tous smartphones',
          isVerified: true,
          isAvailable: true,
          responseTime: 20,
          distance: 2.5,
          completedRepairs: 156,
        },
        {
          id: '3',
          name: 'Koffi Ange',
          businessName: 'PhoneDoc Abidjan',
          rating: 4.9,
          reviewCount: 203,
          specialty: 'Réparation express',
          isVerified: true,
          isAvailable: false,
          responseTime: 5,
          distance: 0.8,
          completedRepairs: 312,
        },
      ]);
      this.isLoadingRepairers.set(false);
    }, 1000);
  }

  async loadActiveRequests(): Promise<void> {
    try {
      const result = await this.requestsService.getMyRequests({
        status: ['pending', 'accepted'],
        limit: 5
      });
      this.activeRequests.set(
        result.data.map(req => ({
          id: req.id,
          deviceName: req.device ? `${req.device.brand} ${req.device.model}` : 'Appareil',
          status: req.status,
          updatedAt: req.updatedAt,
        }))
      );
    } catch (err) {
      console.error('Error loading active requests:', err);
      this.activeRequests.set([]);
    }
  }

  onSearch(query: string): void {
    if (query.trim()) {
      this.router.navigate(['/search'], { queryParams: { q: query } });
    }
  }

  goToSearch(): void {
    this.router.navigate(['/search']);
  }

  goToRepair(): void {
    this.router.navigate(['/search']);
  }

  goToAdvice(): void {
    this.router.navigate(['/conseils']);
  }

  goToProfile(): void {
    if (this.authStore.isAuthenticated()) {
      this.router.navigate(['/profile']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  changeLocation(): void {
    // Open location picker or re-detect
    this.detectLocation();
  }

  getShortAddress(): string {
    const address = this.userAddress();
    // Retourne juste la ville ou les premiers mots
    if (address.includes(',')) {
      return address.split(',')[0].trim();
    }
    // Limiter à 15 caractères
    return address.length > 15 ? address.substring(0, 12) + '...' : address;
  }

  selectService(serviceId: string): void {
    this.router.navigate(['/search'], { queryParams: { service: serviceId } });
  }

  viewRepairer(id: string): void {
    this.router.navigate(['/search/repairer', id]);
  }

  viewRequest(id: string): void {
    this.router.navigate(['/tracking', id]);
  }

  searchByProblem(problem: string): void {
    this.router.navigate(['/search'], { queryParams: { problem } });
  }

  goToRepairerSignup(): void {
    this.router.navigate(['/repairer/register']);
  }

  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#FEF3C7',
      accepted: '#D1FAE5',
      rejected: '#FEE2E2',
    };
    return colors[status] || '#F3F4F6';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: '⏳',
      accepted: '✅',
      rejected: '❌',
    };
    return icons[status] || '❓';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En analyse',
      accepted: 'Acceptée',
      rejected: 'Rejetée',
    };
    return labels[status] || status;
  }
}

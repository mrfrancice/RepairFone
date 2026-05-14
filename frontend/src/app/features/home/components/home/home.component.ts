import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../../core/stores/auth.store';
import { RequestsService } from '@app/domains/requests';
import { SettingsService } from '../../../../core/services/settings.service';
import { SearchService } from '../../../search/services/search.service';
import { UiSearchBarComponent } from '@app/shared';
import { UiAvatarComponent } from '../../../../shared/components/ui-avatar/ui-avatar.component';
import { UiSkeletonComponent } from '../../../../shared/components/ui-skeleton/ui-skeleton.component';
import { UiHeaderComponent } from '@app/features/common/components';
import { StatusLabelsService, RequestStatus } from '../../../../shared/services/status-labels.service';
import { UiErrorStateComponent } from '../../../../shared/components/ui-error-state/ui-error-state.component';
import { LoggerService } from '../../../../core/services/logger.service';
import { GeolocationService } from '../../../../core/services/geolocation.service';
import { formatDistanceKm } from '../../../../shared/utils/format.utils';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    UiSearchBarComponent,
    UiAvatarComponent,
    UiSkeletonComponent,
    UiHeaderComponent,
    UiErrorStateComponent,
  ],
  template: `
    <div class="home-container">
      <!-- Header unifié (charte sombre + slots) -->
      <ui-header
        title="RepairFone"
        [subtitle]="getGreeting() + ', ' + getUserName()"
        [showIcon]="true"
        [showStatus]="authStore.isAuthenticated()"
        [showRoleBadge]="authStore.isAuthenticated()"
        [showProfile]="true"
      >
        <svg header-icon viewBox="0 0 32 32" fill="none" width="28" height="28" aria-hidden="true">
          <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="rgba(255,255,255,0.18)"/>
          <path d="M20 11l-2 2m0 0l-2-2m2 2v6m-4 2h8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        @if (authStore.isAuthenticated()) {
          <button header-extras class="location-chip" (click)="changeLocation(); $event.stopPropagation()" aria-label="Modifier ma localisation">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
        }

        <ui-search-bar
          placeholder="Rechercher un service, un problème..."
          variant="transparent"
          (search)="onSearch($event)"
        />
      </ui-header>

      <!-- Main Content -->
      <main class="home-content">
        <!-- Main Action Cards -->
        <section class="action-section">
          <div class="action-cards">
            @if (authStore.isRepairer()) {
              <!-- Repairer-specific cards -->
              <button class="action-card repair-card" (click)="goToRepairerRequests()">
                <div class="action-icon-wrapper repair">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M12 16h8M12 20h8M12 12h8M8 8h16v16H8V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="action-text">
                  <div class="action-title-row">
                    <h3>Demandes reçues</h3>
                    <span class="time-badge">Pro</span>
                  </div>
                  <p>Consultez et répondez aux demandes clients</p>
                </div>
                <div class="action-arrow">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </button>

              <button class="action-card advice-card" (click)="goToRepairerDashboard()">
                <div class="action-icon-wrapper advice">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M10 14h12M10 18h8M8 8h16v16H8V8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M20 8V6a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
                <div class="action-text">
                  <div class="action-title-row">
                    <h3>Tableau de bord</h3>
                    <span class="time-badge advice">Pro</span>
                  </div>
                  <p>Gérez votre activité de réparateur</p>
                </div>
                <div class="action-arrow">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </button>
            } @else {
              <!-- Client/Visitor cards -->
              <button class="action-card repair-card" (click)="goToRepair()">
                <div class="action-icon-wrapper repair">
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <path d="M20 12l-4 4m0 0l-4-4m4 4v-8M12 22h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="16" cy="16" r="10" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
                <div class="action-text">
                  <div class="action-title-row">
                    <h3>Trouver un réparateur</h3>
                    <span class="time-badge">~2 min</span>
                  </div>
                  <p>Décrivez votre panne et recevez des devis gratuits</p>
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
                    <path d="M16 12v4m0 4h.01M8 8h16l-2 12H10L8 8zm0 0V6a2 2 0 012-2h12a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <div class="action-text">
                  <div class="action-title-row">
                    <h3>Diagnostic en ligne</h3>
                    <span class="time-badge advice">Gratuit</span>
                  </div>
                  <p>Obtenez un avis d'expert avant de réparer</p>
                </div>
                <div class="action-arrow">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15l5-5-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
              </button>
            }
          </div>
        </section>

        <!-- Quick Services - Shortcut chips (only for clients/visitors) -->
        @if (!authStore.isRepairer()) {
          <section class="quick-services-section">
            <div class="section-header">
              <h2>Réparations courantes</h2>
              <span class="section-hint">Accès rapide</span>
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
        }

        <!-- Nearby Repairers (for clients/visitors) / Quick stats (for repairers) -->
        @if (!authStore.isRepairer()) {
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
            <ui-skeleton
              variant="repairer-card"
              [count]="3"
              animation="shimmer"
              ariaLabel="Chargement des reparateurs"
            />
          } @else if (repairersError()) {
            <ui-error-state
              [message]="repairersError()!"
              severity="warning"
              [showRetry]="true"
              (onRetry)="loadNearbyRepairers()"
            />
          } @else if (nearbyRepairers().length === 0) {
            <div class="empty-repairers">
              <div class="empty-icon">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <circle cx="24" cy="24" r="20" stroke="#EEEEEE" stroke-width="2"/>
                  <path d="M24 16v8m0 8h.01" stroke="#6B7280" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              @if (locationStatus() === 'error') {
                <p>Localisation non disponible</p>
                <span>Autorisez l'accès à votre position pour découvrir les réparateurs proches</span>
              } @else {
                <p>Aucun réparateur disponible</p>
                <span>Il n'y a pas encore de réparateurs dans votre zone. Essayez d'élargir votre recherche.</span>
              }
              <button class="empty-action-btn" (click)="goToSearch()">
                Rechercher un réparateur
              </button>
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
                            <path d="M7 0L8.5 2.5L11.5 2L10 5L12 8L9 8L7 11L5 8L2 8L4 5L2.5 2L5.5 2.5L7 0Z" fill="var(--color-secondary, #4CAF50)"/>
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
        }

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
                  <div class="request-status" [style.background]="statusLabels.getRequestStatusStyle(request.status).background">
                    <span class="status-icon">{{ getStatusIcon(request.status) }}</span>
                  </div>
                  <div class="request-info">
                    <h4>{{ request.deviceName }}</h4>
                    <p>{{ statusLabels.getRequestStatusLabel(request.status) }}</p>
                  </div>
                  <span class="request-time">{{ formatTime(request.updatedAt) }}</span>
                </div>
              }
            </div>
          </section>
        }

        <!-- Promo Banner - B2B CTA (only for non-repairers) -->
        @if (!authStore.isRepairer()) {
          <section class="promo-section">
            <div class="promo-banner">
              <div class="promo-content">
                <span class="promo-tag">PROFESSIONNELS</span>
                <h3>Rejoignez notre réseau</h3>
                <p>Recevez des demandes de clients près de chez vous</p>
                <div class="promo-benefits">
                  <span class="benefit-item">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Inscription gratuite
                  </span>
                  <span class="benefit-item">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Paiement sécurisé
                  </span>
                </div>
                <button class="promo-btn" (click)="goToRepairerSignup()">
                  Commencer maintenant
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 12l4-4-4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
              <div class="promo-illustration">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="35" fill="rgba(255,255,255,0.1)"/>
                  <path d="M32 40h16M40 32v16" stroke="white" stroke-width="3" stroke-linecap="round"/>
                  <path d="M40 24a16 16 0 110 32 16 16 0 010-32z" stroke="white" stroke-width="2" stroke-opacity="0.5"/>
                </svg>
              </div>
            </div>
          </section>
        }
      </main>

      <!-- Bottom spacing for nav -->
      <div class="bottom-spacer"></div>
    </div>
  `,
  styles: [`
    /* ============================================
       CONTAINER
    ============================================ */
    .home-container {
      min-height: 100vh;
      min-height: 100dvh;
      background: #FAFAFA;
      padding-bottom: var(--bottom-nav-height, 80px);
    }

    /* ============================================
       LOCATION CHIP (projetée dans ui-header [header-extras])
    ============================================ */
    .location-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 20px;
      color: rgba(255, 255, 255, 0.85);
      font-size: 0.6875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 150ms ease;
      white-space: nowrap;
      max-width: 120px;
    }

    .location-chip:hover {
      background: var(--color-neutral-200, #EEEEEE);
    }

    .location-chip svg {
      flex-shrink: 0;
      color: var(--color-primary-500, #FF9800);
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
      padding-bottom: calc(1.25rem + var(--bottom-nav-height, 80px) + var(--safe-area-bottom, 0px));
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
      color: var(--color-primary-500, #FF9800);
      text-decoration: none;
      font-weight: 500;
    }

    .section-hint {
      font-size: 0.75rem;
      color: #9CA3AF;
      font-weight: 400;
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
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-primary-900, #E65100) 100%);
      color: white;
    }

    .action-icon-wrapper.advice {
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50) 0%, var(--color-success-dark, #2E7D32) 100%);
      color: white;
    }

    .action-text {
      flex: 1;
    }

    .action-title-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.25rem;
    }

    .action-text h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1F2937;
      margin: 0;
    }

    .time-badge {
      padding: 0.125rem 0.5rem;
      background: #FFF8E1;
      color: #92400E;
      font-size: 0.625rem;
      font-weight: 600;
      border-radius: 12px;
      white-space: nowrap;
    }

    .time-badge.advice {
      background: #E8F5E9;
      color: #065F46;
    }

    .action-text p {
      font-size: 0.8125rem;
      color: #6B7280;
      margin: 0;
    }

    .action-arrow {
      color: #6B7280;  /* WCAG AA compliant */
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
      border-radius: 12px;
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
      background: var(--color-secondary, #4CAF50);
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
      color: var(--color-mustard, #FFC107);
    }

    .meta-item.rating .value {
      font-weight: 600;
      color: #1F2937;
    }

    .meta-item.rating .count {
      color: #6B7280;  /* WCAG AA compliant */
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
      background: #FFF8E1;
      color: #92400E;
    }

    .badge.experienced {
      background: #E3F2FD;
      color: var(--color-ocean, #1565C0);
    }

    .repairer-action {
      color: #6B7280;  /* WCAG AA compliant */
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
      background: linear-gradient(90deg, #EEEEEE 25%, #F5F5F5 50%, #EEEEEE 75%);
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
      background: linear-gradient(90deg, #EEEEEE 25%, #F5F5F5 50%, #EEEEEE 75%);
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
      color: #6B7280;  /* WCAG AA compliant */
      display: block;
      margin-bottom: 1rem;
    }

    .empty-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.625rem 1.25rem;
      background: var(--color-primary-500, #FF9800);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .empty-action-btn:hover {
      background: var(--color-primary-900, #E65100);
      transform: translateY(-1px);
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
      border-radius: 12px;
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
      color: #6B7280;  /* WCAG AA compliant */
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
      background: #FFF3E0;
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
      background: linear-gradient(135deg, var(--color-ocean, #1565C0) 0%, var(--color-ocean-500, #2196F3) 100%);
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
      margin: 0 0 0.5rem;
    }

    .promo-benefits {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .benefit-item {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .benefit-item svg {
      color: #86EFAC;
    }

    .promo-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 1rem;
      background: white;
      color: var(--color-ocean, #1565C0);
      border: none;
      border-radius: 12px;
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
  private readonly searchService = inject(SearchService);
  readonly statusLabels = inject(StatusLabelsService);
  private readonly logger = inject(LoggerService);
  private readonly geolocation = inject(GeolocationService);

  readonly locationStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly userAddress = signal<string>('Abidjan, Cote d\'Ivoire');
  readonly isLoadingRepairers = signal(true);
  readonly nearbyRepairers = signal<NearbyRepairer[]>([]);
  readonly activeRequests = signal<any[]>([]);
  readonly repairersError = signal<string | null>(null);

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
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }

  getUserName(): string {
    if (this.authStore.isAuthenticated()) {
      const user = this.authStore.user();
      return user?.firstName || 'Utilisateur';
    }
    return 'visiteur';
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
      await this.geolocation.getCurrentPosition();
      // In production, reverse geocode this position
      this.userAddress.set('Cocody, Abidjan');
      this.locationStatus.set('success');
    } catch {
      this.locationStatus.set('error');
    }
  }

  async loadNearbyRepairers(): Promise<void> {
    this.isLoadingRepairers.set(true);
    this.repairersError.set(null);
    try {
      // Default location : Plateau Centre, Abidjan (point neutre, ne
      // matche pas la coord d'un seed → évite les "0 m" trompeurs).
      const defaultLat = 5.3197;
      const defaultLng = -4.0269;

      const result = await this.searchService.searchRepairers({
        latitude: defaultLat,
        longitude: defaultLng,
        radius: 50, // 50km radius
        limit: 12,
      });

      const repairers: NearbyRepairer[] = result.data
        .map(r => ({
          id: r.id,
          name: r.firstName && r.lastName ? `${r.firstName} ${r.lastName}` : 'Réparateur',
          businessName: r.repairerProfile?.businessName,
          avatarUrl: r.avatarUrl,
          rating: r.repairerProfile?.rating || 0,
          reviewCount: r.repairerProfile?.reviewCount || 0,
          specialty: r.repairerProfile?.specialties?.join(', ') || 'Réparation mobile',
          isVerified: r.repairerProfile?.isVerified || false,
          isAvailable: r.repairerProfile?.isAvailable || false,
          responseTime: r.repairerProfile?.responseTime || 30,
          distance: r.distance || 0,
          completedRepairs: r.repairerProfile?.completedRepairs || 0,
        }))
        // Ne pas remonter en accueil les réparateurs mal notés (< 3/5).
        // Les nouveaux sans note (rating === 0 ou reviewCount === 0) restent visibles.
        .filter(r => r.reviewCount === 0 || r.rating >= 3)
        .slice(0, 5);

      this.nearbyRepairers.set(repairers);
    } catch (err) {
      this.logger.error('HomeComponent', 'Error loading nearby repairers', err);
      this.repairersError.set('Impossible de charger les réparateurs proches');
      this.nearbyRepairers.set([]);
    } finally {
      this.isLoadingRepairers.set(false);
    }
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
      this.logger.error('HomeComponent', 'Error loading active requests', err);
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

  goToRepairerRequests(): void {
    this.router.navigate(['/repairer/requests']);
  }

  goToRepairerDashboard(): void {
    this.router.navigate(['/repairer']);
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
    // Navigate to registration page with repairer role pre-selected
    this.router.navigate(['/auth/register'], { queryParams: { role: 'repairer' } });
  }

  readonly formatDistance = formatDistanceKm;

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      pending: '⏳',
      accepted: '✅',
      rejected: '❌',
    };
    return icons[status] || '❓';
  }
}

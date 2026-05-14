import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthStore, User } from '../../../../core/stores/auth.store';
import { AuthService } from '../../../auth/services/auth.service';
import { UsersService } from '@app/domains/users';
import { RequestsService, type RequestStats } from '@app/domains/requests';
import { ReviewsService, Review, SubRatings, StepRatingStats, StepRating } from '@app/domains/reviews';
import { SecureStorageService } from '../../../../core/services/secure-storage.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { UiHeaderComponent } from '@app/features/common/components';
import { UiSkeletonComponent } from '../../../../shared/components/ui-skeleton/ui-skeleton.component';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format.pipe';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, UiHeaderComponent, UiSkeletonComponent, InitialsPipe, PhoneFormatPipe],
  template: `
    <div class="profile-page">
      <!-- Header Banner -->
      <ui-header title="" [showBack]="false" [showProfile]="false">
        <div class="profile-header-content">
          <div class="profile-avatar">
            @if (user()?.avatarUrl) {
              <img [src]="user()?.avatarUrl" alt="Avatar" />
            } @else {
              <div class="avatar-placeholder">
                {{ user()?.firstName | initials : user()?.lastName }}
              </div>
            }
            <div class="avatar-badge" [class]="user()?.role">
              @if (user()?.role === 'admin') {
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
                </svg>
              } @else if (user()?.role === 'repairer') {
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2"/>
                </svg>
              } @else {
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2"/>
                </svg>
              }
            </div>
          </div>

          <div class="profile-info">
            <h1 class="profile-name">
              {{ user()?.firstName }} {{ user()?.lastName }}
            </h1>

            <p class="profile-phone">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7294C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6408 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.19 12.85C3.49998 10.2412 2.44824 7.27099 2.12 4.18C2.09501 3.90347 2.12787 3.62476 2.2165 3.36162C2.30513 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.11 2H7.11C7.59531 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.11 3.72C9.23662 4.68007 9.47144 5.62273 9.81 6.53C9.94454 6.88792 9.97366 7.27691 9.89391 7.65088C9.81415 8.02485 9.62886 8.36811 9.36 8.64L8.09 9.91C9.51355 12.4135 11.5865 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="currentColor" stroke-width="2"/>
              </svg>
              {{ user()?.phone | phoneFormat }}
            </p>
          </div>
        </div>

        <div class="profile-role-corner" [class]="'role-' + user()?.role">
          <span class="role-icon">
            @if (user()?.role === 'admin') {
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
              </svg>
            } @else if (user()?.role === 'repairer') {
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2"/>
              </svg>
            } @else {
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2"/>
              </svg>
            }
          </span>
          {{ getRoleLabel() }}
        </div>
      </ui-header>

      <div class="profile-content">
        <!-- Stats Skeleton (while loading) -->
        @if (isLoadingStats() && !isAdmin()) {
          <section class="stats-section">
            <ui-skeleton
              variant="stats-grid"
              animation="shimmer"
              ariaLabel="Chargement des statistiques"
            />
          </section>
        }

        <!-- Stats (hidden for admin) -->
        @if (!isLoadingStats() && stats() && !isAdmin()) {
          <section class="stats-section">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon accepted">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ stats()?.accepted }}</span>
                  <span class="stat-label">Acceptées</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon pending">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M12 6V12L16 14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ stats()?.pending }}</span>
                  <span class="stat-label">En analyse</span>
                </div>
              </div>
              <div class="stat-card">
                <div class="stat-icon total">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5" stroke="currentColor" stroke-width="2"/>
                  </svg>
                </div>
                <div class="stat-info">
                  <span class="stat-value">{{ stats()?.total }}</span>
                  <span class="stat-label">Total</span>
                </div>
              </div>
            </div>
          </section>
        }

        <!-- Repairer Rating Section -->
        @if (isRepairer()) {
          <!-- Rating Section Skeleton -->
          @if (isLoadingReviews()) {
            <section class="section rating-section">
              <div class="section-header">
                <ui-skeleton variant="circle" width="36px" height="36px" animation="shimmer" />
                <ui-skeleton variant="text" width="140px" height="20px" animation="shimmer" />
              </div>
              <div class="rating-skeleton-content">
                <ui-skeleton variant="rectangle" width="100%" height="140px" animation="shimmer" />
                <div class="sub-ratings-skeleton">
                  <ui-skeleton variant="rectangle" width="100%" height="40px" animation="shimmer" />
                  <ui-skeleton variant="rectangle" width="100%" height="40px" animation="shimmer" />
                  <ui-skeleton variant="rectangle" width="100%" height="40px" animation="shimmer" />
                  <ui-skeleton variant="rectangle" width="100%" height="40px" animation="shimmer" />
                </div>
              </div>
            </section>
          }

          @if (!isLoadingReviews()) {
          <section class="section rating-section">
            <div class="section-header">
              <div class="section-icon rating-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                </svg>
              </div>
              <h2>Ma note clients</h2>
            </div>

            <!-- Global Rating Card -->
            <div class="global-rating-card">
              <div class="rating-big">
                <span class="rating-number" [class.positive]="getOverallAverage() > 0" [class.negative]="getOverallAverage() < 0">
                  {{ getOverallAverage() > 0 ? '+' : '' }}{{ getOverallAverage().toFixed(1) }}
                </span>
                <span class="rating-max">/5</span>
              </div>
              <div class="rating-gauge">
                <div class="gauge-bar">
                  <div class="gauge-fill" [style.width.%]="getGaugeWidth()" [style.background]="getGaugeColor()"></div>
                  <div class="gauge-center"></div>
                </div>
              </div>
              <span class="rating-label" [style.color]="getGaugeColor()">{{ getStepRatingLabel(getOverallAverage()) }}</span>
              <span class="rating-count">{{ stepRatingStats()?.overall?.count || 0 }} evaluations</span>
            </div>

            <!-- Sub Ratings by Category -->
            @if (stepRatingStats()?.byCategory) {
              <div class="sub-ratings">
                <div class="sub-rating-item">
                  <span class="sub-rating-icon">💬</span>
                  <div class="sub-rating-info">
                    <span class="sub-rating-label">Communication</span>
                    <div class="sub-rating-bar-container">
                      <div class="sub-rating-bar-bg"></div>
                      <div class="sub-rating-bar-fill" [style.width.%]="getCategoryWidth('communication')" [style.background]="getCategoryColor('communication')"></div>
                    </div>
                  </div>
                  <span class="sub-rating-value" [style.color]="getCategoryColor('communication')">
                    {{ formatRating(getCategoryAverage('communication')) }}
                  </span>
                </div>
                <div class="sub-rating-item">
                  <span class="sub-rating-icon">⭐</span>
                  <div class="sub-rating-info">
                    <span class="sub-rating-label">Qualite</span>
                    <div class="sub-rating-bar-container">
                      <div class="sub-rating-bar-bg"></div>
                      <div class="sub-rating-bar-fill" [style.width.%]="getCategoryWidth('quality')" [style.background]="getCategoryColor('quality')"></div>
                    </div>
                  </div>
                  <span class="sub-rating-value" [style.color]="getCategoryColor('quality')">
                    {{ formatRating(getCategoryAverage('quality')) }}
                  </span>
                </div>
                <div class="sub-rating-item">
                  <span class="sub-rating-icon">⏰</span>
                  <div class="sub-rating-info">
                    <span class="sub-rating-label">Délais</span>
                    <div class="sub-rating-bar-container">
                      <div class="sub-rating-bar-bg"></div>
                      <div class="sub-rating-bar-fill" [style.width.%]="getCategoryWidth('timeliness')" [style.background]="getCategoryColor('timeliness')"></div>
                    </div>
                  </div>
                  <span class="sub-rating-value" [style.color]="getCategoryColor('timeliness')">
                    {{ formatRating(getCategoryAverage('timeliness')) }}
                  </span>
                </div>
                <div class="sub-rating-item">
                  <span class="sub-rating-icon">💰</span>
                  <div class="sub-rating-info">
                    <span class="sub-rating-label">Prix</span>
                    <div class="sub-rating-bar-container">
                      <div class="sub-rating-bar-bg"></div>
                      <div class="sub-rating-bar-fill" [style.width.%]="getCategoryWidth('price')" [style.background]="getCategoryColor('price')"></div>
                    </div>
                  </div>
                  <span class="sub-rating-value" [style.color]="getCategoryColor('price')">
                    {{ formatRating(getCategoryAverage('price')) }}
                  </span>
                </div>
              </div>
            }

            <!-- Recent Reviews -->
            @if (recentReviews().length > 0) {
              <div class="recent-reviews">
                <h3 class="reviews-title">Dernieres evaluations</h3>
                @for (review of recentReviews().slice(0, 5); track review.id) {
                  <div class="review-card">
                    <div class="review-header">
                      <div class="review-client">
                        <div class="client-avatar-small">
                          {{ review.client?.firstName | initials : review.client?.lastName }}
                        </div>
                        <span class="client-name-small">{{ review.client?.firstName }} {{ review.client?.lastName?.charAt(0) }}.</span>
                      </div>
                      <div class="review-rating-badge" [style.background]="getStepRatingBgColor(review.rating)">
                        <span [style.color]="getStepRatingTextColor(review.rating)">{{ formatRating(review.rating) }}</span>
                      </div>
                    </div>
                    <div class="review-meta">
                      <span class="review-category">{{ getCategoryLabel(review.category) }}</span>
                      <span class="review-separator">•</span>
                      <span class="review-step">{{ getStepLabel(review.step) }}</span>
                    </div>
                    @if (review.comment) {
                      <p class="review-comment">{{ review.comment }}</p>
                    }
                    <span class="review-date">{{ formatReviewDate(review.createdAt) }}</span>
                  </div>
                }
              </div>
            }

            <!-- See All Reviews Button -->
            <a routerLink="/reviews/my" class="see-all-reviews-btn">
              <span>Voir tous les avis</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 6L15 12L9 18"/>
              </svg>
            </a>
          </section>
          }
        }

        <!-- Repairer Profile -->
        @if (isRepairer() && user()?.repairerProfile) {
          <section class="section repairer-section">
            <div class="section-header">
              <div class="section-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21H5M19 21H21M5 21H3M9 7H10M9 11H10M14 7H15M14 11H15M9 21V16C9 15.4477 9.44772 15 10 15H14C14.5523 15 15 15.4477 15 16V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h2>Profil reparateur</h2>
            </div>

            <div class="info-cards">
              @if (user()?.repairerProfile?.businessName) {
                <div class="info-card">
                  <span class="info-label">Nom commercial</span>
                  <span class="info-value">{{ user()?.repairerProfile?.businessName }}</span>
                </div>
              }

              <div class="info-card">
                <span class="info-label">Statut</span>
                <div class="status-badge" [class.available]="user()?.repairerProfile?.isAvailable">
                  <span class="status-dot"></span>
                  {{ user()?.repairerProfile?.isAvailable ? 'Disponible' : 'Indisponible' }}
                </div>
              </div>

              @if (user()?.repairerProfile?.address) {
                <div class="info-card full">
                  <span class="info-label">Adresse</span>
                  <span class="info-value address">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" stroke="currentColor" stroke-width="2"/>
                      <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    {{ user()?.repairerProfile?.address }}
                  </span>
                </div>
              }
            </div>

            @if (user()?.repairerProfile?.description) {
              <div class="description-box">
                <span class="info-label">Description</span>
                <p>{{ user()?.repairerProfile?.description }}</p>
              </div>
            }

            @if (user()?.repairerProfile?.specialties?.length) {
              <div class="specialties-section">
                <span class="info-label">Specialites</span>
                <div class="specialty-tags">
                  @for (specialty of user()?.repairerProfile?.specialties; track specialty) {
                    <span class="tag">{{ specialty }}</span>
                  }
                </div>
              </div>
            }
          </section>
        }

        <!-- Menu -->
        <section class="menu-section">
          <a routerLink="/profile/edit" class="menu-item">
            <div class="menu-icon edit">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.50023C18.8978 2.1024 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.1024 21.5 2.50023C21.8978 2.89805 22.1213 3.43762 22.1213 4.00023C22.1213 4.56284 21.8978 5.1024 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="menu-content">
              <span class="menu-title">Modifier mon profil</span>
              <span class="menu-desc">Mettre à jour vos informations</span>
            </div>
            <div class="menu-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </a>

          @if (!isAdmin()) {
            <a routerLink="/requests" class="menu-item">
              <div class="menu-icon requests">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15M9 5C9 6.10457 9.89543 7 11 7H13C14.1046 7 15 6.10457 15 5M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5M12 12H15M12 16H15M9 12H9.01M9 16H9.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="menu-content">
                <span class="menu-title">Mes demandes</span>
                <span class="menu-desc">Voir l'historique des réparations</span>
              </div>
              <div class="menu-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            </a>
          }

          @if (isRepairer()) {
            <a routerLink="/reviews/my" class="menu-item">
              <div class="menu-icon reviews">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="menu-content">
                <span class="menu-title">Mes avis</span>
                <span class="menu-desc">Consulter les avis clients</span>
              </div>
              <div class="menu-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
            </a>
          }

          <button class="menu-item" (click)="replayOnboarding()">
            <div class="menu-icon onboarding">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <polygon points="5 3 19 12 5 21 5 3" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="menu-content">
              <span class="menu-title">Revoir l'introduction</span>
              <span class="menu-desc">Redécouvrir l'application</span>
            </div>
            <div class="menu-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </button>

          <button class="menu-item menu-item-danger" (click)="logout()">
            <div class="menu-icon logout">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9M16 17L21 12M21 12L16 7M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <div class="menu-content">
              <span class="menu-title">Déconnexion</span>
              <span class="menu-desc">Se déconnecter de l'application</span>
            </div>
            <div class="menu-arrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
          </button>
        </section>

        <!-- Admin Link -->
        @if (isAdmin()) {
          <a routerLink="/admin" class="admin-link">
            <div class="admin-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
              </svg>
            </div>
            <span>Administration</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </a>
        }
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      min-height: 100vh;
      background: #FAFAFA;
    }

    /* Profile Header Content — disposition horizontale compacte */
    .profile-header-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      text-align: left;
    }

    .profile-avatar {
      position: relative;
      width: 80px;
      height: 80px;
      flex-shrink: 0;
    }

    .profile-avatar img,
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid white;
      box-shadow: var(--shadow-warm, 0 8px 24px rgba(255, 152, 0, 0.20));
    }

    .avatar-placeholder {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Poppins', 'Inter', sans-serif;
      font-size: 1.75rem;
      font-weight: 700;
      color: white;
    }

    .avatar-badge {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .avatar-badge.repairer {
      color: var(--color-primary-500, #FF9800);
    }

    .avatar-badge.client {
      color: var(--color-ocean, #1565C0);
    }

    .avatar-badge.admin {
      color: var(--color-primary-500, #FF9800);
      background: linear-gradient(135deg, #FFF3E0, #e9d5ff);
    }

    .profile-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .profile-name {
      font-family: 'Poppins', 'Inter', sans-serif;
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: white;
      margin: 0;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .profile-phone {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.8125rem;
      margin: 0;
    }

    .profile-phone svg {
      color: var(--color-primary-500, #FF9800);
      flex-shrink: 0;
    }

    /* Badge rôle ancré dans le coin haut-droit du header */
    .profile-role-corner {
      position: absolute;
      top: calc(1rem + env(safe-area-inset-top, 0px));
      right: 1.25rem;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-family: 'Inter', sans-serif;
      font-size: 0.6875rem;
      font-weight: 700;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.35);
      z-index: 1;
    }

    .profile-role-corner.role-admin {
      background: linear-gradient(135deg, var(--color-terracotta, #C62828), #8E1B1B);
      box-shadow: 0 2px 8px rgba(198, 40, 40, 0.35);
    }

    .profile-role-corner.role-repairer {
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-success-dark, #2E7D32));
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.35);
    }

    /* Content */
    .profile-content {
      padding: 1rem;
      padding-top: var(--header-height, 166px);
      position: relative;
      z-index: 1;
    }

    /* Stats */
    .stats-section {
      margin-bottom: 1rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-icon.accepted {
      background: linear-gradient(135deg, #E8F5E9, #C8E6C9);
      color: #2E7D32;
    }

    .stat-icon.pending {
      background: linear-gradient(135deg, #FFF8E1, #FFE082);
      color: #F57C00;
    }

    .stat-icon.total {
      background: linear-gradient(135deg, #FFF3E0, #FFE5D9);
      color: var(--color-primary-900, #E65100);
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.375rem;
      font-weight: 700;
      color: #1f2937;
    }

    .stat-label {
      font-size: 0.6875rem;
      font-weight: 500;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Section */
    .section {
      background: white;
      border-radius: 20px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #F5F5F5;
    }

    .section-icon {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: linear-gradient(135deg, #FFF3E0, #FFE5D9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-primary-500, #FF9800);
    }

    .section-header h2 {
      font-size: 1.0625rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .info-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .info-card {
      background: #FAFAFA;
      padding: 0.875rem;
      border-radius: 12px;
    }

    .info-card.full {
      grid-column: 1 / -1;
    }

    .info-label {
      display: block;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.375rem;
    }

    .info-value {
      font-size: 0.9375rem;
      font-weight: 500;
      color: #1f2937;
    }

    .info-value.address {
      display: flex;
      align-items: flex-start;
      gap: 0.375rem;
    }

    .info-value.address svg {
      flex-shrink: 0;
      margin-top: 2px;
      color: var(--color-primary-500, #FF9800);
    }

    .rating-display {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .stars {
      display: flex;
      gap: 2px;
    }

    .stars svg {
      color: #EEEEEE;
    }

    .stars svg.filled {
      color: var(--color-mustard, #FFC107);
    }

    .rating-text {
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 600;
      background: #FFEBEE;
      color: var(--color-terracotta, #C62828);
    }

    .status-badge.available {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
    }

    .description-box {
      margin-top: 1rem;
      padding: 0.875rem;
      background: #FAFAFA;
      border-radius: 12px;
    }

    .description-box p {
      color: #4b5563;
      line-height: 1.6;
      font-size: 0.9375rem;
      margin-top: 0.375rem;
    }

    .specialties-section {
      margin-top: 1rem;
    }

    .specialty-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .tag {
      background: linear-gradient(135deg, #FFF3E0, #FFE5D9);
      border: 1px solid #FFD4B8;
      color: var(--color-primary-900, #E65100);
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.8125rem;
      font-weight: 500;
    }

    /* Menu */
    .menu-section {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      margin-bottom: 1rem;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #F5F5F5;
      text-decoration: none;
      color: inherit;
      background: none;
      border-left: none;
      border-right: none;
      border-top: none;
      width: 100%;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s;
    }

    .menu-item:last-child {
      border-bottom: none;
    }

    .menu-item:hover {
      background: #FAFAFA;
    }

    .menu-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .menu-icon.edit {
      background: linear-gradient(135deg, var(--color-ocean-50, #E3F2FD), var(--color-ocean-100, #BBDEFB));
      color: var(--color-ocean, #1565C0);
    }

    .menu-icon.requests {
      background: linear-gradient(135deg, var(--color-primary-50, #FFF3E0), var(--color-primary-100, #FFE0B2));
      color: var(--color-primary-500, #FF9800);
    }

    .menu-icon.reviews {
      background: linear-gradient(135deg, #FFF8E1, var(--color-mustard-light, #FFE082));
      color: var(--color-warning-dark, #F57C00);
    }

    .menu-icon.onboarding {
      background: linear-gradient(135deg, var(--color-primary-50, #FFF3E0), var(--color-primary-100, #FFE0B2));
      color: var(--color-primary-500, #FF9800);
    }

    .menu-icon.logout {
      background: linear-gradient(135deg, #FFEBEE, #FFCDD2);
      color: var(--color-terracotta, #C62828);
    }

    .menu-content {
      flex: 1;
      text-align: left;
    }

    .menu-title {
      display: block;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.125rem;
    }

    .menu-desc {
      display: block;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .menu-item-danger .menu-title {
      color: var(--color-terracotta, #C62828);
    }

    .menu-arrow {
      color: #9ca3af;
    }

    /* Admin Link */
    .admin-link {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: linear-gradient(135deg, #1f2937, #374151);
      border-radius: 16px;
      text-decoration: none;
      color: white;
      font-weight: 600;
      font-size: 0.9375rem;
      box-shadow: 0 4px 20px rgba(31, 41, 55, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .admin-link:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(31, 41, 55, 0.4);
    }

    .admin-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .admin-link span {
      flex: 1;
    }

    /* Rating Section */
    .rating-section {
      background: white;
      border-radius: 20px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .rating-icon {
      background: linear-gradient(135deg, #FFF8E1, #FFE082) !important;
      color: #F57C00 !important;
    }

    .global-rating-card {
      background: linear-gradient(135deg, #FFF3E0, #FFE0B2);
      border-radius: 16px;
      padding: 1.5rem;
      text-align: center;
      margin-bottom: 1rem;
      border: 2px solid #fed7aa;
    }

    .rating-big {
      display: flex;
      align-items: baseline;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .rating-number {
      font-size: 3rem;
      font-weight: 800;
      color: var(--color-primary-500, #FF9800);
      line-height: 1;
    }

    .rating-number.positive {
      color: var(--color-secondary, #4CAF50);
    }

    .rating-number.negative {
      color: var(--color-error, #F44336);
    }

    .rating-max {
      font-size: 1.25rem;
      font-weight: 600;
      color: #9ca3af;
      margin-left: 0.25rem;
    }

    .rating-gauge {
      margin-bottom: 0.75rem;
    }

    .gauge-bar {
      position: relative;
      height: 12px;
      background: linear-gradient(90deg, var(--color-error, #F44336), #f97316, var(--color-mustard, #FFC107), var(--color-secondary, #4CAF50), var(--color-secondary, #4CAF50));
      border-radius: 6px;
      overflow: hidden;
    }

    .gauge-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      border-radius: 6px;
      transition: width 0.5s ease;
    }

    .gauge-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 2px;
      height: 16px;
      background: rgba(0, 0, 0, 0.3);
    }

    .rating-label {
      display: block;
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-primary-500, #FF9800);
      margin-bottom: 0.25rem;
    }

    .rating-count {
      display: block;
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Sub Ratings */
    .sub-ratings {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding: 1rem;
      background: #FAFAFA;
      border-radius: 12px;
    }

    .sub-rating-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sub-rating-icon {
      font-size: 1.25rem;
      width: 32px;
      text-align: center;
    }

    .sub-rating-info {
      flex: 1;
    }

    .sub-rating-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.25rem;
    }

    .sub-rating-bar-container {
      position: relative;
      height: 8px;
      border-radius: 4px;
      overflow: hidden;
    }

    .sub-rating-bar-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, #FFCDD2, #FFF8E1, #E8F5E9);
      border-radius: 4px;
    }

    .sub-rating-bar-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
    }

    .sub-rating-bar {
      height: 8px;
      background: #EEEEEE;
      border-radius: 4px;
      overflow: hidden;
    }

    .sub-rating-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary-500, #FF9800), var(--color-mustard, #FFC107));
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .sub-rating-value {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--color-primary-500, #FF9800);
      min-width: 32px;
      text-align: right;
    }

    /* Recent Reviews */
    .recent-reviews {
      margin-bottom: 1rem;
    }

    .reviews-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 0.75rem 0;
    }

    .review-card {
      background: #FAFAFA;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 0.75rem;
      border: 1px solid #EEEEEE;
    }

    .review-card:last-child {
      margin-bottom: 0;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .review-client {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .client-avatar-small {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), #FF9800);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .client-name-small {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }

    .review-rating-small {
      display: flex;
      gap: 2px;
    }

    .review-rating-small svg {
      color: #EEEEEE;
    }

    .review-rating-small svg.filled {
      color: var(--color-mustard, #FFC107);
    }

    .review-rating-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .review-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-size: 0.75rem;
    }

    .review-category {
      color: #6b7280;
      font-weight: 500;
    }

    .review-separator {
      color: #D1D5DB;
    }

    .review-step {
      color: #9ca3af;
    }

    .review-comment {
      font-size: 0.875rem;
      color: #4b5563;
      line-height: 1.5;
      margin: 0 0 0.5rem 0;
    }

    .review-date {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    /* See All Button */
    .see-all-reviews-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), #FF9800);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.9375rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }

    .see-all-reviews-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
    }

    /* Skeleton Styles */
    .rating-skeleton-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .sub-ratings-skeleton {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      background: #FAFAFA;
      border-radius: 12px;
    }
  `],
})
export class ProfileViewComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(UsersService);
  private readonly requestsService = inject(RequestsService);
  private readonly reviewsService = inject(ReviewsService);
  private readonly router = inject(Router);
  private readonly storage = inject(SecureStorageService);
  private readonly logger = inject(LoggerService);

  readonly user = this.authStore.user;
  readonly stats = signal<RequestStats | null>(null);
  readonly recentReviews = signal<StepRating[]>([]);
  readonly stepRatingStats = signal<StepRatingStats | null>(null);
  readonly isLoading = signal(true);
  readonly isLoadingStats = signal(true);
  readonly isLoadingReviews = signal(true);

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.isLoadingStats.set(true);

      await this.profileService.getProfile();
      this.isLoading.set(false);

      const stats = await this.requestsService.getStats();
      this.stats.set(stats);
      this.isLoadingStats.set(false);

      // Load reviews for repairer
      if (this.isRepairer() && this.user()?.id) {
        await this.loadReviews();
      }
    } catch (err) {
      this.logger.error('ProfileViewComponent', 'Error loading profile', err);
      this.isLoading.set(false);
      this.isLoadingStats.set(false);
    }
  }

  async loadReviews(): Promise<void> {
    try {
      this.isLoadingReviews.set(true);
      const repairerProfileId = this.user()?.repairerProfile?.id;
      if (!repairerProfileId) {
        this.isLoadingReviews.set(false);
        return;
      }

      const stats = await this.reviewsService.getRepairerStepRatingStats(repairerProfileId);
      this.stepRatingStats.set(stats);
      this.recentReviews.set(stats.recentRatings || []);
      this.isLoadingReviews.set(false);
    } catch (err) {
      this.logger.error('ProfileViewComponent', 'Error loading reviews', err);
      this.isLoadingReviews.set(false);
    }
  }

  isRepairer(): boolean {
    return this.user()?.role === 'repairer';
  }

  isAdmin(): boolean {
    return this.user()?.role === 'admin';
  }

  getRoleLabel(): string {
    const role = this.user()?.role;
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'repairer': return 'Réparateur';
      default: return 'Client';
    }
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.storage.remove('rf_onboarding_completed');
      this.router.navigate(['/onboarding']);
    } catch (err) {
      this.logger.error('ProfileViewComponent', 'Error logging out', err);
    }
  }

  replayOnboarding(): void {
    this.storage.remove('rf_onboarding_completed');
    this.router.navigate(['/onboarding']);
  }

  getRatingLabel(rating: number): string {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 3.5) return 'Très bon';
    if (rating >= 2.5) return 'Bon';
    if (rating >= 1.5) return 'Passable';
    if (rating > 0) return 'Insuffisant';
    return 'Pas encore noté';
  }

  formatReviewDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaine${diffDays >= 14 ? 's' : ''}`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  // Step Rating Methods
  getOverallAverage(): number {
    return this.stepRatingStats()?.overall?.average || 0;
  }

  getStepRatingLabel(rating: number): string {
    if (rating >= 4) return 'Excellent';
    if (rating >= 2) return 'Très bien';
    if (rating >= 0) return 'Correct';
    if (rating >= -2) return 'Insuffisant';
    if (rating < -2) return 'Très mauvais';
    return 'Pas encore évalué';
  }

  getGaugeWidth(): number {
    const avg = this.getOverallAverage();
    // Convert -5 to +5 scale to 0-100%
    return ((avg + 5) / 10) * 100;
  }

  getGaugeColor(): string {
    const rating = this.getOverallAverage();
    if (rating >= 4) return 'var(--color-secondary, #4CAF50)';
    if (rating >= 2) return 'var(--color-secondary, #4CAF50)';
    if (rating >= 0) return 'var(--color-mustard, #FFC107)';
    if (rating >= -2) return '#f97316';
    return 'var(--color-error, #F44336)';
  }

  getCategoryAverage(category: string): number {
    return this.stepRatingStats()?.byCategory?.[category]?.average || 0;
  }

  getCategoryWidth(category: string): number {
    const avg = this.getCategoryAverage(category);
    return ((avg + 5) / 10) * 100;
  }

  getCategoryColor(category: string): string {
    const rating = this.getCategoryAverage(category);
    if (rating >= 4) return 'var(--color-secondary, #4CAF50)';
    if (rating >= 2) return 'var(--color-secondary, #4CAF50)';
    if (rating >= 0) return 'var(--color-mustard, #FFC107)';
    if (rating >= -2) return '#f97316';
    return 'var(--color-error, #F44336)';
  }

  formatRating(rating: number): string {
    if (rating > 0) return `+${rating.toFixed(1)}`;
    return rating.toFixed(1);
  }

  getStepRatingBgColor(rating: number): string {
    if (rating >= 4) return '#dcfce7';
    if (rating >= 2) return '#E8F5E9';
    if (rating >= 0) return '#FFF8E1';
    if (rating >= -2) return '#FFE0B2';
    return '#FFEBEE';
  }

  getStepRatingTextColor(rating: number): string {
    if (rating >= 4) return 'var(--color-success-dark, #2E7D32)';
    if (rating >= 2) return '#166534';
    if (rating >= 0) return '#F57C00';
    if (rating >= -2) return '#c2410c';
    return '#991b1b';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      communication: 'Communication',
      quality: 'Qualité',
      timeliness: 'Délais',
      price: 'Prix',
      overall: 'Global',
    };
    return labels[category] || category;
  }

  getStepLabel(step: string): string {
    const labels: Record<string, string> = {
      quote_accepted: 'Devis accepté',
      in_progress: 'En cours',
      completed: 'Terminé',
      delivered: 'Livré',
    };
    return labels[step] || step;
  }
}

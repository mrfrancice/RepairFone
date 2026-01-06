import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthStore, User } from '../../../../core/stores/auth.store';
import { AuthService } from '../../../auth/services/auth.service';
import { ProfileService } from '../../services/profile.service';
import { RequestsService, RequestStats } from '../../../requests/services/requests.service';
import { SecureStorageService } from '../../../../core/services/secure-storage.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [CommonModule, RouterLink, UiHeaderComponent],
  template: `
    <div class="profile-page">
      <!-- Header Banner -->
      <ui-header title="" [showBack]="false">
        <div class="profile-header-content">
          <div class="profile-avatar">
            @if (user()?.avatarUrl) {
              <img [src]="user()?.avatarUrl" alt="Avatar" />
            } @else {
              <div class="avatar-placeholder">
                {{ getInitials() }}
              </div>
            }
            <div class="avatar-badge" [class]="user()?.role">
              @if (user()?.role === 'admin') {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
                </svg>
              } @else if (user()?.role === 'repairer') {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="2"/>
                </svg>
              } @else {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 16.7909 18.2091 15 16 15H8C5.79086 15 4 16.7909 4 19V21M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="2"/>
                </svg>
              }
            </div>
          </div>

          <h1 class="profile-name">
            {{ user()?.firstName }} {{ user()?.lastName }}
          </h1>

          <p class="profile-phone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 16.92V19.92C22.0011 20.1985 21.9441 20.4742 21.8325 20.7294C21.7209 20.9845 21.5573 21.2136 21.3521 21.4019C21.1468 21.5901 20.9046 21.7335 20.6408 21.8227C20.3769 21.9119 20.0974 21.9451 19.82 21.92C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77382 17.3147 6.72533 15.2662 5.19 12.85C3.49998 10.2412 2.44824 7.27099 2.12 4.18C2.09501 3.90347 2.12787 3.62476 2.2165 3.36162C2.30513 3.09849 2.44756 2.85669 2.63476 2.65162C2.82196 2.44655 3.0498 2.28271 3.30379 2.17052C3.55777 2.05833 3.83233 2.00026 4.11 2H7.11C7.59531 1.99522 8.06579 2.16708 8.43376 2.48353C8.80173 2.79999 9.04207 3.23945 9.11 3.72C9.23662 4.68007 9.47144 5.62273 9.81 6.53C9.94454 6.88792 9.97366 7.27691 9.89391 7.65088C9.81415 8.02485 9.62886 8.36811 9.36 8.64L8.09 9.91C9.51355 12.4135 11.5865 14.4864 14.09 15.91L15.36 14.64C15.6319 14.3711 15.9751 14.1858 16.3491 14.1061C16.7231 14.0263 17.1121 14.0555 17.47 14.19C18.3773 14.5286 19.3199 14.7634 20.28 14.89C20.7658 14.9585 21.2094 15.2032 21.5265 15.5775C21.8437 15.9518 22.0122 16.4296 22 16.92Z" stroke="currentColor" stroke-width="2"/>
            </svg>
            +225 {{ user()?.phone }}
          </p>

          <div class="profile-role" [class]="'role-' + user()?.role">
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
        </div>
      </ui-header>

      <div class="profile-content">
        <!-- Stats (hidden for admin) -->
        @if (stats() && !isAdmin()) {
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
                  <span class="stat-label">Acceptees</span>
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
                <span class="info-label">Note</span>
                <div class="rating-display">
                  <div class="stars">
                    @for (star of [1,2,3,4,5]; track star) {
                      <svg width="16" height="16" viewBox="0 0 24 24" [class.filled]="star <= (user()?.repairerProfile?.rating || 0)">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" stroke="currentColor" stroke-width="1"/>
                      </svg>
                    }
                  </div>
                  <span class="rating-text">{{ (user()?.repairerProfile?.rating || 0).toFixed(1) }} ({{ user()?.repairerProfile?.reviewCount || 0 }} avis)</span>
                </div>
              </div>

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
              <span class="menu-desc">Mettre a jour vos informations</span>
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
                <span class="menu-desc">Voir l'historique des reparations</span>
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
              <span class="menu-desc">Redecouvrir l'application</span>
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
              <span class="menu-title">Deconnexion</span>
              <span class="menu-desc">Se deconnecter de l'application</span>
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
      background: #f8f9fa;
    }

    /* Profile Header Content */
    .profile-header-content {
      text-align: center;
      padding-top: 0.5rem;
    }

    .profile-avatar {
      position: relative;
      width: 110px;
      height: 110px;
      margin: 0 auto 1rem;
    }

    .profile-avatar img,
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }

    .avatar-placeholder {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: 700;
      color: white;
    }

    .avatar-badge {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .avatar-badge.repairer {
      color: #FF6B35;
    }

    .avatar-badge.client {
      color: #3b82f6;
    }

    .avatar-badge.admin {
      color: #7c3aed;
      background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
    }

    .profile-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.25rem;
      line-height: 1.2;
    }

    .profile-phone {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
    }

    .profile-phone svg {
      opacity: 0.8;
    }

    .profile-role {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      padding: 0.5rem 1rem;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
    }

    .role-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .profile-role.role-admin {
      background: rgba(124, 58, 237, 0.3);
      border: 1px solid rgba(124, 58, 237, 0.5);
    }

    /* Content */
    .profile-content {
      padding: 1rem;
      padding-top: 290px;
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
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #047857;
    }

    .stat-icon.pending {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #b45309;
    }

    .stat-icon.total {
      background: linear-gradient(135deg, #FFF4E6, #FFE5D9);
      color: #E85A24;
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
      border-bottom: 2px solid #f3f4f6;
    }

    .section-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #FFF4E6, #FFE5D9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #FF6B35;
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
      background: #f9fafb;
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
      color: #FF6B35;
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
      color: #e5e7eb;
    }

    .stars svg.filled {
      color: #fbbf24;
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
      background: #fee2e2;
      color: #b91c1c;
    }

    .status-badge.available {
      background: #d1fae5;
      color: #047857;
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
      background: #f9fafb;
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
      background: linear-gradient(135deg, #FFF4E6, #FFE5D9);
      border: 1px solid #FFD4B8;
      color: #E85A24;
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
      border-bottom: 1px solid #f3f4f6;
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
      background: #fafafa;
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
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      color: #2563eb;
    }

    .menu-icon.requests {
      background: linear-gradient(135deg, #FFF4E6, #FFE5D9);
      color: #FF6B35;
    }

    .menu-icon.reviews {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #b45309;
    }

    .menu-icon.onboarding {
      background: linear-gradient(135deg, #f3e8ff, #e9d5ff);
      color: #7c3aed;
    }

    .menu-icon.logout {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: #dc2626;
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
      color: #dc2626;
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
  `],
})
export class ProfileViewComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly requestsService = inject(RequestsService);
  private readonly router = inject(Router);
  private readonly storage = inject(SecureStorageService);

  readonly user = this.authStore.user;
  readonly stats = signal<RequestStats | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  async loadData(): Promise<void> {
    try {
      await this.profileService.getProfile();
      const stats = await this.requestsService.getStats();
      this.stats.set(stats);
    } catch (err) {
      console.error('Error loading profile:', err);
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

  getInitials(): string {
    const user = this.user();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return 'U';
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
      this.storage.remove('rf_onboarding_completed');
      this.router.navigate(['/onboarding']);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  }

  replayOnboarding(): void {
    this.storage.remove('rf_onboarding_completed');
    this.router.navigate(['/onboarding']);
  }
}

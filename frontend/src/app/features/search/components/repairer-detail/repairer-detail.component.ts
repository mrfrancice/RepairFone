import { Component, inject, signal, OnInit, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { SearchService, Repairer, RepairerReview } from '../../services/search.service';
import { DevicesService, type Device, type ServiceType } from '@app/domains/devices';
import { SearchStore } from '../../stores/search.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ReviewsService, StepRatingStats, RatingCategory } from '@app/domains/reviews';
import { RequestsService, type CreateRequestDto } from '@app/domains/requests';
import { ChatService } from '@app/domains/chat';
import { UiHeaderComponent } from '@app/features/common/components';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { LoggerService } from '../../../../core/services/logger.service';
import { ToastService } from '../../../../core/services/toast.service';
import { formatDistanceKm } from '../../../../shared/utils/format.utils';

interface QualityScore {
  label: string;
  value: number;
  icon: string;
  rawRating?: number; // -5 to 5 scale
}

@Component({
  selector: 'app-repairer-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule, UiHeaderComponent, FormatDatePipe],
  template: `
    <div class="detail-container">
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>
      } @else if (repairer()) {
        <!-- Header with ui-header -->
        <ui-header
          [title]="repairer()?.repairerProfile?.businessName || getRepairerName()"
          [showBack]="true"
          (onBack)="navigateBack()"
          [showProfile]="true"
        >
          <!-- Share button in header-actions -->
          <button header-actions class="share-btn" type="button" aria-label="Partager le profil" (click)="shareProfile()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M4 12V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <polyline points="16,6 12,2 8,6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <line x1="12" y1="2" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- Repairer Hero Info inside header - Balanced layout -->
          <div class="repairer-hero-compact">
            <div class="hero-main">
              <!-- Avatar à gauche -->
              <div class="repairer-avatar">
                @if (repairer()?.avatarUrl) {
                  <img [src]="repairer()?.avatarUrl" [alt]="getRepairerName()" />
                } @else {
                  <div class="avatar-placeholder">
                    {{ getRepairerInitials() }}
                  </div>
                }
                @if (repairer()?.repairerProfile?.isVerified) {
                  <span class="verified-badge">✓</span>
                }
              </div>

              <!-- Rating au centre -->
              <div class="hero-center">
                <div class="hero-rating">
                  <span class="rating-value-big">{{ (repairer()?.repairerProfile?.rating || 0).toFixed(1) }}</span>
                  <div class="rating-stars">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <span class="star" [class.filled]="star <= (repairer()?.repairerProfile?.rating || 0)">★</span>
                    }
                  </div>
                  <span class="review-count">{{ repairer()?.repairerProfile?.reviewCount || 0 }} avis</span>
                </div>
              </div>

              <!-- Status à droite -->
              <div class="hero-right">
                @if (repairer()?.repairerProfile?.isAvailable) {
                  <span class="status-badge available">
                    <span class="status-dot"></span>
                    Disponible
                  </span>
                } @else {
                  <span class="status-badge unavailable">
                    <span class="status-dot"></span>
                    Indisponible
                  </span>
                }
              </div>
            </div>

            <!-- Stats en bas sur toute la largeur -->
            <div class="hero-stats-row">
              <div class="stat-box">
                <span class="stat-value">{{ repairer()?.repairerProfile?.completedRepairs ?? 0 }}</span>
                <span class="stat-label">Réparations</span>
              </div>
              <div class="stat-box">
                @if ((repairer()?.repairerProfile?.yearsOfExperience ?? 0) > 0) {
                  <span class="stat-value">{{ repairer()?.repairerProfile?.yearsOfExperience }} ans</span>
                } @else {
                  <span class="stat-value">Nouveau</span>
                }
                <span class="stat-label">Expérience</span>
              </div>
              <div class="stat-box">
                <span class="stat-value">{{ (+(repairer()?.repairerProfile?.acceptanceRate ?? 0)) | number:'1.0-0' }}%</span>
                <span class="stat-label">Acceptation</span>
              </div>
              @if (repairer()?.repairerProfile?.responseTime && repairer()!.repairerProfile.responseTime! < 30) {
                <div class="stat-box highlight">
                  <span class="stat-value">⚡ {{ repairer()?.repairerProfile?.responseTime }} min</span>
                  <span class="stat-label">Réponse</span>
                </div>
              }
            </div>
          </div>
        </ui-header>

        <!-- Content -->
        <div class="detail-content">
          <!-- 1. Repair Request Form Section (FIRST) -->
          <section class="section request-form-section" id="request-form">
            <div class="section-header">
              <h2>🔧 Demander une réparation</h2>
            </div>

            @if (!repairer()?.repairerProfile?.isAvailable) {
              <!-- Repairer unavailable message -->
              <div class="unavailable-message">
                <span class="unavailable-icon">🚫</span>
                <h3>Réparateur indisponible</h3>
                <p>Ce réparateur n'est pas disponible actuellement. Vous pouvez le contacter ou revenir plus tard.</p>
                <button class="btn btn-secondary" (click)="contactRepairer()">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M18.3334 14.1V16.6C18.3343 16.8321 18.2867 17.0618 18.1937 17.2745C18.1008 17.4871 17.9644 17.678 17.7934 17.8349C17.6224 17.9918 17.4205 18.1113 17.2006 18.1856C16.9808 18.2599 16.7478 18.2876 16.5167 18.2667C13.9522 17.9881 11.489 17.1118 9.32506 15.7083C7.31151 14.4289 5.60443 12.7218 4.32506 10.7083C2.91673 8.53438 2.04007 6.05923 1.76673 3.48334C1.7459 3.25293 1.77336 3.02068 1.84714 2.80139C1.92092 2.58209 2.03963 2.38063 2.19562 2.20983C2.35162 2.03902 2.54145 1.90258 2.75314 1.80929C2.96483 1.716 3.19374 1.66782 3.42506 1.66801H5.92506C6.32949 1.66372 6.72148 1.80619 7.02812 2.06967C7.33476 2.33316 7.53505 2.69957 7.59173 3.10001C7.69721 3.89998 7.89286 4.68564 8.17506 5.44168C8.28723 5.7399 8.31137 6.06414 8.24495 6.37576C8.17852 6.68738 8.02421 6.97348 7.80006 7.20001L6.74173 8.25834C7.92795 10.3446 9.65549 12.0721 11.7417 13.2583L12.8001 12.2C13.0266 11.9759 13.3127 11.8215 13.6243 11.7551C13.936 11.6887 14.2602 11.7128 14.5584 11.825C15.3145 12.1072 16.1001 12.3029 16.9001 12.4083C17.3049 12.4656 17.6745 12.6695 17.9388 12.9813C18.203 13.2932 18.3436 13.6914 18.3334 14.1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  Contacter le réparateur
                </button>
              </div>
            } @else if (!authStore.isAuthenticated()) {
              <!-- Login required message -->
              <div class="login-required-message">
                <span class="login-icon">🔐</span>
                <h3>Connexion requise</h3>
                <p>Connectez-vous pour envoyer une demande de réparation à ce réparateur.</p>
                <div class="login-actions">
                  <button class="btn btn-primary" (click)="goToLogin()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M15 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <polyline points="10,17 15,12 10,7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      <line x1="15" y1="12" x2="3" y2="12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Se connecter
                  </button>
                  <button class="btn btn-secondary" (click)="goToRegister()">
                    Créer un compte
                  </button>
                </div>
                <p class="login-hint">Pas encore de compte ? L'inscription est gratuite et rapide.</p>
              </div>
            } @else if (!showConfirmation()) {
              <!-- Step 1: Device Selection -->
              <div class="search-step" [class.completed]="currentStep() > 1">
                <div class="step-header">
                  <span class="step-indicator" [class.active]="currentStep() === 1">
                    @if (currentStep() > 1) {
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    } @else {
                      1
                    }
                  </span>
                  <h3>Type d'appareil</h3>
                </div>

                @if (currentStep() === 1) {
                  <div class="category-grid">
                    @for (cat of categories(); track cat) {
                      <button
                        type="button"
                        class="category-btn"
                        [class.active]="selectedCategory() === cat"
                        (click)="selectCategory(cat)"
                      >
                        <span class="category-icon">{{ getCategoryIcon(cat) }}</span>
                        <span class="category-label">{{ getCategoryLabel(cat) }}</span>
                      </button>
                    }
                  </div>

                  <!-- Brand Selection -->
                  @if (selectedCategory() && brands().length > 0) {
                    <div class="brand-section">
                      <label class="section-label">Marque</label>
                      @if (isLoadingBrands()) {
                        <div class="loading-inline">Chargement...</div>
                      } @else {
                        <div class="brand-grid">
                          @for (brand of brands(); track brand) {
                            <button
                              type="button"
                              class="brand-btn"
                              [class.active]="selectedBrand() === brand"
                              (click)="selectBrand(brand)"
                            >
                              <span class="brand-icon">{{ getBrandIcon(brand) }}</span>
                              <span>{{ brand }}</span>
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }

                  <!-- Model Selection -->
                  @if (selectedBrand() && devices().length > 0) {
                    <div class="device-section">
                      <label class="section-label">Modèle</label>
                      @if (isLoadingModels()) {
                        <div class="loading-inline">Chargement...</div>
                      } @else {
                        <div class="device-list">
                          @for (device of devices(); track device.id) {
                            <button
                              type="button"
                              class="device-btn"
                              [class.active]="selectedDevice()?.id === device.id"
                              (click)="selectDeviceDirectly(device)"
                            >
                              <span class="device-name">{{ device.brand }} {{ device.model }}</span>
                              @if (selectedDevice()?.id === device.id) {
                                <span class="check">✓</span>
                              }
                            </button>
                          }
                        </div>
                      }
                    </div>
                  }

                  <div class="form-actions">
                    <button
                      class="btn btn-primary btn-block btn-large"
                      [disabled]="!selectedDevice()"
                      (click)="nextStep()"
                    >
                      Continuer
                    </button>
                  </div>
                } @else {
                  <!-- Collapsed view -->
                  <div class="step-summary" (click)="goToStep(1)">
                    <span class="summary-icon">{{ getCategoryIcon(selectedCategory() || '') }}</span>
                    <span class="summary-text">{{ selectedDevice()?.brand }} {{ selectedDevice()?.model }}</span>
                    <button class="btn-text">Modifier</button>
                  </div>
                }
              </div>

              <!-- Step 2: Service Selection -->
              @if (currentStep() >= 2) {
                <div class="search-step" [class.completed]="currentStep() > 2" [class.disabled]="currentStep() < 2">
                  <div class="step-header">
                    <span class="step-indicator" [class.active]="currentStep() === 2">
                      @if (currentStep() > 2) {
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                      } @else {
                        2
                      }
                    </span>
                    <h3>Problème rencontré</h3>
                  </div>

                  @if (currentStep() === 2) {
                    @if (isLoadingServices()) {
                      <div class="loading-inline">Chargement des services...</div>
                    } @else {
                      <div class="problems-list">
                        @for (service of formServiceTypes(); track service.id) {
                          <button
                            type="button"
                            class="problem-btn"
                            [class.active]="formSelectedService()?.id === service.id"
                            (click)="selectFormService(service)"
                          >
                            <span class="problem-icon">🔧</span>
                            <div class="problem-info">
                              <span class="problem-name">{{ service.name }}</span>
                              @if (service.basePrice) {
                                <span class="problem-price">{{ service.basePrice | number }} FCFA</span>
                              }
                            </div>
                            @if (formSelectedService()?.id === service.id) {
                              <span class="check">✓</span>
                            }
                          </button>
                        }
                      </div>

                      <!-- Problem Description -->
                      <div class="other-problem-input">
                        <textarea
                          [(ngModel)]="problemDescription"
                          placeholder="Décrivez votre problème (optionnel)..."
                          rows="3"
                        ></textarea>
                      </div>
                    }

                    <div class="form-actions">
                      <button class="btn btn-secondary" (click)="prevStep()">Retour</button>
                      <button
                        class="btn btn-primary btn-large"
                        [disabled]="!formSelectedService()"
                        (click)="nextStep()"
                      >
                        Continuer
                      </button>
                    </div>
                  } @else if (currentStep() > 2) {
                    <!-- Collapsed view -->
                    <div class="step-summary" (click)="goToStep(2)">
                      <span class="summary-icon">🔧</span>
                      <span class="summary-text">{{ formSelectedService()?.name }}</span>
                      <button class="btn-text">Modifier</button>
                    </div>
                  }
                </div>
              }

              <!-- Step 3: Delivery Mode -->
              @if (currentStep() >= 3) {
                <div class="search-step">
                  <div class="step-header">
                    <span class="step-indicator" [class.active]="currentStep() === 3">3</span>
                    <h3>Mode de service</h3>
                  </div>

                  <div class="service-mode-grid">
                    <button
                      type="button"
                      class="service-mode-btn"
                      [class.active]="deliveryMode() === 'in_shop'"
                      (click)="deliveryMode.set('in_shop')"
                    >
                      <span class="mode-icon">🏪</span>
                      <span class="mode-label">En boutique</span>
                      <span class="mode-desc">Je me déplace</span>
                    </button>
                    <button
                      type="button"
                      class="service-mode-btn"
                      [class.active]="deliveryMode() === 'at_home'"
                      (click)="deliveryMode.set('at_home')"
                    >
                      <span class="mode-icon">🏠</span>
                      <span class="mode-label">À domicile</span>
                      <span class="mode-desc">Le réparateur vient</span>
                    </button>
                  </div>

                  <!-- Urgency -->
                  <div class="urgency-section">
                    <label class="section-label">Urgence</label>
                    <div class="service-mode-grid">
                      <button
                        type="button"
                        class="service-mode-btn"
                        [class.active]="urgencyLevel() === 'normal'"
                        (click)="urgencyLevel.set('normal')"
                      >
                        <span class="mode-icon">🕐</span>
                        <span class="mode-label">Normal</span>
                      </button>
                      <button
                        type="button"
                        class="service-mode-btn express-mode"
                        [class.active]="urgencyLevel() === 'express'"
                        (click)="urgencyLevel.set('express')"
                      >
                        <span class="mode-icon">⚡</span>
                        <span class="mode-label">Express</span>
                        <span class="mode-desc">+30%</span>
                      </button>
                    </div>
                  </div>

                  <!-- Price Suggestion -->
                  @if (formSelectedService()) {
                    <div class="price-suggestion">
                      <span class="suggestion-icon">💡</span>
                      <div class="suggestion-content">
                        <span class="suggestion-label">Prix estimé</span>
                        <span class="suggestion-price">
                          {{ formSelectedService()!.name }} : {{ getTotalPrice() | number }} FCFA
                        </span>
                      </div>
                    </div>
                  }

                  <div class="form-actions">
                    <button class="btn btn-secondary" (click)="prevStep()">Retour</button>
                    <button
                      class="btn btn-primary btn-large"
                      [disabled]="!deliveryMode()"
                      (click)="showRequestConfirmation()"
                    >
                      Voir le récapitulatif
                    </button>
                  </div>
                </div>
              }
            } @else {
              <!-- Confirmation View -->
              <div class="confirmation-view">
                <div class="confirmation-header">
                  <span class="confirmation-icon">📋</span>
                  <h3>Récapitulatif de votre demande</h3>
                </div>

                <div class="recap-card">
                  <div class="recap-item">
                    <span class="recap-label">Réparateur</span>
                    <span class="recap-value">{{ repairer()?.repairerProfile?.businessName || getRepairerName() }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Appareil</span>
                    <span class="recap-value">{{ selectedDevice()?.brand }} {{ selectedDevice()?.model }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Service</span>
                    <span class="recap-value">{{ formSelectedService()?.name }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Mode</span>
                    <span class="recap-value">{{ getDeliveryModeLabel(deliveryMode()) }}</span>
                  </div>
                  <div class="recap-item">
                    <span class="recap-label">Urgence</span>
                    <span class="recap-value" [class.express]="urgencyLevel() === 'express'">
                      {{ urgencyLevel() === 'express' ? '⚡ Express' : '🕐 Normal' }}
                    </span>
                  </div>
                  @if (problemDescription) {
                    <div class="recap-item description">
                      <span class="recap-label">Description</span>
                      <span class="recap-value">{{ problemDescription }}</span>
                    </div>
                  }
                </div>

                <div class="price-summary">
                  <div class="price-row">
                    <span>Prix estimé</span>
                    <span class="price-value">{{ formSelectedService()?.basePrice | number }} FCFA</span>
                  </div>
                  @if (urgencyLevel() === 'express') {
                    <div class="price-row supplement">
                      <span>Supplément express (+30%)</span>
                      <span class="price-value">{{ (formSelectedService()?.basePrice || 0) * 0.3 | number }} FCFA</span>
                    </div>
                    <div class="price-row total">
                      <span>Total estimé</span>
                      <span class="price-value">{{ getTotalPrice() | number }} FCFA</span>
                    </div>
                  }
                </div>

                <p class="price-note">
                  * Le prix final sera confirmé par le réparateur après diagnostic
                </p>

                <div class="form-actions confirmation-actions">
                  <button class="btn btn-secondary" (click)="editRequest()">Modifier</button>
                  <button
                    class="btn btn-primary"
                    [disabled]="isSubmitting()"
                    (click)="submitRequest()"
                  >
                    @if (isSubmitting()) {
                      Envoi en cours...
                    } @else {
                      Envoyer la demande
                    }
                  </button>
                </div>
              </div>
            }
          </section>

          <!-- 2. Gallery Section (hidden from step 2) -->
          @if (galleryPhotos().length > 0 && currentStep() === 1 && !showConfirmation()) {
            <section class="section gallery-section">
              <h2>Photos de l'atelier</h2>
              <div class="gallery-scroll">
                @for (photo of galleryPhotos(); track photo; let i = $index) {
                  <button
                    class="gallery-item"
                    type="button"
                    [attr.aria-label]="'Ouvrir la photo ' + (i + 1) + ' sur ' + galleryPhotos().length"
                    (click)="openGallery(i)"
                  >
                    <img [src]="photo" [alt]="'Photo atelier ' + (i + 1)" />
                  </button>
                }
              </div>
            </section>
          }

          <!-- 3. Location & Zone d'intervention -->
          @if (repairer()?.repairerProfile?.address) {
            <section class="section">
              <h2>Zone d'intervention</h2>
              <div class="location-info">
                <div class="address-row">
                  <span class="icon">📍</span>
                  <span>{{ repairer()?.repairerProfile?.address }}</span>
                </div>
                @if ((+(repairer()?.repairerProfile?.serviceRadius ?? 0)) > 0) {
                  <div class="radius-info">
                    <span class="icon">🎯</span>
                    <span>Intervient dans un rayon de {{ (+(repairer()?.repairerProfile?.serviceRadius ?? 0)) | number:'1.0-0' }} km</span>
                  </div>
                }
                @if (repairer()?.distance !== undefined) {
                  <div class="distance-info">
                    <span class="icon">🚶</span>
                    <span>À {{ formatDistance(repairer()!.distance!) }} de vous</span>
                  </div>
                }
              </div>
              <!-- Map button -->
              <button class="map-placeholder" (click)="openMap()">
                <div class="map-marker">📍</div>
                <span>Voir sur la carte</span>
                <svg class="map-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </section>
          }

          <!-- 4. Quality Scores (Step Ratings) - hidden from step 2 -->
          @if (currentStep() === 1 && !showConfirmation()) {
            <section class="section">
              <div class="section-header">
                <h2>Score qualité</h2>
                @if (stepRatingStats()?.overall?.count) {
                  <span class="rating-count-badge">{{ stepRatingStats()?.overall?.count }} notes</span>
                }
              </div>

              @if (stepRatingStats()?.overall?.count) {
                <!-- Overall Score -->
                <div class="overall-score-card">
                  <div class="overall-value" [style.color]="reviewsService.getStepRatingColor(stepRatingStats()?.overall?.average || 0)">
                    {{ reviewsService.formatStepRating(Math.round(stepRatingStats()?.overall?.average || 0)) }}
                  </div>
                  <div class="overall-info">
                    <span class="overall-label">Score global</span>
                    <span class="overall-desc">{{ reviewsService.getStepRatingLabel(stepRatingStats()?.overall?.average || 0) }}</span>
                  </div>
                </div>

                <!-- Category Scores -->
                <div class="quality-scores">
                  @for (score of qualityScores(); track score.label) {
                    <div class="quality-item">
                      <div class="quality-header">
                        <span class="quality-icon">{{ score.icon }}</span>
                        <span class="quality-label">{{ score.label }}</span>
                      </div>
                      <div class="quality-bar-container">
                        <div class="quality-bar">
                          <div
                            class="quality-fill"
                            [style.width.%]="score.value"
                            [style.background]="getQualityBarGradient(score.rawRating || 0)"
                          ></div>
                        </div>
                      </div>
                      <span
                        class="quality-value"
                        [style.color]="reviewsService.getStepRatingColor(score.rawRating || 0)"
                      >
                        {{ reviewsService.formatStepRating(score.rawRating || 0) }}
                      </span>
                    </div>
                  }
                </div>
              } @else {
                <div class="no-ratings-message">
                  <span class="no-ratings-icon">📊</span>
                  <p>Pas encore de notes pour ce réparateur</p>
                </div>
              }
            </section>
          }

          <!-- Description - hidden from step 2 -->
          @if (repairer()?.repairerProfile?.description && currentStep() === 1 && !showConfirmation()) {
            <section class="section">
              <h2>À propos</h2>
              <p class="description">{{ repairer()?.repairerProfile?.description }}</p>
            </section>
          }

          <!-- Specialties -->
          @if (repairer()?.repairerProfile?.specialties?.length) {
            <section class="section">
              <h2>Spécialités</h2>
              <div class="specialties-list">
                @for (specialty of repairer()?.repairerProfile?.specialties || []; track specialty) {
                  <span class="specialty-chip">{{ specialty }}</span>
                }
              </div>
            </section>
          }

          <!-- Pricing -->
          <section class="section">
            <h2>Prix indicatifs</h2>
            @if (serviceTypes().length > 0) {
              <div class="services-list">
                @for (service of serviceTypes(); track service.id) {
                  <div
                    class="service-item"
                    [class.selected]="selectedService()?.id === service.id"
                    (click)="selectService(service)"
                  >
                    <div class="service-info">
                      <span class="service-name">{{ service.name }}</span>
                      @if (service.description) {
                        <span class="service-desc">{{ service.description }}</span>
                      }
                    </div>
                    <div class="service-meta">
                      <span class="service-price">{{ service.basePrice | number }} FCFA</span>
                      <span class="service-duration">~{{ service.estimatedDuration }} min</span>
                    </div>
                    @if (selectedService()?.id === service.id) {
                      <span class="service-check">✓</span>
                    }
                  </div>
                }
              </div>
            } @else {
              <p class="no-services">Sélectionnez un appareil pour voir les tarifs</p>
            }
          </section>

          <!-- Reviews - hidden from step 2 -->
          @if (currentStep() === 1 && !showConfirmation()) {
            <section class="section">
              <div class="section-header">
                <h2>Avis clients</h2>
                @if (reviews().length > 0) {
                  <span class="review-summary">{{ reviews().length }} avis</span>
                }
              </div>

              @if (reviews().length > 0) {
                <div class="reviews-list">
                  @for (review of reviews().slice(0, showAllReviews() ? 999 : 3); track review.id) {
                    <div class="review-item">
                      <div class="review-header">
                        <div class="reviewer-info">
                          <div class="reviewer-avatar">
                            {{ review.client.firstName?.[0] || 'C' }}
                          </div>
                          <span class="reviewer-name">
                            {{ review.client.firstName || 'Client' }}
                          </span>
                        </div>
                        <div class="review-rating">
                          @for (star of [1, 2, 3, 4, 5]; track star) {
                            <span class="star-small" [class.filled]="star <= review.rating">★</span>
                          }
                        </div>
                      </div>
                      @if (review.comment) {
                        <p class="review-comment">{{ review.comment }}</p>
                      }
                      <span class="review-date">{{ review.createdAt | formatDate }}</span>
                    </div>
                  }
                </div>

                @if (reviews().length > 3 && !showAllReviews()) {
                  <button class="btn-show-more" (click)="showAllReviews.set(true)">
                    Voir tous les avis ({{ reviews().length }})
                  </button>
                }
              } @else {
                <p class="no-reviews">Aucun avis pour le moment</p>
              }
            </section>
          }
        </div>

        <!-- Footer CTA -->
        <footer class="detail-footer">
          <div class="footer-content">
            @if (formSelectedService()) {
              <div class="selected-service-info">
                <span class="service-label">{{ formSelectedService()?.name }}</span>
                <span class="service-price">{{ getTotalPrice() | number }} FCFA</span>
              </div>
            } @else if (selectedDevice()) {
              <div class="selected-service-info">
                <span class="service-label">{{ selectedDevice()?.brand }} {{ selectedDevice()?.model }}</span>
                <span class="service-hint">Sélectionnez un service</span>
              </div>
            }

            <div class="footer-actions">
              <button class="btn btn-secondary" (click)="contactRepairer()">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M18.3334 14.1V16.6C18.3343 16.8321 18.2867 17.0618 18.1937 17.2745C18.1008 17.4871 17.9644 17.678 17.7934 17.8349C17.6224 17.9918 17.4205 18.1113 17.2006 18.1856C16.9808 18.2599 16.7478 18.2876 16.5167 18.2667C13.9522 17.9881 11.489 17.1118 9.32506 15.7083C7.31151 14.4289 5.60443 12.7218 4.32506 10.7083C2.91673 8.53438 2.04007 6.05923 1.76673 3.48334C1.7459 3.25293 1.77336 3.02068 1.84714 2.80139C1.92092 2.58209 2.03963 2.38063 2.19562 2.20983C2.35162 2.03902 2.54145 1.90258 2.75314 1.80929C2.96483 1.716 3.19374 1.66782 3.42506 1.66801H5.92506C6.32949 1.66372 6.72148 1.80619 7.02812 2.06967C7.33476 2.33316 7.53505 2.69957 7.59173 3.10001C7.69721 3.89998 7.89286 4.68564 8.17506 5.44168C8.28723 5.7399 8.31137 6.06414 8.24495 6.37576C8.17852 6.68738 8.02421 6.97348 7.80006 7.20001L6.74173 8.25834C7.92795 10.3446 9.65549 12.0721 11.7417 13.2583L12.8001 12.2C13.0266 11.9759 13.3127 11.8215 13.6243 11.7551C13.936 11.6887 14.2602 11.7128 14.5584 11.825C15.3145 12.1072 16.1001 12.3029 16.9001 12.4083C17.3049 12.4656 17.6745 12.6695 17.9388 12.9813C18.203 13.2932 18.3436 13.6914 18.3334 14.1Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Contacter
              </button>
              <button
                class="btn btn-primary"
                (click)="authStore.isAuthenticated() ? scrollToRequestForm() : goToLogin()"
                [disabled]="!repairer()?.repairerProfile?.isAvailable"
              >
                @if (!repairer()?.repairerProfile?.isAvailable) {
                  Indisponible
                } @else if (!authStore.isAuthenticated()) {
                  Se connecter
                } @else if (showConfirmation()) {
                  Voir le récapitulatif
                } @else if (currentStep() > 1) {
                  Continuer la demande
                } @else {
                  Faire une demande
                }
              </button>
            </div>
          </div>
        </footer>

        <!-- Gallery Modal -->
        @if (showGalleryModal()) {
          <div class="gallery-modal" (click)="closeGallery()">
            <button class="modal-close" (click)="closeGallery()">×</button>
            <button class="modal-nav prev" (click)="prevPhoto($event)">&lt;</button>
            <img [src]="galleryPhotos()[currentPhotoIndex()]" alt="Photo" (click)="$event.stopPropagation()" />
            <button class="modal-nav next" (click)="nextPhoto($event)">&gt;</button>
            <span class="modal-counter">{{ currentPhotoIndex() + 1 }} / {{ galleryPhotos().length }}</span>
          </div>
        }
      } @else {
        <div class="error-state">
          <p>Réparateur non trouvé</p>
          <button class="btn btn-primary" routerLink="/search">Retour à la recherche</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container {
      min-height: 100vh;
      background: #FAFAFA;
      padding-bottom: 200px; /* Space for footer + bottom nav */
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #EEEEEE;
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Share button in header */
    .share-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
    }

    .share-btn:hover {
      background: rgba(255, 255, 255, 0.25);
      transform: scale(1.05);
    }

    /* Repairer Hero Compact - Balanced layout inside ui-header */
    .repairer-hero-compact {
      padding: 0.5rem 0;
      color: white;
    }

    .hero-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .repairer-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .repairer-avatar img,
    .avatar-placeholder {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .avatar-placeholder {
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.25rem;
    }

    .verified-badge {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 20px;
      height: 20px;
      background: #1565C0;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 700;
      border: 2px solid white;
    }

    /* Centre - Rating */
    .hero-center {
      flex: 1;
      text-align: center;
    }

    .hero-rating {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.125rem;
    }

    .rating-value-big {
      font-size: 1.75rem;
      font-weight: 800;
      line-height: 1;
    }

    .rating-stars {
      display: flex;
      gap: 2px;
    }

    .star {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.3);
    }

    .star.filled {
      color: var(--color-mustard, #FFC107);
    }

    .review-count {
      font-size: 0.6875rem;
      opacity: 0.75;
    }

    /* Droite - Status */
    .hero-right {
      flex-shrink: 0;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.available {
      background: rgba(76, 175, 80, 0.25);
      border: 1px solid rgba(76, 175, 80, 0.4);
    }

    .status-badge.unavailable {
      background: rgba(244, 67, 54, 0.25);
      border: 1px solid rgba(244, 67, 54, 0.4);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .status-badge.available .status-dot {
      background: #4CAF50;
    }

    .status-badge.unavailable .status-dot {
      background: var(--color-error, #F44336);
      animation: none;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Stats Row - full width */
    .hero-stats-row {
      display: flex;
      justify-content: space-around;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 0.5rem 0.25rem;
    }

    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0 0.5rem;
    }

    .stat-box .stat-value {
      font-size: 0.9375rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .stat-box .stat-label {
      font-size: 0.625rem;
      opacity: 0.75;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .stat-box.highlight {
      color: var(--color-mustard, #FFC107);
    }

    .stat-box.highlight .stat-label {
      opacity: 0.9;
    }

    .detail-content {
      padding: 1rem;
      padding-top: 260px; /* Space for fixed ui-header with balanced repairer hero */
    }

    .section {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.75rem;
    }

    .review-summary {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .description {
      color: #4b5563;
      line-height: 1.6;
    }

    /* Gallery */
    .gallery-section {
      overflow: hidden;
    }

    .gallery-scroll {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      margin: 0 -1.25rem;
      padding: 0 1.25rem;
    }

    .gallery-item {
      flex-shrink: 0;
      width: 140px;
      height: 100px;
      border-radius: 12px;
      overflow: hidden;
      border: none;
      padding: 0;
      cursor: pointer;
    }

    .gallery-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* Quality Scores */
    .rating-count-badge {
      font-size: 0.75rem;
      color: #6b7280;
      background: #F5F5F5;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
    }

    .overall-score-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #E8F5E9 0%, #dcfce7 100%);
      border-radius: 12px;
      margin-bottom: 1rem;
      border: 1px solid #bbf7d0;
    }

    .overall-value {
      font-size: 2.5rem;
      font-weight: 800;
      min-width: 70px;
      text-align: center;
    }

    .overall-info {
      display: flex;
      flex-direction: column;
    }

    .overall-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .overall-desc {
      font-weight: 600;
      color: #1f2937;
    }

    .quality-scores {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .quality-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .quality-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 120px;
    }

    .quality-icon {
      font-size: 1.25rem;
    }

    .quality-label {
      font-size: 0.875rem;
      color: #4b5563;
    }

    .quality-bar-container {
      flex: 1;
    }

    .quality-bar {
      height: 10px;
      background: #EEEEEE;
      border-radius: 5px;
      overflow: hidden;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .quality-fill {
      height: 100%;
      border-radius: 5px;
      transition: width 0.5s ease;
    }

    .quality-value {
      font-weight: 700;
      min-width: 45px;
      text-align: right;
      font-size: 0.9375rem;
    }

    .no-ratings-message {
      text-align: center;
      padding: 1.5rem;
      color: #6b7280;
    }

    .no-ratings-icon {
      font-size: 2rem;
      display: block;
      margin-bottom: 0.5rem;
    }

    .no-ratings-message p {
      margin: 0;
      font-size: 0.875rem;
    }

    /* Specialties */
    .specialties-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .specialty-chip {
      background: linear-gradient(135deg, #FFF3E0 0%, #FFE8CC 100%);
      color: var(--color-primary-500, #FF9800);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      border: 1px solid rgba(255, 152, 0, 0.2);
      box-shadow: 0 2px 4px rgba(255, 152, 0, 0.1);
    }

    /* Location */
    .location-info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .address-row, .radius-info, .distance-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #4b5563;
    }

    .icon {
      font-size: 1.125rem;
    }

    .map-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 120px;
      background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
      border: 2px solid var(--color-ocean, #1565C0);
      border-radius: 12px;
      color: #0369a1;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
    }

    .map-placeholder:hover {
      background: linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }

    .map-placeholder:active {
      transform: translateY(0);
    }

    .map-marker {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .map-placeholder span {
      font-weight: 600;
    }

    .map-arrow {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #0369a1;
    }

    /* Services */
    .services-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .service-item {
      display: flex;
      align-items: center;
      padding: 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .service-item:hover {
      border-color: var(--color-primary-500, #FF9800);
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.15);
    }

    .service-item.selected {
      border-color: var(--color-primary-500, #FF9800);
      background: linear-gradient(135deg, #FFF3E0 0%, #FFE8CC 100%);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
    }

    .service-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .service-name {
      font-weight: 500;
      color: #1f2937;
    }

    .service-desc {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .service-meta {
      text-align: right;
      margin-right: 0.5rem;
    }

    .service-price {
      display: block;
      font-weight: 700;
      color: #4CAF50;
      font-size: 1rem;
    }

    .service-duration {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
    }

    .service-check {
      width: 28px;
      height: 28px;
      background: #4CAF50;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      box-shadow: 0 2px 6px rgba(76, 175, 80, 0.3);
    }

    .no-services, .no-reviews {
      color: #6b7280;
      text-align: center;
      padding: 1rem 0;
    }

    /* Reviews */
    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .review-item {
      padding-bottom: 1rem;
      border-bottom: 1px solid #EEEEEE;
    }

    .review-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .reviewer-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .reviewer-avatar {
      width: 32px;
      height: 32px;
      background: #EEEEEE;
      color: #6b7280;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .reviewer-name {
      font-weight: 500;
      color: #1f2937;
    }

    .review-rating {
      display: flex;
    }

    .star-small {
      font-size: 0.875rem;
      color: #EEEEEE;
    }

    .star-small.filled {
      color: var(--color-mustard, #FFC107);
    }

    .review-comment {
      color: #4b5563;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    .review-date {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .btn-show-more {
      background: none;
      border: none;
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
      cursor: pointer;
      padding: 0.75rem;
      width: 100%;
      margin-top: 0.5rem;
      transition: all 0.2s;
      border-radius: 12px;
    }

    .btn-show-more:hover {
      background: #FFF3E0;
      color: var(--color-primary-900, #E65100);
    }

    /* Footer */
    .detail-footer {
      position: fixed;
      bottom: 70px; /* Above bottom navigation */
      left: 0;
      right: 0;
      background: white;
      padding: 1rem;
      box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
      border-top: 1px solid #EEEEEE;
      z-index: 50;
    }

    .footer-content {
      max-width: 540px;
      margin: 0 auto;
    }

    .selected-service-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #FFF3E0 0%, #FFE8CC 100%);
      border-radius: 12px;
      border: 1px solid rgba(255, 152, 0, 0.2);
    }

    .service-label {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.9375rem;
    }

    .selected-service-info .service-price {
      font-weight: 700;
      color: var(--color-primary-500, #FF9800);
      font-size: 1rem;
    }

    .selected-service-info .service-hint {
      font-size: 0.75rem;
      color: #6b7280;
      font-style: italic;
    }

    .footer-actions {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 0.75rem;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 1rem;
      border-radius: 14px;
      font-weight: 600;
      font-size: 0.9375rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 54px;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      color: white;
      box-shadow: 0 4px 16px rgba(255, 152, 0, 0.35);
      font-weight: 700;
      font-size: 1rem;
      letter-spacing: 0.3px;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--color-primary-900, #E65100) 0%, #F57C00 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 152, 0, 0.45);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
    }

    .btn-primary:disabled {
      background: #D1D5DB;
      color: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-secondary {
      background: white;
      color: var(--color-primary-500, #FF9800);
      border: 2px solid var(--color-primary-500, #FF9800);
      font-weight: 600;
    }

    .btn-secondary:hover {
      background: linear-gradient(135deg, #FFF3E0 0%, #FFE8CC 100%);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.15);
    }

    .btn-secondary svg {
      flex-shrink: 0;
    }

    /* Gallery Modal */
    .gallery-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .gallery-modal img {
      max-width: 90%;
      max-height: 80vh;
      object-fit: contain;
    }

    .modal-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      color: white;
      font-size: 2rem;
      cursor: pointer;
    }

    .modal-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .modal-nav.prev { left: 1rem; }
    .modal-nav.next { right: 1rem; }

    .modal-counter {
      position: absolute;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 0.875rem;
    }

    /* Request Form Section */
    .request-form-section {
      background: linear-gradient(135deg, #FFF9F5 0%, #FFF4ED 100%);
      border: 2px solid rgba(255, 152, 0, 0.15);
    }

    .request-form-section h2 {
      color: var(--color-primary-500, #FF9800);
    }

    /* Unavailable Message */
    .unavailable-message {
      text-align: center;
      padding: 2rem 1rem;
    }

    .unavailable-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .unavailable-message h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-error, #F44336);
      margin: 0 0 0.5rem;
    }

    .unavailable-message p {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }

    .unavailable-message .btn {
      display: inline-flex;
    }

    /* Login Required Message */
    .login-required-message {
      text-align: center;
      padding: 2rem 1rem;
    }

    .login-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .login-required-message h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.5rem;
    }

    .login-required-message p {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 1.5rem;
      line-height: 1.5;
    }

    .login-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .login-actions .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .login-hint {
      font-size: 0.75rem;
      color: #9ca3af;
      margin: 0;
    }

    /* Search Step - matching /search page */
    .search-step {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #F5F5F5;
    }

    .search-step:last-of-type {
      border-bottom: none;
    }

    .search-step.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .search-step.completed .step-indicator {
      background: var(--color-secondary, #4CAF50);
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .step-header h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .step-indicator {
      width: 28px;
      height: 28px;
      background: #EEEEEE;
      color: #6b7280;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 0.3s;
    }

    .step-indicator.active {
      background: var(--color-primary-500, #FF9800);
      color: white;
    }

    .step-indicator svg {
      color: white;
    }

    /* Category Grid */
    .category-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .category-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 1rem 0.5rem;
      background: #FAFAFA;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .category-btn:hover:not(:disabled) {
      border-color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
      transform: translateY(-2px);
    }

    .category-btn.active {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      border-color: var(--color-primary-500, #FF9800);
      color: white;
    }

    .category-btn.active .category-label {
      color: white;
    }

    .category-btn:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .category-icon {
      font-size: 1.75rem;
    }

    .category-label {
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
    }

    /* Section Label */
    .section-label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin: 1rem 0 0.5rem;
      font-size: 0.875rem;
    }

    /* Brand Section */
    .brand-section {
      margin-top: 1rem;
    }

    .brand-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .brand-btn {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      background: #FAFAFA;
      border: 1px solid #EEEEEE;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
      color: #1f2937;
    }

    .brand-btn:hover {
      border-color: var(--color-primary-500, #FF9800);
      transform: translateY(-1px);
    }

    .brand-btn.active {
      background: #FFF3E0;
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
    }

    .brand-icon {
      font-size: 1rem;
    }

    /* Device Section */
    .device-section {
      margin-top: 1rem;
    }

    .device-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .device-btn {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: #FAFAFA;
      border: 1px solid #EEEEEE;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .device-btn:hover {
      border-color: var(--color-primary-500, #FF9800);
      transform: translateX(4px);
    }

    .device-btn.active {
      background: #FFF3E0;
      border-color: var(--color-primary-500, #FF9800);
    }

    .device-name {
      font-weight: 500;
      color: #1f2937;
    }

    .check {
      color: #4CAF50;
      font-weight: 700;
      font-size: 1.125rem;
    }

    /* Problems List */
    .problems-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .problem-btn {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: #FAFAFA;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .problem-btn:hover {
      border-color: var(--color-primary-500, #FF9800);
      transform: translateX(4px);
    }

    .problem-btn.active {
      background: linear-gradient(135deg, #FFF3E0 0%, #FFE8CC 100%);
      border-color: var(--color-primary-500, #FF9800);
      border-width: 2px;
    }

    .problem-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .problem-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .problem-name {
      font-weight: 500;
      color: #1f2937;
    }

    .problem-price {
      font-size: 0.75rem;
      color: #4CAF50;
      font-weight: 600;
      background: rgba(76, 175, 80, 0.1);
      padding: 0.125rem 0.5rem;
      border-radius: 12px;
      display: inline-block;
      margin-top: 0.25rem;
    }

    /* Other Problem Input */
    .other-problem-input {
      margin-top: 0.75rem;
    }

    .other-problem-input textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #D1D5DB;
      border-radius: 12px;
      font-size: 1rem;
      resize: vertical;
      font-family: inherit;
    }

    .other-problem-input textarea:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
    }

    /* Service Mode Grid */
    .service-mode-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .service-mode-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 1.25rem 0.75rem;
      background: #FAFAFA;
      border: 2px solid #EEEEEE;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .service-mode-btn:hover {
      border-color: var(--color-primary-500, #FF9800);
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.15);
    }

    .service-mode-btn.active {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      border-color: var(--color-primary-500, #FF9800);
      color: white;
    }

    .service-mode-btn.active .mode-label,
    .service-mode-btn.active .mode-desc {
      color: white;
    }

    .service-mode-btn.express-mode.active {
      background: linear-gradient(135deg, var(--color-mustard, #FFC107) 0%, var(--color-mustard, #FFC107) 100%);
      border-color: var(--color-mustard, #FFC107);
    }

    .mode-icon {
      font-size: 1.75rem;
      margin-bottom: 0.375rem;
    }

    .mode-label {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.9375rem;
    }

    .mode-desc {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.125rem;
    }

    /* Urgency Section */
    .urgency-section {
      margin-top: 1.25rem;
    }

    /* Price Suggestion */
    .price-suggestion {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, #FFF3E0 0%, #FFE8CC 100%);
      border-left: 4px solid #F9A825;
      border-radius: 12px;
      margin-top: 1rem;
    }

    .suggestion-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .suggestion-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .suggestion-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #7C5800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .suggestion-price {
      font-size: 0.875rem;
      color: #5A4200;
      font-weight: 500;
      line-height: 1.4;
    }

    /* Step Summary (collapsed view) */
    .step-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: #E8F5E9;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .step-summary:hover {
      background: #dcfce7;
    }

    .summary-icon {
      font-size: 1.25rem;
    }

    .summary-text {
      flex: 1;
      font-weight: 500;
      color: #166534;
    }

    .btn-text {
      background: none;
      border: none;
      color: var(--color-primary-500, #FF9800);
      font-weight: 500;
      cursor: pointer;
      padding: 0.5rem;
    }

    .btn-text:hover {
      color: var(--color-primary-900, #E65100);
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .form-actions .btn {
      flex: 1;
    }

    .btn-block {
      width: 100%;
    }

    .btn-large {
      padding: 1rem 1.5rem;
      font-size: 1rem;
    }

    /* Loading Inline */
    .loading-inline {
      text-align: center;
      color: #6b7280;
      padding: 1rem;
      font-style: italic;
    }

    /* Confirmation View */
    .confirmation-view {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .confirmation-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .confirmation-icon {
      font-size: 1.5rem;
    }

    .confirmation-header h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .recap-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .recap-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0.75rem 0;
      border-bottom: 1px solid #F5F5F5;
    }

    .recap-item:last-child {
      border-bottom: none;
    }

    .recap-item.description {
      flex-direction: column;
      gap: 0.5rem;
    }

    .recap-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .recap-value {
      font-weight: 600;
      color: #1f2937;
      text-align: right;
    }

    .recap-value.express {
      color: var(--color-mustard, #FFC107);
    }

    .recap-item.description .recap-value {
      text-align: left;
      font-weight: 400;
      font-size: 0.875rem;
    }

    /* Price Summary */
    .price-summary {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 0.75rem;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      color: #4b5563;
    }

    .price-row.supplement {
      color: var(--color-mustard, #FFC107);
      font-size: 0.875rem;
    }

    .price-row.total {
      border-top: 2px solid #EEEEEE;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      font-weight: 700;
      color: #1f2937;
    }

    .price-value {
      font-weight: 600;
    }

    .price-row.total .price-value {
      color: var(--color-primary-500, #FF9800);
      font-size: 1.125rem;
    }

    .price-note {
      font-size: 0.75rem;
      color: #6b7280;
      text-align: center;
      margin-bottom: 1rem;
      font-style: italic;
    }

    .confirmation-actions {
      margin-top: 1rem;
    }
  `],
})
export class RepairerDetailComponent implements OnInit {
  private readonly searchService = inject(SearchService);
  private readonly devicesService = inject(DevicesService);
  private readonly searchStore = inject(SearchStore);
  readonly authStore = inject(AuthStore); // Public for template access
  private readonly requestsService = inject(RequestsService);
  private readonly chatService = inject(ChatService);
  readonly reviewsService = inject(ReviewsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);

  readonly Math = Math; // Expose Math for template

  readonly repairer = signal<Repairer | null>(null);
  readonly serviceTypes = signal<ServiceType[]>([]);
  readonly reviews = signal<RepairerReview[]>([]);
  readonly selectedService = signal<ServiceType | null>(null);
  readonly isLoading = signal(true);
  readonly showAllReviews = signal(false);
  readonly showGalleryModal = signal(false);
  readonly currentPhotoIndex = signal(0);
  readonly stepRatingStats = signal<StepRatingStats | null>(null);

  // Repair Request Form Signals
  readonly currentStep = signal(1);
  readonly showConfirmation = signal(false);
  readonly categories = signal<string[]>(['smartphone', 'computer']);
  readonly selectedCategory = signal<string | null>(null);
  readonly brands = signal<string[]>([]);
  readonly selectedBrand = signal<string | null>(null);
  readonly devices = signal<Device[]>([]);
  readonly selectedDevice = signal<Device | null>(null);
  readonly formServiceTypes = signal<ServiceType[]>([]);
  readonly formSelectedService = signal<ServiceType | null>(null);
  readonly deliveryMode = signal<'in_shop' | 'at_home' | null>(null);
  readonly urgencyLevel = signal<'normal' | 'express'>('normal');
  readonly isLoadingBrands = signal(false);
  readonly isLoadingModels = signal(false);
  readonly isLoadingServices = signal(false);
  readonly isSubmitting = signal(false);
  problemDescription = '';

  readonly galleryPhotos = signal<string[]>([
    'https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400',
    'https://images.unsplash.com/photo-1588508065123-287b28e013da?w=400',
    'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400',
    'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400',
  ]);

  // Computed quality scores based on step rating stats
  readonly qualityScores = computed<QualityScore[]>(() => {
    const stats = this.stepRatingStats();
    if (!stats?.byCategory) {
      return [];
    }

    const categories = [
      { key: RatingCategory.TIMELINESS, label: 'Délais', icon: '⏱️' },
      { key: RatingCategory.QUALITY, label: 'Qualité', icon: '✨' },
      { key: RatingCategory.COMMUNICATION, label: 'Communication', icon: '💬' },
      { key: RatingCategory.PRICE, label: 'Prix', icon: '💰' },
    ];

    return categories.map(cat => {
      const catStats = stats.byCategory[cat.key];
      const rawRating = catStats?.average || 0;
      // Convert -5 to 5 scale to 0-100 percentage for the progress bar
      const value = Math.round(((rawRating + 5) / 10) * 100);

      return {
        label: cat.label,
        icon: cat.icon,
        value,
        rawRating: Math.round(rawRating * 10) / 10,
      };
    });
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRepairer(id);
    }
    this.loadCategories();
  }

  private async loadCategories(): Promise<void> {
    try {
      const categories = await this.devicesService.getDeviceCategories();
      if (categories && categories.length > 0) {
        this.categories.set(categories);
      }
    } catch (err) {
      // Keep default categories ['smartphone', 'computer']
      this.logger.error('RepairerDetailComponent', 'Error loading categories', err);
    }
  }

  async loadRepairer(id: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const [repairer, reviewsResult] = await Promise.all([
        this.searchService.getRepairer(id),
        this.searchService.getRepairerReviews(id),
      ]);

      this.repairer.set(repairer);
      this.reviews.set(reviewsResult.data);

      // Load step rating stats for the repairer
      this.loadStepRatingStats(id);

      // Pre-fill form with SearchStore data if available
      const storeDevice = this.searchStore.selectedDevice();
      if (storeDevice) {
        // Pre-fill device selection
        this.selectedCategory.set(storeDevice.category || 'smartphone');
        this.selectedBrand.set(storeDevice.brand);
        this.selectedDevice.set(storeDevice);

        // Load brands for category
        try {
          const brands = await this.devicesService.getDeviceBrands(storeDevice.category || 'smartphone');
          this.brands.set(brands);
        } catch {
          // Ignore brand loading errors
        }

        // Load devices for brand
        try {
          const result = await this.devicesService.getDevices({
            category: storeDevice.category,
            brand: storeDevice.brand,
          });
          this.devices.set(result.data);
        } catch {
          // Ignore device loading errors
        }

        // Load service types for device
        const services = await this.devicesService.getServiceTypes(storeDevice.id);
        this.serviceTypes.set(services);
        this.formServiceTypes.set(services);

        // Pre-select service if one was chosen in search
        const storeServiceType = this.searchStore.selectedServiceType();
        if (storeServiceType) {
          this.selectedService.set(storeServiceType);
          this.formSelectedService.set(storeServiceType);
          // Move to step 2 or 3 depending on what's selected
          this.currentStep.set(2);
        } else {
          // Device selected, move to step 2
          this.currentStep.set(2);
        }
      }
    } catch (err) {
      this.logger.error('RepairerDetailComponent', 'Error loading repairer', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadStepRatingStats(repairerId: string): Promise<void> {
    try {
      const stats = await this.reviewsService.getRepairerStepRatingStats(repairerId);
      this.stepRatingStats.set(stats);
    } catch (err) {
      // Silently fail - step ratings are optional
      this.logger.error('RepairerDetailComponent', 'Error loading step rating stats', err);
    }
  }

  getQualityBarGradient(rating: number): string {
    // Return a color based on the rating (-5 to 5)
    if (rating >= 3) return 'linear-gradient(90deg, var(--color-secondary, #4CAF50), var(--color-secondary, #4CAF50))';
    if (rating >= 1) return 'linear-gradient(90deg, #84cc16, var(--color-secondary, #4CAF50))';
    if (rating >= -1) return 'linear-gradient(90deg, var(--color-mustard, #FFC107), #eab308)';
    if (rating >= -3) return 'linear-gradient(90deg, #f97316, var(--color-error, #F44336))';
    return 'linear-gradient(90deg, var(--color-error, #F44336), var(--color-terracotta, #C62828))';
  }

  selectService(service: ServiceType): void {
    if (this.selectedService()?.id === service.id) {
      this.selectedService.set(null);
    } else {
      this.selectedService.set(service);
    }
  }

  /**
   * Bouton "Contacter" — Stratégie A (chat only, pas d'appel masqué).
   *
   * Flow :
   *   1. Si non authentifié → /auth/login (avec returnUrl)
   *   2. Si authentifié, on liste les conversations du user et on cherche
   *      celle qui implique ce réparateur.
   *      - Trouvée → /chat/:convId
   *      - Pas trouvée → toast info + /requests/new?repairerId=...
   *        (une demande doit exister pour qu'une conversation soit créée
   *        côté backend — c'est le modèle métier actuel).
   */
  async contactRepairer(): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const repairerId = this.repairer()?.id;
    if (!repairerId) {
      return;
    }

    try {
      const conversations = await this.chatService.getConversations();
      const existing = conversations.find((c) => c.repairer?.id === repairerId);

      if (existing) {
        this.router.navigate(['/chat', existing.id]);
        return;
      }

      this.toast.info(
        'Créez d\'abord une demande pour pouvoir discuter avec ce réparateur.',
      );
      this.router.navigate(['/requests/new'], {
        queryParams: { repairerId },
      });
    } catch (err) {
      this.logger.error('RepairerDetail', 'contactRepairer failed', err);
      this.toast.error('Impossible de joindre le réparateur pour le moment.');
    }
  }

  requestRepair(): void {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const repairerId = this.repairer()?.id;
    const serviceId = this.selectedService()?.id;
    const deviceId = this.searchStore.selectedDevice()?.id;

    if (repairerId) {
      this.router.navigate(['/requests/new'], {
        queryParams: { repairerId, serviceId, deviceId },
      });
    }
  }

  shareProfile(): void {
    if (navigator.share) {
      navigator.share({
        title: this.repairer()?.repairerProfile?.businessName || this.getRepairerName(),
        text: 'Découvrez ce réparateur sur RepairFone',
        url: window.location.href,
      });
    }
  }

  openMap(): void {
    const profile = this.repairer()?.repairerProfile;
    if (!profile) return;

    const lat = profile.latitude;
    const lng = profile.longitude;
    const label = encodeURIComponent(profile.businessName || this.getRepairerName());
    const address = encodeURIComponent(profile.address || '');

    // Try to detect if on mobile for native maps
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    let mapUrl: string;

    if (isMobile) {
      // On mobile, try Google Maps app first (works on Android and iOS)
      // Format: geo:lat,lng?q=lat,lng(label)
      if (/Android/i.test(navigator.userAgent)) {
        mapUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
      } else {
        // iOS - use Apple Maps or Google Maps web
        mapUrl = `maps://maps.apple.com/?q=${label}&ll=${lat},${lng}`;
      }
    } else {
      // Desktop - open Google Maps in new tab
      mapUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}&query_place_id=${label}`;
    }

    // Fallback to Google Maps web if native fails
    const googleMapsWeb = `https://www.google.com/maps?q=${lat},${lng}&z=15`;

    // Try native first, fallback to web
    const win = window.open(mapUrl, '_blank');
    if (!win || win.closed) {
      window.open(googleMapsWeb, '_blank');
    }
  }

  openGallery(index: number): void {
    this.currentPhotoIndex.set(index);
    this.showGalleryModal.set(true);
  }

  closeGallery(): void {
    this.showGalleryModal.set(false);
  }

  prevPhoto(event: Event): void {
    event.stopPropagation();
    const current = this.currentPhotoIndex();
    const total = this.galleryPhotos().length;
    this.currentPhotoIndex.set((current - 1 + total) % total);
  }

  nextPhoto(event: Event): void {
    event.stopPropagation();
    const current = this.currentPhotoIndex();
    const total = this.galleryPhotos().length;
    this.currentPhotoIndex.set((current + 1) % total);
  }

  goBack(): void {
    this.router.navigate(['/search/results']);
  }

  navigateBack(): void {
    // Use browser history to go back to the previous page
    // This ensures correct behavior whether coming from /home or /search
    this.location.back();
  }

  scrollToRequestForm(): void {
    const element = document.getElementById('request-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  goToLogin(): void {
    this.router.navigate(['/auth/login'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  goToRegister(): void {
    this.router.navigate(['/auth/register'], {
      queryParams: { returnUrl: this.router.url },
    });
  }

  getRepairerName(): string {
    const r = this.repairer();
    if (r?.firstName && r?.lastName) {
      return `${r.firstName} ${r.lastName}`;
    }
    return 'Réparateur';
  }

  getRepairerInitials(): string {
    const r = this.repairer();
    if (r?.firstName && r?.lastName) {
      return `${r.firstName[0]}${r.lastName[0]}`.toUpperCase();
    }
    return 'R';
  }

  readonly formatDistance = formatDistanceKm;

  // ==========================================
  // REPAIR REQUEST FORM METHODS
  // ==========================================

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      smartphone: '📱',
      computer: '💻',
      tablet: '📋',
    };
    return icons[category] || '📱';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      smartphone: 'Téléphone',
      computer: 'Ordinateur',
      tablet: 'Tablette',
    };
    return labels[category] || category;
  }

  getBrandIcon(brand: string): string {
    // Return icon based on selected category
    const category = this.selectedCategory();
    if (category === 'computer') {
      return '💻';
    }
    if (category === 'tablet') {
      return '📋';
    }
    // Default to phone icon for smartphones
    return '📱';
  }

  async selectCategory(category: string): Promise<void> {
    this.selectedCategory.set(category);
    this.selectedBrand.set(null);
    this.selectedDevice.set(null);
    this.devices.set([]);

    this.isLoadingBrands.set(true);
    try {
      const brands = await this.devicesService.getDeviceBrands(category);
      this.brands.set(brands);
    } catch (err) {
      this.logger.error('RepairerDetailComponent', 'Error loading brands', err);
      this.brands.set([]);
    } finally {
      this.isLoadingBrands.set(false);
    }
  }

  async selectBrand(brand: string): Promise<void> {
    this.selectedBrand.set(brand);
    this.selectedDevice.set(null);

    this.isLoadingModels.set(true);
    try {
      const result = await this.devicesService.getDevices({
        category: this.selectedCategory() || undefined,
        brand: brand,
      });
      this.devices.set(result.data);
    } catch (err) {
      this.logger.error('RepairerDetailComponent', 'Error loading devices', err);
      this.devices.set([]);
    } finally {
      this.isLoadingModels.set(false);
    }
  }

  selectDevice(deviceId: string): void {
    const device = this.devices().find(d => d.id === deviceId);
    this.selectedDevice.set(device || null);
  }

  selectDeviceDirectly(device: Device): void {
    this.selectedDevice.set(device);
  }

  goToStep(step: number): void {
    this.currentStep.set(step);
  }

  async nextStep(): Promise<void> {
    const current = this.currentStep();

    if (current === 1 && this.selectedDevice()) {
      // Load service types for step 2
      this.isLoadingServices.set(true);
      try {
        const services = await this.devicesService.getServiceTypes(this.selectedDevice()!.id);
        this.formServiceTypes.set(services);
      } catch (err) {
        this.logger.error('RepairerDetailComponent', 'Error loading services', err);
        this.formServiceTypes.set([]);
      } finally {
        this.isLoadingServices.set(false);
      }
      this.currentStep.set(2);
    } else if (current === 2 && this.formSelectedService()) {
      this.currentStep.set(3);
    }
  }

  prevStep(): void {
    const current = this.currentStep();
    if (current > 1) {
      this.currentStep.set(current - 1);
    }
  }

  selectFormService(service: ServiceType): void {
    if (this.formSelectedService()?.id === service.id) {
      this.formSelectedService.set(null);
    } else {
      this.formSelectedService.set(service);
    }
  }

  showRequestConfirmation(): void {
    this.showConfirmation.set(true);
  }

  editRequest(): void {
    this.showConfirmation.set(false);
  }

  getDeliveryModeLabel(mode: string | null): string {
    const labels: Record<string, string> = {
      in_shop: 'En boutique',
      at_home: 'À domicile',
    };
    return mode ? labels[mode] || mode : '';
  }

  getTotalPrice(): number {
    const basePrice = this.formSelectedService()?.basePrice || 0;
    if (this.urgencyLevel() === 'express') {
      return Math.round(basePrice * 1.3);
    }
    return basePrice;
  }

  async submitRequest(): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const repairer = this.repairer();
    const device = this.selectedDevice();
    const service = this.formSelectedService();
    const mode = this.deliveryMode();

    if (!repairer || !device || !service || !mode) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      const dto: CreateRequestDto = {
        repairerId: repairer.id,
        deviceId: device.id,
        serviceTypeId: service.id,
        description: this.problemDescription || `Demande de ${service.name} pour ${device.brand} ${device.model}`,
        deliveryMode: mode,
        urgency: this.urgencyLevel(),
      };

      const result = await this.requestsService.createRequest(dto);

      // Navigate to request detail or success page
      this.router.navigate(['/requests', result.id], {
        queryParams: { success: 'true' },
      });
    } catch (err) {
      this.logger.error('RepairerDetailComponent', 'Error creating request', err);
      alert('Erreur lors de l\'envoi de la demande. Veuillez réessayer.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

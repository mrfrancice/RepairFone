import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SearchService, Repairer } from '../../services/search.service';
import { SearchStore } from '../../stores/search.store';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, UiHeaderComponent],
  template: `
    <div class="results-container">
      <!-- Header -->
      <ui-header
        title="Réparateurs disponibles"
        [subtitle]="store.totalResults() + ' réparateur(s) trouvé(s)'"
        [showBack]="true"
        (onBack)="goBack()"
      >
        <button header-actions class="filter-toggle-btn" (click)="toggleFilters()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M4 6H20M7 12H17M10 18H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          @if (activeFiltersCount() > 0) {
            <span class="filter-badge">{{ activeFiltersCount() }}</span>
          }
        </button>

        <!-- Map & Radius Control -->
        <div class="map-section">
          <div class="map-placeholder" (click)="openMapView()">
            <div class="map-icon">🗺️</div>
            <span class="map-text">Carte interactive</span>
          </div>
          <div class="radius-control">
            <div class="radius-header">
              <span class="radius-icon">📍</span>
              <label>Rayon : {{ store.searchRadius() }} km</label>
            </div>
            <input
              type="range"
              class="radius-slider"
              [min]="1"
              [max]="20"
              [value]="store.searchRadius()"
              (input)="onRadiusChange($event)"
            />
            <div class="radius-labels">
              <span>1 km</span>
              <span>20 km</span>
            </div>
          </div>
        </div>
      </ui-header>

      <!-- Filters Panel -->
      @if (showFilters()) {
        <div class="filters-panel">
          <div class="filters-header">
            <h3>Filtres</h3>
            <button class="btn-text" (click)="resetFilters()">Réinitialiser</button>
          </div>

          <!-- Availability filter -->
          <div class="filter-group">
            <label class="checkbox-label">
              <input
                type="checkbox"
                [checked]="store.availableToday()"
                (change)="toggleAvailableToday()"
              />
              <span class="checkbox-box"></span>
              <span>Disponible aujourd'hui</span>
            </label>
          </div>

          <!-- Service mode filter -->
          <div class="filter-group">
            <span class="filter-label">Mode de service</span>
            <div class="filter-options">
              <button
                class="filter-option"
                [class.active]="store.serviceMode() === 'shop'"
                (click)="setServiceMode('shop')"
              >
                🏪 En boutique
              </button>
              <button
                class="filter-option"
                [class.active]="store.serviceMode() === 'home'"
                (click)="setServiceMode('home')"
              >
                🏠 À domicile
              </button>
            </div>
          </div>

          <!-- Sort options -->
          <div class="filter-group">
            <span class="filter-label">Trier par</span>
            <div class="filter-options">
              <button
                class="filter-option"
                [class.active]="sortBy() === 'distance'"
                (click)="setSortBy('distance')"
              >
                📍 Distance
              </button>
              <button
                class="filter-option"
                [class.active]="sortBy() === 'rating'"
                (click)="setSortBy('rating')"
              >
                ⭐ Note
              </button>
              <button
                class="filter-option"
                [class.active]="sortBy() === 'price'"
                (click)="setSortBy('price')"
              >
                💰 Prix
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Active filters chips -->
      <div class="filters-bar">
        @if (store.selectedDevice()) {
          <span class="filter-chip active">
            {{ store.selectedDevice()?.brand }} {{ store.selectedDevice()?.model }}
            <button class="chip-remove" (click)="clearDevice()">×</button>
          </span>
        }
        @if (store.availableToday()) {
          <span class="filter-chip active">
            Disponible aujourd'hui
            <button class="chip-remove" (click)="toggleAvailableToday()">×</button>
          </span>
        }
        <span class="filter-chip">
          {{ store.serviceMode() === 'shop' ? '🏪 Boutique' : '🏠 Domicile' }}
        </span>
      </div>

      <!-- Results content -->
      <div class="results-content">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Recherche en cours...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <span class="error-icon">⚠️</span>
            <p>{{ error() }}</p>
            <button class="btn btn-primary" (click)="search()">Réessayer</button>
          </div>
        } @else if (!store.hasResults()) {
          <div class="empty-state">
            <div class="empty-icon">🔍</div>
            <h3>Aucun réparateur trouvé</h3>
            <p>Essayez d'élargir votre zone de recherche ou de modifier vos filtres</p>
            <div class="empty-actions">
              <button class="btn btn-primary" (click)="expandRadius()">
                Étendre à {{ store.searchRadius() + 5 }} km
              </button>
              <button class="btn btn-outline" (click)="resetFilters()">
                Supprimer les filtres
              </button>
            </div>
          </div>
        } @else {
          <!-- Compare mode toggle -->
          <div class="compare-bar">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="compareMode" />
              <span class="checkbox-box"></span>
              <span>Comparer</span>
            </label>
            @if (compareMode && selectedForCompare().length >= 2) {
              <button class="btn btn-primary btn-sm" (click)="openComparison()">
                Comparer ({{ selectedForCompare().length }})
              </button>
            }
          </div>

          <!-- Results list -->
          <div class="repairer-list">
            @for (repairer of sortedResults(); track repairer.id) {
              <div
                class="repairer-card"
                [class.selected]="compareMode && isSelectedForCompare(repairer.id)"
              >
                @if (compareMode) {
                  <button
                    class="compare-checkbox"
                    (click)="toggleCompare(repairer.id)"
                  >
                    @if (isSelectedForCompare(repairer.id)) {
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect width="20" height="20" rx="4" fill="#2563eb"/>
                        <path d="M14.5 7L8.5 13L5.5 10" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    } @else {
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect x="0.5" y="0.5" width="19" height="19" rx="3.5" stroke="#D1D5DB"/>
                      </svg>
                    }
                  </button>
                }

                <a [routerLink]="['/search/repairer', repairer.id]" class="card-link">
                  <div class="repairer-avatar">
                    @if (repairer.avatarUrl) {
                      <img [src]="repairer.avatarUrl" [alt]="getRepairerName(repairer)" />
                    } @else {
                      <div class="avatar-placeholder">
                        {{ getRepairerInitials(repairer) }}
                      </div>
                    }
                    @if (repairer.repairerProfile.isAvailable) {
                      <span class="status-dot available"></span>
                    }
                  </div>

                  <div class="repairer-info">
                    <div class="repairer-header">
                      <h3 class="repairer-name">
                        {{ repairer.repairerProfile.businessName || getRepairerName(repairer) }}
                      </h3>
                      @if (repairer.repairerProfile.isVerified) {
                        <span class="verified-badge" title="Vérifié">✓</span>
                      }
                    </div>

                    <div class="repairer-rating">
                      <span class="stars">★</span>
                      <span class="rating-value">{{ repairer.repairerProfile.rating.toFixed(1) }}</span>
                      <span class="review-count">({{ repairer.repairerProfile.reviewCount }})</span>
                      @if (repairer.repairerProfile.responseTime && repairer.repairerProfile.responseTime < 30) {
                        <span class="response-badge">⚡ Réponse rapide</span>
                      }
                    </div>

                    <div class="repairer-meta">
                      @if (repairer.distance !== undefined) {
                        <span class="distance">
                          📍 {{ formatDistance(repairer.distance) }}
                        </span>
                      }
                      @if (repairer.repairerProfile.estimatedPrice) {
                        <span class="price">
                          💰 ~{{ repairer.repairerProfile.estimatedPrice | number }} FCFA
                        </span>
                      }
                    </div>

                    @if (repairer.repairerProfile.specialties?.length) {
                      <div class="repairer-specialties">
                        @for (specialty of (repairer.repairerProfile.specialties ?? []).slice(0, 3); track specialty) {
                          <span class="specialty-tag">{{ specialty }}</span>
                        }
                      </div>
                    }
                  </div>

                  <div class="repairer-action">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </a>
              </div>
            }
          </div>

          @if (hasMoreResults()) {
            <button
              class="btn btn-outline btn-block load-more-btn"
              (click)="loadMore()"
              [disabled]="isLoadingMore()"
            >
              @if (isLoadingMore()) {
                <span class="spinner-small"></span>
                Chargement...
              } @else {
                Voir plus de résultats
              }
            </button>
          }
        }
      </div>

      <!-- Map View Modal -->
      @if (showMapView()) {
        <div class="map-modal-overlay" (click)="closeMapView()">
          <div class="map-modal" (click)="$event.stopPropagation()">
            <div class="map-modal-header">
              <h2>Carte des réparateurs</h2>
              <button class="close-btn" (click)="closeMapView()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="map-modal-content">
              <div class="map-container">
                <!-- Carte simulée avec les marqueurs -->
                <div class="simulated-map">
                  <div class="map-background">
                    <svg viewBox="0 0 400 300" class="map-svg">
                      <!-- Grille de rues -->
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" stroke-width="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="#f0f4f0"/>
                      <rect width="100%" height="100%" fill="url(#grid)"/>

                      <!-- Rues principales -->
                      <rect x="0" y="140" width="400" height="20" fill="#fff" opacity="0.8"/>
                      <rect x="190" y="0" width="20" height="300" fill="#fff" opacity="0.8"/>

                      <!-- Cercle de rayon de recherche -->
                      <circle cx="200" cy="150" [attr.r]="store.searchRadius() * 8" fill="rgba(255, 107, 53, 0.1)" stroke="#FF6B35" stroke-width="2" stroke-dasharray="5,5"/>

                      <!-- Position utilisateur -->
                      <circle cx="200" cy="150" r="8" fill="#2563eb"/>
                      <circle cx="200" cy="150" r="12" fill="rgba(37, 99, 235, 0.3)"/>
                    </svg>

                    <!-- Marqueurs des réparateurs -->
                    @for (repairer of sortedResults(); track repairer.id; let i = $index) {
                      <button
                        class="map-marker"
                        [style.left.%]="30 + (i % 5) * 10 + (i * 3 % 7)"
                        [style.top.%]="20 + Math.floor(i / 3) * 15 + (i * 7 % 10)"
                        [class.available]="repairer.repairerProfile.isAvailable"
                        (click)="selectRepairerFromMap(repairer.id)"
                        [title]="repairer.repairerProfile.businessName || getRepairerName(repairer)"
                      >
                        <span class="marker-icon">📍</span>
                        <span class="marker-label">{{ i + 1 }}</span>
                      </button>
                    }
                  </div>
                </div>
              </div>

              <!-- Liste compacte des réparateurs -->
              <div class="map-repairer-list">
                <h3>{{ sortedResults().length }} réparateur(s) dans la zone</h3>
                <div class="compact-list">
                  @for (repairer of sortedResults().slice(0, 5); track repairer.id; let i = $index) {
                    <button class="compact-repairer" (click)="selectRepairerFromMap(repairer.id)">
                      <span class="compact-number">{{ i + 1 }}</span>
                      <div class="compact-info">
                        <span class="compact-name">{{ repairer.repairerProfile.businessName || getRepairerName(repairer) }}</span>
                        <span class="compact-meta">
                          ⭐ {{ repairer.repairerProfile.rating.toFixed(1) }}
                          @if (repairer.distance !== undefined) {
                            · {{ formatDistance(repairer.distance) }}
                          }
                        </span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </button>
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .results-container {
      min-height: 100vh;
      background: #f9fafb;
    }

    .filter-toggle-btn {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      transition: all 0.2s;
    }

    .filter-toggle-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .filter-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px;
      height: 18px;
      background: #F9A825;
      border-radius: 50%;
      font-size: 0.6875rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Map Section */
    .map-section {
      margin-top: 1rem;
    }

    .map-placeholder {
      height: 140px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      border: 2px dashed rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.2s;
    }

    .map-placeholder:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .map-icon {
      font-size: 2.5rem;
    }

    .map-text {
      font-size: 0.875rem;
      font-weight: 500;
      opacity: 0.9;
    }

    .radius-control {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      padding: 1rem;
    }

    .radius-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .radius-icon {
      font-size: 1.125rem;
    }

    .radius-header label {
      font-size: 0.875rem;
      font-weight: 600;
      flex: 1;
    }

    .radius-slider {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
      appearance: none;
      outline: none;
      margin-bottom: 0.5rem;
    }

    .radius-slider::-webkit-slider-thumb {
      appearance: none;
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      transition: all 0.2s;
    }

    .radius-slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .radius-slider::-moz-range-thumb {
      width: 24px;
      height: 24px;
      background: white;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .radius-labels {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .filters-panel {
      background: white;
      padding: 1rem;
      margin-top: 260px;
      border-bottom: 1px solid #e5e7eb;
    }

    .filters-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .filters-header h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .btn-text {
      background: none;
      border: none;
      color: #FF6B35;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-text:hover {
      color: #E85A24;
    }

    .filter-group {
      margin-bottom: 1rem;
    }

    .filter-group:last-child {
      margin-bottom: 0;
    }

    .filter-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-label input {
      display: none;
    }

    .checkbox-box {
      width: 20px;
      height: 20px;
      border: 2px solid #d1d5db;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .checkbox-label input:checked + .checkbox-box {
      background: #4CAF50;
      border-color: #4CAF50;
    }

    .checkbox-label input:checked + .checkbox-box::after {
      content: '✓';
      color: white;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .filter-options {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .filter-option {
      padding: 0.625rem 1rem;
      min-height: 44px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 24px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-option:hover {
      border-color: #FF6B35;
      transform: translateY(-1px);
    }

    .filter-option.active {
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      border-color: #FF6B35;
      color: white;
      font-weight: 600;
    }

    .filters-bar {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      overflow-x: auto;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      margin-top: 260px;
    }

    .filters-panel + .filters-bar {
      margin-top: 0;
    }

    .filter-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: #f3f4f6;
      border-radius: 20px;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .filter-chip.active {
      background: linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%);
      color: #FF6B35;
      font-weight: 600;
      border: 1px solid rgba(255, 107, 53, 0.2);
    }

    .chip-remove {
      background: none;
      border: none;
      color: inherit;
      font-size: 1.125rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .results-content {
      padding: 1rem;
    }

    .loading-state, .empty-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #FF6B35;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon, .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .empty-state p, .error-state p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .empty-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
      max-width: 280px;
    }

    .compare-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: white;
      border-radius: 12px;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .repairer-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .repairer-card {
      display: flex;
      align-items: flex-start;
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s;
      overflow: hidden;
    }

    .repairer-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .repairer-card.selected {
      border: 2px solid #2563eb;
    }

    .compare-checkbox {
      background: none;
      border: none;
      padding: 1rem 0.5rem 1rem 1rem;
      cursor: pointer;
    }

    .card-link {
      flex: 1;
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      text-decoration: none;
      color: inherit;
    }

    .repairer-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .repairer-avatar img,
    .avatar-placeholder {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1.125rem;
    }

    .status-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .status-dot.available {
      background: #4CAF50;
    }

    .repairer-info {
      flex: 1;
      min-width: 0;
    }

    .repairer-header {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-bottom: 0.25rem;
    }

    .repairer-name {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .verified-badge {
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
      flex-shrink: 0;
      box-shadow: 0 2px 4px rgba(21, 101, 192, 0.3);
    }

    .repairer-rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: 0.375rem;
      flex-wrap: wrap;
    }

    .stars {
      color: #fbbf24;
    }

    .rating-value {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.875rem;
    }

    .review-count {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .response-badge {
      font-size: 0.625rem;
      background: linear-gradient(135deg, #F9A825 0%, #FFB74D 100%);
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(249, 168, 37, 0.3);
    }

    .repairer-meta {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .repairer-specialties {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .specialty-tag {
      font-size: 0.75rem;
      background: #f3f4f6;
      color: #4b5563;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
    }

    .repairer-action {
      display: flex;
      align-items: center;
      color: #9ca3af;
      padding-right: 1rem;
    }

    .load-more-btn {
      margin-top: 1rem;
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid #93c5fd;
      border-top-color: #2563eb;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #E85A24 0%, #F57C00 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
    }

    .btn-outline {
      background: white;
      border: 2px solid #FF6B35;
      color: #FF6B35;
      font-weight: 600;
    }

    .btn-outline:hover:not(:disabled) {
      background: linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%);
      transform: translateY(-1px);
    }

    .btn-block {
      width: 100%;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Map Modal Styles */
    .map-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 1000;
      display: flex;
      align-items: flex-end;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .map-modal {
      width: 100%;
      max-height: 90vh;
      background: white;
      border-radius: 24px 24px 0 0;
      overflow: hidden;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .map-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .map-modal-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1f2937;
    }

    .close-btn {
      background: #f3f4f6;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e5e7eb;
      color: #1f2937;
    }

    .map-modal-content {
      max-height: calc(90vh - 70px);
      overflow-y: auto;
    }

    .map-container {
      padding: 1rem;
    }

    .simulated-map {
      position: relative;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .map-background {
      position: relative;
      width: 100%;
      aspect-ratio: 4/3;
      background: #e8f5e9;
    }

    .map-svg {
      width: 100%;
      height: 100%;
    }

    .map-marker {
      position: absolute;
      transform: translate(-50%, -100%);
      background: none;
      border: none;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0;
      transition: transform 0.2s;
      z-index: 10;
    }

    .map-marker:hover {
      transform: translate(-50%, -100%) scale(1.2);
      z-index: 20;
    }

    .marker-icon {
      font-size: 2rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
    }

    .map-marker.available .marker-icon {
      filter: drop-shadow(0 2px 4px rgba(76, 175, 80, 0.5));
    }

    .marker-label {
      position: absolute;
      top: 4px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      color: #FF6B35;
      font-size: 0.625rem;
      font-weight: 700;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .map-repairer-list {
      padding: 1rem;
      background: #f9fafb;
    }

    .map-repairer-list h3 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 0.75rem;
    }

    .compact-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .compact-repairer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      width: 100%;
    }

    .compact-repairer:hover {
      border-color: #FF6B35;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.15);
    }

    .compact-number {
      width: 24px;
      height: 24px;
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .compact-info {
      flex: 1;
      min-width: 0;
    }

    .compact-name {
      display: block;
      font-weight: 600;
      color: #1f2937;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .compact-meta {
      display: block;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .compact-repairer svg {
      color: #9ca3af;
      flex-shrink: 0;
    }
  `],
})
export class SearchResultsComponent implements OnInit {
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  readonly store = inject(SearchStore);

  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly error = signal<string | null>(null);
  readonly showFilters = signal(false);
  readonly showMapView = signal(false);
  readonly sortBy = signal<'distance' | 'rating' | 'price'>('distance');
  readonly selectedForCompare = signal<string[]>([]);

  compareMode = false;
  readonly Math = Math;

  readonly sortedResults = computed(() => {
    const results = [...this.store.searchResults()];
    const sort = this.sortBy();

    return results.sort((a, b) => {
      switch (sort) {
        case 'distance':
          return (a.distance ?? 999) - (b.distance ?? 999);
        case 'rating':
          return b.repairerProfile.rating - a.repairerProfile.rating;
        case 'price':
          return (a.repairerProfile.estimatedPrice ?? 0) - (b.repairerProfile.estimatedPrice ?? 0);
        default:
          return 0;
      }
    });
  });

  readonly activeFiltersCount = computed(() => {
    let count = 0;
    if (this.store.availableToday()) count++;
    if (this.store.selectedDevice()) count++;
    return count;
  });

  ngOnInit(): void {
    if (!this.store.hasLocation()) {
      this.router.navigate(['/search']);
      return;
    }
    this.search();
  }

  async search(): Promise<void> {
    const params = this.store.searchParams();
    if (!params) return;

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.searchService.searchRepairers(params);
      this.store.setSearchResults(result.data, result.total);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de la recherche');
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    const params = this.store.searchParams();
    if (!params) return;

    this.isLoadingMore.set(true);
    this.store.setPage(this.store.currentPage() + 1);

    try {
      const result = await this.searchService.searchRepairers({
        ...params,
        page: this.store.currentPage(),
      });
      this.store.appendSearchResults(result.data);
    } catch (err: any) {
      this.store.setPage(this.store.currentPage() - 1);
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  onRadiusChange(event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.store.setSearchRadius(value);
    this.search();
  }

  expandRadius(): void {
    this.store.setSearchRadius(this.store.searchRadius() + 5);
    this.search();
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  toggleAvailableToday(): void {
    this.store.setAvailableToday(!this.store.availableToday());
    this.search();
  }

  setServiceMode(mode: 'shop' | 'home'): void {
    this.store.setServiceMode(mode);
    this.search();
  }

  setSortBy(sort: 'distance' | 'rating' | 'price'): void {
    this.sortBy.set(sort);
  }

  clearDevice(): void {
    this.store.setDevice(null);
    this.search();
  }

  resetFilters(): void {
    this.store.setAvailableToday(false);
    this.store.setDevice(null);
    this.search();
  }

  toggleCompare(id: string): void {
    this.selectedForCompare.update((selected) => {
      if (selected.includes(id)) {
        return selected.filter((s) => s !== id);
      }
      if (selected.length < 3) {
        return [...selected, id];
      }
      return selected;
    });
  }

  isSelectedForCompare(id: string): boolean {
    return this.selectedForCompare().includes(id);
  }

  openComparison(): void {
    const ids = this.selectedForCompare().join(',');
    this.router.navigate(['/search/compare'], { queryParams: { ids } });
  }

  hasMoreResults(): boolean {
    return this.store.searchResults().length < this.store.totalResults();
  }

  goBack(): void {
    this.router.navigate(['/search']);
  }

  getRepairerName(repairer: Repairer): string {
    if (repairer.firstName && repairer.lastName) {
      return `${repairer.firstName} ${repairer.lastName}`;
    }
    return 'Réparateur';
  }

  getRepairerInitials(repairer: Repairer): string {
    if (repairer.firstName && repairer.lastName) {
      return `${repairer.firstName[0]}${repairer.lastName[0]}`.toUpperCase();
    }
    return 'R';
  }

  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  }

  openMapView(): void {
    this.showMapView.set(true);
  }

  closeMapView(): void {
    this.showMapView.set(false);
  }

  selectRepairerFromMap(repairerId: string): void {
    this.closeMapView();
    this.router.navigate(['/search/repairer', repairerId]);
  }
}

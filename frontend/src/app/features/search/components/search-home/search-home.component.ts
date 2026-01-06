import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SearchService, Device, ServiceType, LocationDetails } from '../../services/search.service';
import { SearchStore } from '../../stores/search.store';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

interface Problem {
  id: string;
  name: string;
  icon: string;
  priceRange?: { min: number; max: number };
}

@Component({
  selector: 'app-search-home',
  standalone: true,
  imports: [CommonModule, FormsModule, UiHeaderComponent],
  template: `
    <div class="search-container">
      <!-- Header -->
      <ui-header
        title="Choix du service"
        subtitle="Trouvez un réparateur fiable"
        [showBack]="true"
        (onBack)="goHome()"
      />

      <div class="search-card">
        @if (error()) {
          <div class="alert alert-error">
            <span class="alert-icon">⚠️</span>
            <div class="alert-content">
              <span>{{ error() }}</span>
              <div class="alert-actions">
                <button class="btn-retry" (click)="detectLocation()">
                  🔄 Réessayer
                </button>
                <button class="btn-use-default" (click)="useDefaultLocation()">
                  📍 Utiliser Abidjan
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Step 1: Location -->
        <div class="search-step" [class.completed]="store.hasLocation()">
          <div class="step-header">
            <span class="step-indicator">
              @if (store.hasLocation()) {
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              } @else {
                1
              }
            </span>
            <h3>Votre position</h3>
          </div>

          @if (store.hasLocation()) {
            <div class="location-display">
              <div class="location-info">
                <span class="location-icon">📍</span>
                <div class="location-details">
                  @if (store.locationDetails()) {
                    <span class="location-address">{{ store.locationDetails()!.address }}</span>
                    <span class="location-city">{{ store.locationDetails()!.formattedAddress }}</span>
                    <span class="location-coords">
                      {{ store.locationDetails()!.latitude.toFixed(4) }}°N, {{ formatLongitude(store.locationDetails()!.longitude) }}
                    </span>
                  } @else if (locationName()) {
                    <span class="location-address">{{ locationName() }}</span>
                  } @else {
                    <span class="location-address">Position détectée</span>
                  }
                </div>
              </div>
              <button class="btn-text" (click)="detectLocation()">Modifier</button>
            </div>
          } @else {
            <button
              class="btn btn-location btn-block"
              (click)="detectLocation()"
              [disabled]="isLoadingLocation()"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 10.8333C11.3807 10.8333 12.5 9.71404 12.5 8.33333C12.5 6.95262 11.3807 5.83333 10 5.83333C8.61929 5.83333 7.5 6.95262 7.5 8.33333C7.5 9.71404 8.61929 10.8333 10 10.8333Z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M10 17.5C13.3333 14.1667 16.6667 11.0152 16.6667 8.33333C16.6667 4.65144 13.6819 1.66667 10 1.66667C6.31811 1.66667 3.33334 4.65144 3.33334 8.33333C3.33334 11.0152 6.66668 14.1667 10 17.5Z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              @if (isLoadingLocation()) {
                Détection en cours...
              } @else {
                Détecter ma position
              }
            </button>
          }
        </div>

        <!-- Step 2: Device Type -->
        <div class="search-step" [class.disabled]="!store.hasLocation()">
          <div class="step-header">
            <span class="step-indicator" [class.active]="store.hasLocation() && !selectedCategory()">
              @if (selectedCategory()) {
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              } @else {
                2
              }
            </span>
            <h3>Type d'appareil</h3>
          </div>

          <div class="category-grid">
            @for (category of categories(); track category) {
              <button
                class="category-btn"
                [class.active]="selectedCategory() === category"
                [disabled]="!store.hasLocation()"
                (click)="selectCategory(category)"
              >
                <span class="category-icon">{{ getCategoryIcon(category) }}</span>
                <span class="category-label">{{ getCategoryLabel(category) }}</span>
              </button>
            }
          </div>

          <!-- Brand selection with logos -->
          @if (selectedCategory() && brands().length > 0) {
            <div class="brand-section">
              <label class="section-label">Marque (optionnel)</label>
              <div class="brand-grid">
                <button
                  class="brand-btn"
                  [class.active]="!selectedBrand"
                  (click)="selectBrand('')"
                >
                  <span class="brand-icon">🔲</span>
                  <span>Toutes</span>
                </button>
                @for (brand of brands(); track brand) {
                  <button
                    class="brand-btn"
                    [class.active]="selectedBrand === brand"
                    (click)="selectBrand(brand)"
                  >
                    <span class="brand-icon">{{ getBrandIcon(brand) }}</span>
                    <span>{{ brand }}</span>
                  </button>
                }
              </div>
            </div>

            <!-- Model selection -->
            @if (devices().length > 0) {
              <div class="device-section">
                <label class="section-label">Modèle (optionnel)</label>
                <div class="device-list">
                  @for (device of devices().slice(0, showAllDevices() ? 999 : 5); track device.id) {
                    <button
                      class="device-btn"
                      [class.active]="store.selectedDevice()?.id === device.id"
                      (click)="selectDevice(device)"
                    >
                      <span class="device-name">{{ device.brand }} {{ device.model }}</span>
                      @if (store.selectedDevice()?.id === device.id) {
                        <span class="check">✓</span>
                      }
                    </button>
                  }
                  @if (devices().length > 5 && !showAllDevices()) {
                    <button class="btn-show-more" (click)="showAllDevices.set(true)">
                      + {{ devices().length - 5 }} autres modèles
                    </button>
                  }
                </div>
              </div>
            }
          }
        </div>

        <!-- Step 3: Problem -->
        @if (selectedCategory()) {
          <div class="search-step" [class.disabled]="!selectedCategory()">
            <div class="step-header">
              <span class="step-indicator" [class.active]="selectedCategory() && !store.selectedServiceType()">
                @if (store.selectedServiceType()) {
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                } @else {
                  3
                }
              </span>
              <h3>Problème rencontré</h3>
            </div>

            <div class="problems-list">
              @for (problem of commonProblems(); track problem.id) {
                <button
                  class="problem-btn"
                  [class.active]="selectedProblem()?.id === problem.id"
                  (click)="selectProblem(problem)"
                >
                  <span class="problem-icon">{{ problem.icon }}</span>
                  <div class="problem-info">
                    <span class="problem-name">{{ problem.name }}</span>
                    @if (problem.priceRange) {
                      <span class="problem-price">
                        {{ problem.priceRange.min | number }} - {{ problem.priceRange.max | number }} FCFA
                      </span>
                    }
                  </div>
                  @if (selectedProblem()?.id === problem.id) {
                    <span class="check">✓</span>
                  }
                </button>
              }
              <button
                class="problem-btn other"
                [class.active]="selectedProblem()?.id === 'other'"
                (click)="selectOtherProblem()"
              >
                <span class="problem-icon">❓</span>
                <div class="problem-info">
                  <span class="problem-name">Autre problème</span>
                  <span class="problem-hint">Décrivez votre problème</span>
                </div>
              </button>
            </div>

            @if (selectedProblem()?.id === 'other') {
              <div class="other-problem-input">
                <textarea
                  [(ngModel)]="otherProblemDescription"
                  placeholder="Décrivez votre problème..."
                  rows="3"
                ></textarea>
              </div>
            }
          </div>
        }

        <!-- Step 4: Service Mode -->
        @if (selectedProblem()) {
          <div class="search-step">
            <div class="step-header">
              <span class="step-indicator active">4</span>
              <h3>Mode de service</h3>
            </div>

            <div class="service-mode-grid">
              <button
                class="service-mode-btn"
                [class.active]="serviceMode() === 'shop'"
                (click)="setServiceMode('shop')"
              >
                <span class="mode-icon">🏪</span>
                <span class="mode-label">En boutique</span>
                <span class="mode-desc">Je me déplace</span>
              </button>
              <button
                class="service-mode-btn"
                [class.active]="serviceMode() === 'home'"
                (click)="setServiceMode('home')"
              >
                <span class="mode-icon">🏠</span>
                <span class="mode-label">À domicile</span>
                <span class="mode-desc">Le réparateur vient</span>
              </button>
            </div>
          </div>
        }

        <!-- Price Suggestion -->
        @if (selectedProblem() && selectedProblem()!.priceRange) {
          <div class="price-suggestion">
            <span class="suggestion-icon">💡</span>
            <div class="suggestion-content">
              <span class="suggestion-label">Prix estimé</span>
              <span class="suggestion-price">
                {{ selectedProblem()!.name }} : {{ selectedProblem()!.priceRange!.min | number }} – {{ selectedProblem()!.priceRange!.max | number }} FCFA
              </span>
            </div>
          </div>
        }

        <!-- Search Button -->
        <button
          class="btn btn-primary btn-block btn-large"
          (click)="search()"
          [disabled]="!canSearch()"
        >
          @if (isSearching()) {
            <span class="spinner-small"></span>
            Recherche en cours...
          } @else {
            Continuer
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      min-height: 100vh;
      background: #f9fafb;
    }

    .search-card {
      margin: 1rem;
      margin-top: 110px;
      background: white;
      border-radius: 20px;
      padding: 1.25rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
      position: relative;
      z-index: 1;
    }

    .alert {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1rem;
    }

    .alert-error {
      background: #fef2f2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .alert-actions {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn-retry {
      background: white;
      color: #991b1b;
      border: 1px solid #991b1b;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-retry:hover {
      background: #fef2f2;
      transform: translateY(-1px);
    }

    .btn-use-default {
      background: #2563eb;
      color: white;
      border: none;
      padding: 0.5rem 0.875rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-use-default:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }

    .search-step {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .search-step:last-of-type {
      border-bottom: none;
    }

    .search-step.disabled {
      opacity: 0.5;
      pointer-events: none;
    }

    .search-step.completed .step-indicator {
      background: #10b981;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .step-indicator {
      width: 28px;
      height: 28px;
      background: #e5e7eb;
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
      background: #FF6B35;
      color: white;
    }

    .step-indicator svg {
      color: white;
    }

    /* Price Suggestion */
    .price-suggestion {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%);
      border-left: 4px solid #F9A825;
      border-radius: 12px;
      margin-bottom: 1.5rem;
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

    .step-header h3 {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0;
    }

    .location-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem;
      background: #f0fdf4;
      border-radius: 12px;
    }

    .location-info {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .location-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .location-details {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .location-address {
      font-weight: 600;
      color: #166534;
      font-size: 0.9375rem;
    }

    .location-city {
      font-size: 0.8125rem;
      color: #15803d;
      font-weight: 500;
    }

    .location-coords {
      font-size: 0.6875rem;
      color: #22c55e;
      font-family: monospace;
      background: rgba(22, 163, 74, 0.1);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      margin-top: 0.25rem;
      display: inline-block;
    }

    .location-text {
      font-weight: 500;
      color: #166534;
    }

    .btn-text {
      background: none;
      border: none;
      color: #2563eb;
      font-weight: 500;
      cursor: pointer;
      padding: 0.5rem;
    }

    .btn-location {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #eff6ff;
      color: #2563eb;
      border: 2px dashed #93c5fd;
    }

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
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .category-btn:hover:not(:disabled) {
      border-color: #FF6B35;
      background: #FFF4E6;
      transform: translateY(-2px);
    }

    .category-btn.active {
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      border-color: #FF6B35;
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

    .section-label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin: 1rem 0 0.5rem;
      font-size: 0.875rem;
    }

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
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }

    .brand-btn:hover {
      border-color: #FF6B35;
      transform: translateY(-1px);
    }

    .brand-btn.active {
      background: #FFF4E6;
      border-color: #FF6B35;
      color: #FF6B35;
      font-weight: 600;
    }

    .brand-icon {
      font-size: 1rem;
    }

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
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .device-btn:hover {
      border-color: #FF6B35;
      transform: translateX(4px);
    }

    .device-btn.active {
      background: #FFF4E6;
      border-color: #FF6B35;
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

    .btn-show-more {
      background: none;
      border: none;
      color: #FF6B35;
      font-weight: 600;
      cursor: pointer;
      padding: 0.5rem;
      text-align: left;
      transition: all 0.2s;
    }

    .btn-show-more:hover {
      color: #E85A24;
    }

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
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .problem-btn:hover {
      border-color: #FF6B35;
      transform: translateX(4px);
    }

    .problem-btn.active {
      background: linear-gradient(135deg, #FFF4E6 0%, #FFE8CC 100%);
      border-color: #FF6B35;
      border-width: 2px;
    }

    .problem-btn.other {
      border-style: dashed;
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

    .problem-hint {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .other-problem-input {
      margin-top: 0.75rem;
    }

    .other-problem-input textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 1rem;
      resize: vertical;
    }

    .other-problem-input textarea:focus {
      outline: none;
      border-color: #FF6B35;
      box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
    }

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
      padding: 1.5rem 0.75rem;
      min-height: 120px;
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .service-mode-btn:hover {
      border-color: #FF6B35;
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.15);
    }

    .service-mode-btn.active {
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      border-color: #FF6B35;
      color: white;
    }

    .service-mode-btn.active .mode-label,
    .service-mode-btn.active .mode-desc {
      color: white;
    }

    .mode-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .mode-label {
      font-weight: 600;
      color: #1f2937;
    }

    .mode-desc {
      font-size: 0.75rem;
      color: #6b7280;
      margin-top: 0.25rem;
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

    .btn-primary {
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
      min-height: 56px;
      font-weight: 700;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, #E85A24 0%, #F57C00 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .btn-block {
      width: 100%;
    }

    .btn-large {
      padding: 1rem 1.5rem;
      font-size: 1.125rem;
      margin-top: 1rem;
    }

    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (min-width: 640px) {
      .search-card {
        max-width: 540px;
        margin: 1rem auto;
        margin-top: 110px;
      }
    }
  `],
})
export class SearchHomeComponent implements OnInit {
  private readonly searchService = inject(SearchService);
  private readonly router = inject(Router);
  readonly store = inject(SearchStore);

  readonly categories = signal<string[]>([]);
  readonly brands = signal<string[]>([]);
  readonly devices = signal<Device[]>([]);
  readonly serviceTypes = signal<ServiceType[]>([]);
  readonly selectedCategory = signal<string | null>(null);
  readonly isLoadingLocation = signal(false);
  readonly isSearching = signal(false);
  readonly error = signal<string | null>(null);
  readonly locationName = signal<string | null>(null);
  readonly showAllDevices = signal(false);
  readonly selectedProblem = signal<Problem | null>(null);
  readonly serviceMode = signal<'shop' | 'home'>('shop');

  selectedBrand = '';
  otherProblemDescription = '';

  readonly commonProblems = signal<Problem[]>([
    { id: 'screen', name: 'Écran cassé / fissuré', icon: '📱', priceRange: { min: 15000, max: 45000 } },
    { id: 'battery', name: 'Batterie défectueuse', icon: '🔋', priceRange: { min: 8000, max: 20000 } },
    { id: 'charging', name: 'Port de charge', icon: '🔌', priceRange: { min: 5000, max: 15000 } },
    { id: 'speaker', name: 'Haut-parleur / Micro', icon: '🔊', priceRange: { min: 6000, max: 18000 } },
    { id: 'camera', name: 'Caméra', icon: '📷', priceRange: { min: 12000, max: 35000 } },
    { id: 'water', name: 'Dégâts des eaux', icon: '💧', priceRange: { min: 10000, max: 40000 } },
  ]);

  ngOnInit(): void {
    this.loadCategories();
    if (!this.store.hasLocation()) {
      this.detectLocation();
    } else if (this.store.locationDetails()) {
      // Restore location name from stored details
      this.locationName.set(this.store.locationDetails()!.formattedAddress);
    }
  }

  async loadCategories(): Promise<void> {
    try {
      const categories = await this.searchService.getDeviceCategories();
      this.categories.set(categories);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  async detectLocation(): Promise<void> {
    this.isLoadingLocation.set(true);
    this.error.set(null);

    try {
      const position = await this.searchService.getCurrentPosition();
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.store.setUserLocation(lat, lng);

      // Get detailed location through reverse geocoding
      const locationDetails = await this.searchService.reverseGeocode(lat, lng);
      this.store.setLocationDetails(locationDetails);
      this.locationName.set(locationDetails.formattedAddress);
    } catch (err: any) {
      const errorMessage = err?.message || 'Impossible de détecter votre position.';
      this.error.set(errorMessage);
    } finally {
      this.isLoadingLocation.set(false);
    }
  }

  formatLongitude(lng: number): string {
    const absLng = Math.abs(lng);
    const direction = lng < 0 ? 'W' : 'E';
    return `${absLng.toFixed(4)}°${direction}`;
  }

  async useDefaultLocation(): Promise<void> {
    // Default location: Abidjan, Plateau (center of the city)
    const defaultLat = 5.3164;
    const defaultLng = -4.0267;

    this.error.set(null);
    this.store.setUserLocation(defaultLat, defaultLng);

    // Get location details for default location
    try {
      const locationDetails = await this.searchService.reverseGeocode(defaultLat, defaultLng);
      this.store.setLocationDetails(locationDetails);
      this.locationName.set(locationDetails.formattedAddress);
    } catch {
      // Fallback if reverse geocoding fails
      this.store.setLocationDetails({
        address: 'Plateau',
        city: 'Abidjan',
        country: 'Côte d\'Ivoire',
        latitude: defaultLat,
        longitude: defaultLng,
        formattedAddress: 'Plateau, Abidjan',
      });
      this.locationName.set('Plateau, Abidjan');
    }
  }

  async selectCategory(category: string): Promise<void> {
    this.selectedCategory.set(category);
    this.selectedBrand = '';
    this.devices.set([]);
    this.serviceTypes.set([]);
    this.store.setDevice(null);
    this.selectedProblem.set(null);
    this.showAllDevices.set(false);

    try {
      // Pass category to get relevant brands
      const brands = await this.searchService.getDeviceBrands(category);
      this.brands.set(brands);
      await this.loadDevices();
    } catch (err) {
      console.error('Error loading brands:', err);
    }
  }

  async selectBrand(brand: string): Promise<void> {
    this.selectedBrand = brand;
    this.store.setDevice(null);
    this.serviceTypes.set([]);
    this.showAllDevices.set(false);
    await this.loadDevices();
  }

  async loadDevices(): Promise<void> {
    try {
      const result = await this.searchService.getDevices({
        category: this.selectedCategory() || undefined,
        brand: this.selectedBrand || undefined,
      });
      this.devices.set(result.data);
    } catch (err) {
      console.error('Error loading devices:', err);
    }
  }

  async selectDevice(device: Device): Promise<void> {
    if (this.store.selectedDevice()?.id === device.id) {
      this.store.setDevice(null);
      return;
    }

    this.store.setDevice(device);
    this.serviceTypes.set([]);

    try {
      const services = await this.searchService.getServiceTypes(device.id);
      this.serviceTypes.set(services);
    } catch (err) {
      console.error('Error loading service types:', err);
    }
  }

  selectProblem(problem: Problem): void {
    if (this.selectedProblem()?.id === problem.id) {
      this.selectedProblem.set(null);
    } else {
      this.selectedProblem.set(problem);
      this.otherProblemDescription = '';
    }
  }

  selectOtherProblem(): void {
    this.selectedProblem.set({ id: 'other', name: 'Autre', icon: '❓' });
  }

  setServiceMode(mode: 'shop' | 'home'): void {
    this.serviceMode.set(mode);
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      smartphone: '📱',
      computer: '💻',
    };
    return icons[category] || '🔧';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      smartphone: 'Téléphone',
      computer: 'Ordinateur',
    };
    return labels[category] || category;
  }

  getBrandIcon(brand: string): string {
    const icons: Record<string, string> = {
      Apple: '🍎',
      Samsung: '📱',
      Huawei: '📱',
      Xiaomi: '📱',
      OnePlus: '📱',
      Google: '📱',
      Sony: '📱',
      LG: '📱',
      HP: '💻',
      Dell: '💻',
      Lenovo: '💻',
      Asus: '💻',
    };
    return icons[brand] || '📱';
  }

  canSearch(): boolean {
    return this.store.hasLocation() && this.selectedCategory() !== null;
  }

  async search(): Promise<void> {
    if (!this.canSearch()) return;

    this.isSearching.set(true);
    try {
      // Store additional search criteria
      this.store.setServiceMode(this.serviceMode());

      this.router.navigate(['/search/results']);
    } finally {
      this.isSearching.set(false);
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}

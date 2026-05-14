import { Component, inject, signal, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SearchService, LocationDetails } from '../../services/search.service';
import { DevicesService, type Device, type ServiceType } from '@app/domains/devices';
import { SearchStore } from '../../stores/search.store';
import { UiHeaderComponent } from '@app/features/common/components';
import { LoggerService } from '../../../../core/services/logger.service';

interface Problem {
  id: string;
  name: string;
  icon: string;
  priceRange?: { min: number; max: number };
}

@Component({
  selector: 'app-search-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, UiHeaderComponent],
  template: `
    <div class="search-container">
      <!-- Header -->
      <ui-header
        title="Trouver un réparateur"
        subtitle="En quelques étapes"
        [showBack]="true"
        [showProfile]="true"
        (onBack)="goHome()"
      />

      <div class="search-card">
        <!-- Step 1: Device Type -->
        <div class="search-step" [class.completed]="selectedCategory()">
          <div class="step-header">
            <span class="step-indicator" [class.active]="!selectedCategory()">
              @if (selectedCategory()) {
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              } @else {
                1
              }
            </span>
            <h3>Quel appareil ?</h3>
          </div>

          <div class="category-grid">
            @for (category of categories(); track category) {
              <button
                class="category-btn"
                [class.active]="selectedCategory() === category"
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

        <!-- Step 2: Problem -->
        @if (selectedCategory()) {
          <div class="search-step" [class.completed]="selectedProblem()">
            <div class="step-header">
              <span class="step-indicator" [class.active]="selectedCategory() && !selectedProblem()">
                @if (selectedProblem()) {
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                } @else {
                  2
                }
              </span>
              <h3>Quel problème ?</h3>
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

            <!-- Price Suggestion -->
            @if (selectedProblem() && selectedProblem()!.priceRange) {
              <div class="price-suggestion">
                <span class="suggestion-icon">💡</span>
                <div class="suggestion-content">
                  <span class="suggestion-label">Prix estimé</span>
                  <span class="suggestion-price">
                    {{ selectedProblem()!.priceRange!.min | number }} – {{ selectedProblem()!.priceRange!.max | number }} FCFA
                  </span>
                </div>
              </div>
            }
          </div>
        }

        <!-- Step 3: Location -->
        @if (selectedProblem()) {
          <div class="search-step" [class.completed]="store.hasLocation()">
            <div class="step-header">
              <span class="step-indicator" [class.active]="selectedProblem() && !store.hasLocation()">
                @if (store.hasLocation()) {
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.3 4.3L6 11.6L2.7 8.3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                } @else {
                  3
                }
              </span>
              <h3>Où êtes-vous ?</h3>
            </div>

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

            @if (store.hasLocation()) {
              <div class="location-display">
                <div class="location-info">
                  <span class="location-icon">📍</span>
                  <div class="location-details">
                    @if (store.locationDetails()) {
                      <span class="location-address">{{ store.locationDetails()!.address }}</span>
                      <span class="location-city">{{ store.locationDetails()!.formattedAddress }}</span>
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
        }

        <!-- Hint UX : explique pourquoi le bouton est disabled -->
        @if (!canSearch() && (selectedCategory() && selectedProblem())) {
          <p class="search-hint">
            📍 Activez votre localisation ci-dessus pour voir les réparateurs proches.
          </p>
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
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M17.5 17.5L13.875 13.875M15.833 9.167A6.667 6.667 0 112.5 9.167a6.667 6.667 0 0113.333 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Voir les réparateurs
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .search-container {
      min-height: 100vh;
      background: #FAFAFA;
    }

    .search-card {
      margin: 0;
      margin-top: var(--header-height, 100px);
      background: white;
      border-radius: 0;
      padding: 1.25rem;
      box-shadow: none;
      position: relative;
      z-index: 1;
      min-height: calc(100vh - 100px);
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
      background: #FFEBEE;
      color: #991b1b;
      border: 1px solid #FFCDD2;
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
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-retry:hover {
      background: #FFEBEE;
      transform: translateY(-1px);
    }

    .btn-use-default {
      background: var(--color-primary-500, #FF9800);
      color: white;
      border: none;
      padding: 0.5rem 0.875rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.8125rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-use-default:hover {
      background: var(--color-primary-900, #E65100);
      transform: translateY(-1px);
    }

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

    /* Price Suggestion */
    .price-suggestion {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: linear-gradient(135deg, #FFF3E0 0%, #FFE8CC 100%);
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
      background: #E8F5E9;
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
      color: var(--color-success-dark, #2E7D32);
      font-weight: 500;
    }

    .location-coords {
      font-size: 0.6875rem;
      color: var(--color-secondary, #4CAF50);
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
      color: var(--color-primary-500, #FF9800);
      font-weight: 500;
      cursor: pointer;
      padding: 0.5rem;
    }

    .btn-location {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #E3F2FD;
      color: var(--color-primary-500, #FF9800);
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

    .btn-show-more {
      background: none;
      border: none;
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
      cursor: pointer;
      padding: 0.5rem;
      text-align: left;
      transition: all 0.2s;
    }

    .btn-show-more:hover {
      color: var(--color-primary-900, #E65100);
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
      border: 1px solid #D1D5DB;
      border-radius: 12px;
      font-size: 1rem;
      resize: vertical;
    }

    .other-problem-input textarea:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
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

    .search-hint {
      background: #FFF8E1;
      color: #E65100;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 0.875rem;
      border-left: 4px solid #FFB74D;
      margin-bottom: 0.75rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
      min-height: 56px;
      font-weight: 700;
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--color-primary-900, #E65100) 0%, #F57C00 100%);
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
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
        padding: 1.5rem 2rem;
      }
    }
  `],
})
export class SearchHomeComponent implements OnInit {
  private readonly searchService = inject(SearchService);
  private readonly devicesService = inject(DevicesService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(SearchStore);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

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
    // Restore location name if already set
    if (this.store.locationDetails()) {
      this.locationName.set(this.store.locationDetails()!.formattedAddress);
    }

    // Handle query parameters from home page navigation
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      // Pre-select problem if passed from home page
      if (params['problem']) {
        const problemName = params['problem'].toLowerCase();
        const matchingProblem = this.commonProblems().find(p =>
          p.name.toLowerCase().includes(problemName) || p.id === problemName
        );
        if (matchingProblem) {
          // Auto-select smartphone category (most common)
          if (!this.selectedCategory()) {
            this.selectCategory('smartphone');
          }
          this.selectedProblem.set(matchingProblem);
          // Auto-detect location if not already set
          if (!this.store.hasLocation()) {
            this.detectLocation();
          }
        }
      }

      // Pre-select category/service if passed from home page
      if (params['service']) {
        const serviceId = params['service'].toLowerCase();
        // Map service IDs to categories
        const categoryMap: Record<string, string> = {
          'screen': 'smartphone',
          'battery': 'smartphone',
          'charging': 'smartphone',
          'ecran': 'smartphone',
          'batterie': 'smartphone',
        };
        const category = categoryMap[serviceId] || 'smartphone';
        if (!this.selectedCategory()) {
          this.selectCategory(category);
        }
        // Also select the matching problem
        const matchingProblem = this.commonProblems().find(p =>
          p.id === serviceId || p.name.toLowerCase().includes(serviceId)
        );
        if (matchingProblem) {
          this.selectedProblem.set(matchingProblem);
        }
      }

      // Handle search query
      if (params['q']) {
        // Try to match query with a problem
        const query = params['q'].toLowerCase();
        const matchingProblem = this.commonProblems().find(p =>
          p.name.toLowerCase().includes(query)
        );
        if (matchingProblem) {
          if (!this.selectedCategory()) {
            this.selectCategory('smartphone');
          }
          this.selectedProblem.set(matchingProblem);
        }
      }
    });
  }

  async loadCategories(): Promise<void> {
    try {
      const categories = await this.devicesService.getDeviceCategories();
      // Use default categories if API returns empty
      if (categories && categories.length > 0) {
        this.categories.set(categories);
      } else {
        this.categories.set(['smartphone', 'computer']);
      }
    } catch (err) {
      this.logger.error('SearchHomeComponent', 'Error loading categories', err);
      // Fallback to default categories
      this.categories.set(['smartphone', 'computer']);
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
      const brands = await this.devicesService.getDeviceBrands(category);
      this.brands.set(brands);
      await this.loadDevices();
    } catch (err) {
      this.logger.error('SearchHomeComponent', 'Error loading brands', err);
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
      const result = await this.devicesService.getDevices({
        category: this.selectedCategory() || undefined,
        brand: this.selectedBrand || undefined,
      });
      this.devices.set(result.data);
    } catch (err) {
      this.logger.error('SearchHomeComponent', 'Error loading devices', err);
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
      const services = await this.devicesService.getServiceTypes(device.id);
      this.serviceTypes.set(services);
    } catch (err) {
      this.logger.error('SearchHomeComponent', 'Error loading service types', err);
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
    return this.selectedCategory() !== null && this.selectedProblem() !== null && this.store.hasLocation();
  }

  async search(): Promise<void> {
    if (!this.canSearch()) return;

    this.isSearching.set(true);
    try {
      this.router.navigate(['/search/results']);
    } finally {
      this.isSearching.set(false);
    }
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}

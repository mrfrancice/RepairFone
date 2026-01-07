import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConseilsService, Expert } from '../../services/conseils.service';
import { ConseilsStore } from '../../stores/conseils.store';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-expert-list',
  standalone: true,
  imports: [CommonModule, UiHeaderComponent],
  template: `
    <div class="experts-container">
      <ui-header
        title="Nos experts"
        [subtitle]="store.totalExperts() + ' expert(s) disponible(s)'"
        [showBack]="true"
        [showProfile]="true"
        (onBack)="goBack()"
      />

      <!-- Filter chips -->
      @if (store.selectedType() || store.selectedFormat()) {
        <div class="filters-bar">
          @if (store.selectedType()) {
            <span class="filter-chip">
              {{ getTypeLabel(store.selectedType()!) }}
              <button class="chip-remove" (click)="clearType()">×</button>
            </span>
          }
          @if (store.selectedFormat()) {
            <span class="filter-chip">
              {{ getFormatLabel(store.selectedFormat()!) }}
              <button class="chip-remove" (click)="clearFormat()">×</button>
            </span>
          }
        </div>
      }

      <div class="experts-content">
        @if (store.isLoadingExperts()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des experts...</p>
          </div>
        } @else if (store.experts().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">👨‍💻</span>
            <h3>Aucun expert trouvé</h3>
            <p>Modifiez vos critères de recherche</p>
            <button class="btn btn-outline" (click)="goBack()">
              Modifier ma recherche
            </button>
          </div>
        } @else {
          <div class="experts-list">
            @for (expert of store.experts(); track expert.id) {
              <div class="expert-card" (click)="selectExpert(expert)">
                <div class="expert-avatar">
                  @if (expert.avatarUrl) {
                    <img [src]="expert.avatarUrl" [alt]="expert.firstName" />
                  } @else {
                    <div class="avatar-placeholder">
                      {{ getInitials(expert) }}
                    </div>
                  }
                  @if (expert.isAvailable) {
                    <span class="status-dot available"></span>
                  }
                </div>

                <div class="expert-info">
                  <h3 class="expert-name">{{ expert.firstName }} {{ expert.lastName }}</h3>

                  <div class="expert-rating">
                    <span class="stars">★</span>
                    <span class="rating-value">{{ expert.rating.toFixed(1) }}</span>
                    <span class="review-count">({{ expert.reviewCount }} avis)</span>
                  </div>

                  <div class="expert-specialties">
                    @for (specialty of expert.specialties.slice(0, 3); track specialty) {
                      <span class="specialty-tag">{{ specialty }}</span>
                    }
                  </div>

                  <div class="expert-meta">
                    <span class="response-time">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.5"/>
                        <path d="M7 4V7L9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                      </svg>
                      ~{{ expert.responseTime }} min
                    </span>
                    <span class="experience">{{ expert.yearsOfExperience }} ans d'exp.</span>
                  </div>
                </div>

                <div class="expert-action">
                  <span class="price">{{ expert.pricePerSession | number }} FCFA</span>
                  <span class="price-label">/session</span>
                  @if (!expert.isAvailable) {
                    <span class="unavailable-badge">Indisponible</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .experts-container {
      min-height: 100vh;
      background: #f9fafb;
    }

    .filters-bar {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      padding-top: calc(100px + 0.75rem);
      background: white;
      border-bottom: 1px solid #e5e7eb;
      overflow-x: auto;
    }

    .filter-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: #FFF4E6;
      border: 1px solid #FF6B35;
      border-radius: 20px;
      font-size: 0.875rem;
      color: #FF6B35;
      white-space: nowrap;
    }

    .chip-remove {
      background: none;
      border: none;
      color: #FF6B35;
      font-size: 1.125rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .experts-content {
      margin-top: 100px;
      padding: 1.25rem;
      background: white;
      min-height: calc(100vh - 100px);
    }

    .experts-content.with-filters {
      margin-top: 0;
    }

    .loading-state, .empty-state {
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

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .experts-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .expert-card {
      display: flex;
      gap: 1rem;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .expert-card:hover {
      border-color: #FF6B35;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.15);
      transform: translateY(-2px);
    }

    .expert-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .expert-avatar img,
    .avatar-placeholder {
      width: 64px;
      height: 64px;
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
      font-size: 1.25rem;
    }

    .status-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 2px solid white;
    }

    .status-dot.available {
      background: #10b981;
    }

    .expert-info {
      flex: 1;
      min-width: 0;
    }

    .expert-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .expert-rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
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

    .expert-specialties {
      display: flex;
      flex-wrap: wrap;
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }

    .specialty-tag {
      font-size: 0.6875rem;
      background: linear-gradient(135deg, #FFF4E6, #FFE5D9);
      color: #E85A24;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-weight: 500;
    }

    .expert-meta {
      display: flex;
      gap: 0.75rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .response-time {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .expert-action {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: center;
      flex-shrink: 0;
    }

    .price {
      font-size: 1rem;
      font-weight: 700;
      color: #FF6B35;
    }

    .price-label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .unavailable-badge {
      margin-top: 0.5rem;
      font-size: 0.6875rem;
      background: #fef2f2;
      color: #991b1b;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-outline {
      background: white;
      border: 2px solid #FF6B35;
      color: #FF6B35;
    }

    .btn-outline:hover {
      background: #FFF4E6;
    }

    @media (min-width: 640px) {
      .experts-content {
        padding: 1.5rem 2rem;
      }
    }
  `],
})
export class ExpertListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly conseilsService = inject(ConseilsService);
  readonly store = inject(ConseilsStore);

  ngOnInit(): void {
    this.loadExperts();
  }

  async loadExperts(): Promise<void> {
    this.store.setIsLoadingExperts(true);
    try {
      const result = await this.conseilsService.getExperts({
        type: this.store.selectedType() || undefined,
      });
      this.store.setExperts(result.data, result.total);
    } catch (err) {
      console.error('Error loading experts:', err);
    } finally {
      this.store.setIsLoadingExperts(false);
    }
  }

  selectExpert(expert: Expert): void {
    this.store.setSelectedExpert(expert);
    this.router.navigate(['/conseils/expert', expert.id]);
  }

  getInitials(expert: Expert): string {
    return `${expert.firstName[0]}${expert.lastName[0]}`.toUpperCase();
  }

  getTypeLabel(type: string): string {
    const types = this.conseilsService.getConseilTypes();
    return types.find((t) => t.type === type)?.label || type;
  }

  getFormatLabel(format: string): string {
    const formats = this.conseilsService.getConseilFormats();
    return formats.find((f) => f.format === format)?.label || format;
  }

  clearType(): void {
    this.store.setSelectedType(null);
    this.loadExperts();
  }

  clearFormat(): void {
    this.store.setSelectedFormat(null);
  }

  goBack(): void {
    this.router.navigate(['/conseils']);
  }
}

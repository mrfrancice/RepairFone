import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ConseilsService, Expert } from '../../services/conseils.service';
import { ConseilsStore } from '../../stores/conseils.store';

@Component({
  selector: 'app-expert-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="experts-container">
      <header class="experts-header">
        <button class="back-btn" (click)="goBack()">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="header-content">
          <h1>Nos experts</h1>
          <p>{{ store.totalExperts() }} expert(s) disponible(s)</p>
        </div>
      </header>

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

    .experts-header {
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      color: white;
      padding: 1rem;
      padding-top: calc(1rem + env(safe-area-inset-top, 0));
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .header-content h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .header-content p {
      opacity: 0.9;
      font-size: 0.875rem;
    }

    .filters-bar {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      overflow-x: auto;
    }

    .filter-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: #faf5ff;
      border: 1px solid #7c3aed;
      border-radius: 20px;
      font-size: 0.875rem;
      color: #7c3aed;
      white-space: nowrap;
    }

    .chip-remove {
      background: none;
      border: none;
      color: #7c3aed;
      font-size: 1.125rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }

    .experts-content {
      padding: 1rem;
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
      border-top-color: #7c3aed;
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
      gap: 1rem;
    }

    .expert-card {
      display: flex;
      gap: 1rem;
      background: white;
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s;
    }

    .expert-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
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
      font-size: 1rem;
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
      font-size: 0.75rem;
      background: #f3f4f6;
      color: #4b5563;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
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
      color: #7c3aed;
    }

    .price-label {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .unavailable-badge {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      background: #fef2f2;
      color: #991b1b;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-outline {
      background: white;
      border: 2px solid #7c3aed;
      color: #7c3aed;
    }

    .btn-outline:hover {
      background: #faf5ff;
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

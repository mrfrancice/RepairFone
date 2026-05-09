import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsService, Review, StepRating, StepRatingStats } from '../../services/reviews.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { LoggerService } from '../../../../core/services/logger.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { UiErrorStateComponent } from '../../../../shared/components/ui-error-state/ui-error-state.component';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, UiHeaderComponent, UiErrorStateComponent, FormatDatePipe, InitialsPipe],
  template: `
    <div class="reviews-container">
      <ui-header
        title="Mes avis"
        subtitle="Évaluations clients reçues"
        [showBack]="true"
        [showProfile]="true"
        backRoute="/profile"
      />

      <div class="reviews-content">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement...</p>
          </div>
        } @else if (error()) {
          <ui-error-state
            [message]="error()!"
            severity="error"
            [showRetry]="true"
            (onRetry)="loadReviews()"
          />
        } @else {
          <!-- Stats Summary -->
          @if (stats()) {
            <div class="stats-card">
              <div class="stats-main">
                <div class="stats-score" [style.color]="getScoreColor(stats()!.overall.average)">
                  {{ stats()!.overall.average > 0 ? '+' : '' }}{{ stats()!.overall.average.toFixed(1) }}
                </div>
                <div class="stats-info">
                  <span class="stats-label">{{ getScoreLabel(stats()!.overall.average) }}</span>
                  <span class="stats-count">{{ stats()!.overall.count }} evaluations</span>
                </div>
              </div>

              <div class="stats-categories">
                @for (cat of categoryList; track cat.key) {
                  <div class="category-item">
                    <span class="cat-icon">{{ cat.icon }}</span>
                    <span class="cat-label">{{ cat.label }}</span>
                    <span class="cat-value" [style.color]="getScoreColor(getCategoryAvg(cat.key))">
                      {{ formatScore(getCategoryAvg(cat.key)) }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Recent Ratings -->
          @if (stepRatings().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">⭐</div>
              <h3>Aucune évaluation</h3>
              <p>Vous n'avez pas encore reçu d'évaluation de vos clients</p>
            </div>
          } @else {
            <h3 class="section-title">Dernières évaluations</h3>
            <div class="reviews-list">
              @for (rating of stepRatings(); track rating.id) {
                <div class="review-card">
                  <div class="review-header">
                    <div class="reviewer-info">
                      <div class="reviewer-avatar">
                        {{ rating.client?.firstName | initials : rating.client?.lastName }}
                      </div>
                      <div class="reviewer-details">
                        <span class="reviewer-name">
                          {{ rating.client?.firstName || 'Client' }} {{ rating.client?.lastName?.charAt(0) }}.
                        </span>
                        <span class="review-date">{{ rating.createdAt | formatDate }}</span>
                      </div>
                    </div>
                    <div class="review-rating-badge" [style.background]="getRatingBgColor(rating.rating)">
                      <span [style.color]="getRatingTextColor(rating.rating)">{{ formatScore(rating.rating) }}</span>
                    </div>
                  </div>

                  <div class="review-meta">
                    <span class="review-category-tag">{{ getCategoryLabel(rating.category) }}</span>
                    <span class="review-step-tag">{{ getStepLabel(rating.step) }}</span>
                  </div>

                  @if (rating.comment) {
                    <p class="review-comment">{{ rating.comment }}</p>
                  }
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `,
  styles: [`
    .reviews-container {
      min-height: 100vh;
      background: #FAFAFA;
    }

    .reviews-content {
      padding: 1rem;
      padding-top: var(--header-height, 100px);
      padding-bottom: 2rem;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #EEEEEE;
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
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
    }

    /* Stats Card */
    .stats-card {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .stats-main {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #EEEEEE;
      margin-bottom: 1rem;
    }

    .stats-score {
      font-size: 2.5rem;
      font-weight: 800;
      line-height: 1;
    }

    .stats-info {
      display: flex;
      flex-direction: column;
    }

    .stats-label {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .stats-count {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .stats-categories {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .category-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: #FAFAFA;
      border-radius: 12px;
    }

    .cat-icon {
      font-size: 1rem;
    }

    .cat-label {
      flex: 1;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .cat-value {
      font-size: 0.875rem;
      font-weight: 700;
    }

    /* Section Title */
    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      margin: 0 0 1rem 0;
    }

    /* Reviews List */
    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .review-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .reviewer-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .reviewer-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), #FF9800);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .reviewer-details {
      display: flex;
      flex-direction: column;
    }

    .reviewer-name {
      font-weight: 600;
      color: #1f2937;
    }

    .review-date {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .review-rating-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.875rem;
      font-weight: 700;
    }

    .review-meta {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .review-category-tag,
    .review-step-tag {
      padding: 0.25rem 0.625rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .review-category-tag {
      background: #FFF3E0;
      color: #c2410c;
    }

    .review-step-tag {
      background: #f1f5f9;
      color: #4B5563;
    }

    .review-comment {
      color: #4b5563;
      line-height: 1.5;
      font-size: 0.9375rem;
      margin: 0;
      padding: 0.75rem;
      background: #FAFAFA;
      border-radius: 12px;
    }
  `],
})
export class MyReviewsComponent implements OnInit {
  private readonly reviewsService = inject(ReviewsService);
  private readonly authStore = inject(AuthStore);
  private readonly logger = inject(LoggerService);

  readonly stepRatings = signal<StepRating[]>([]);
  readonly stats = signal<StepRatingStats | null>(null);
  readonly isLoading = signal(true);
  readonly error = signal<string | null>(null);

  readonly categoryList = [
    { key: 'communication', label: 'Communication', icon: '💬' },
    { key: 'quality', label: 'Qualité', icon: '⭐' },
    { key: 'timeliness', label: 'Délais', icon: '⏰' },
    { key: 'price', label: 'Prix', icon: '💰' },
  ];

  ngOnInit(): void {
    this.loadReviews();
  }

  async loadReviews(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const repairerProfileId = this.authStore.user()?.repairerProfile?.id;
      if (!repairerProfileId) {
        // Pas de profil réparateur (ex: client) — afficher empty state plutôt que page blanche
        this.stats.set(null);
        this.stepRatings.set([]);
        this.isLoading.set(false);
        return;
      }

      const result = await this.reviewsService.getRepairerStepRatingStats(repairerProfileId);
      this.stats.set(result);
      this.stepRatings.set(result.recentRatings || []);
    } catch (err: any) {
      this.logger.error('MyReviewsComponent', 'Error loading reviews', err);
      this.error.set(err.message || 'Impossible de charger les avis');
    } finally {
      this.isLoading.set(false);
    }
  }

  getCategoryAvg(category: string): number {
    return this.stats()?.byCategory?.[category]?.average || 0;
  }

  getScoreColor(rating: number): string {
    if (rating >= 4) return 'var(--color-secondary, #4CAF50)';
    if (rating >= 2) return 'var(--color-secondary, #4CAF50)';
    if (rating >= 0) return 'var(--color-mustard, #FFC107)';
    if (rating >= -2) return '#f97316';
    return 'var(--color-error, #F44336)';
  }

  getScoreLabel(rating: number): string {
    if (rating >= 4) return 'Excellent';
    if (rating >= 2) return 'Très bien';
    if (rating >= 0) return 'Correct';
    if (rating >= -2) return 'Insuffisant';
    return 'Très mauvais';
  }

  formatScore(rating: number): string {
    if (rating > 0) return `+${rating.toFixed(1)}`;
    return rating.toFixed(1);
  }

  getRatingBgColor(rating: number): string {
    if (rating >= 4) return '#dcfce7';
    if (rating >= 2) return '#E8F5E9';
    if (rating >= 0) return '#FFF8E1';
    if (rating >= -2) return '#FFE0B2';
    return '#FFEBEE';
  }

  getRatingTextColor(rating: number): string {
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

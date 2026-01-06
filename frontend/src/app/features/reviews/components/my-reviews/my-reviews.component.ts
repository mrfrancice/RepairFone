import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsService, Review, StepRating, StepRatingStats } from '../../services/reviews.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, UiHeaderComponent],
  template: `
    <div class="reviews-container">
      <ui-header
        title="Mes avis"
        subtitle="Evaluations clients reçues"
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
              <h3>Aucune evaluation</h3>
              <p>Vous n'avez pas encore reçu d'evaluation de vos clients</p>
            </div>
          } @else {
            <h3 class="section-title">Dernieres evaluations</h3>
            <div class="reviews-list">
              @for (rating of stepRatings(); track rating.id) {
                <div class="review-card">
                  <div class="review-header">
                    <div class="reviewer-info">
                      <div class="reviewer-avatar">
                        {{ getInitials(rating.client?.firstName, rating.client?.lastName) }}
                      </div>
                      <div class="reviewer-details">
                        <span class="reviewer-name">
                          {{ rating.client?.firstName || 'Client' }} {{ rating.client?.lastName?.charAt(0) }}.
                        </span>
                        <span class="review-date">{{ formatDate(rating.createdAt) }}</span>
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
      background: #f9fafb;
    }

    .reviews-content {
      padding: 1rem;
      padding-top: 100px;
      padding-bottom: 2rem;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #FF6B35;
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
      border-bottom: 1px solid #e5e7eb;
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
      background: #f9fafb;
      border-radius: 8px;
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
      background: linear-gradient(135deg, #FF6B35, #FF9800);
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
      background: #fff7ed;
      color: #c2410c;
    }

    .review-step-tag {
      background: #f1f5f9;
      color: #475569;
    }

    .review-comment {
      color: #4b5563;
      line-height: 1.5;
      font-size: 0.9375rem;
      margin: 0;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 8px;
    }
  `],
})
export class MyReviewsComponent implements OnInit {
  private readonly reviewsService = inject(ReviewsService);
  private readonly authStore = inject(AuthStore);

  readonly stepRatings = signal<StepRating[]>([]);
  readonly stats = signal<StepRatingStats | null>(null);
  readonly isLoading = signal(true);

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

    try {
      const repairerProfileId = this.authStore.user()?.repairerProfile?.id;
      if (!repairerProfileId) {
        this.isLoading.set(false);
        return;
      }

      const result = await this.reviewsService.getRepairerStepRatingStats(repairerProfileId);
      this.stats.set(result);
      this.stepRatings.set(result.recentRatings || []);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getCategoryAvg(category: string): number {
    return this.stats()?.byCategory?.[category]?.average || 0;
  }

  getScoreColor(rating: number): string {
    if (rating >= 4) return '#10b981';
    if (rating >= 2) return '#22c55e';
    if (rating >= 0) return '#f59e0b';
    if (rating >= -2) return '#f97316';
    return '#ef4444';
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
    if (rating >= 2) return '#d1fae5';
    if (rating >= 0) return '#fef3c7';
    if (rating >= -2) return '#ffedd5';
    return '#fee2e2';
  }

  getRatingTextColor(rating: number): string {
    if (rating >= 4) return '#15803d';
    if (rating >= 2) return '#166534';
    if (rating >= 0) return '#b45309';
    if (rating >= -2) return '#c2410c';
    return '#991b1b';
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
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

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

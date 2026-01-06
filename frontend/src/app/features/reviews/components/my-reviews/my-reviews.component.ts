import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewsService, Review } from '../../services/reviews.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-my-reviews',
  standalone: true,
  imports: [CommonModule, UiHeaderComponent],
  template: `
    <div class="reviews-container">
      <ui-header
        title="Mes avis"
        subtitle="Avis clients reçus"
        [showBack]="true"
        backRoute="/profile"
      />

      <div class="reviews-content">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement...</p>
          </div>
        } @else if (reviews().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">⭐</div>
            <h3>Aucun avis</h3>
            <p>Vous n'avez pas encore reçu d'avis</p>
          </div>
        } @else {
          <div class="reviews-list">
            @for (review of reviews(); track review.id) {
              <div class="review-card">
                <div class="review-header">
                  <div class="reviewer-info">
                    <span class="reviewer-name">
                      {{ review.client?.firstName || 'Client' }}
                    </span>
                    <span class="review-date">{{ formatDate(review.createdAt) }}</span>
                  </div>
                  <div class="review-rating">
                    <span class="stars">{{ getStars(review.rating) }}</span>
                    <span class="rating-value">{{ review.rating }}/5</span>
                  </div>
                </div>

                <div class="review-repair">
                  {{ review.request?.device?.brand }} {{ review.request?.device?.model }}
                  - {{ review.request?.serviceType?.name }}
                </div>

                @if (review.comment) {
                  <p class="review-comment">{{ review.comment }}</p>
                }
              </div>
            }
          </div>
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
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #2563eb;
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

    .reviews-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .review-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .reviewer-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .reviewer-name {
      font-weight: 600;
      color: #1f2937;
    }

    .review-date {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .review-rating {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .stars {
      color: #f59e0b;
    }

    .rating-value {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1f2937;
    }

    .review-repair {
      font-size: 0.875rem;
      color: #6b7280;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .review-comment {
      color: #4b5563;
      line-height: 1.5;
    }
  `],
})
export class MyReviewsComponent implements OnInit {
  private readonly reviewsService = inject(ReviewsService);

  readonly reviews = signal<Review[]>([]);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.loadReviews();
  }

  async loadReviews(): Promise<void> {
    this.isLoading.set(true);

    try {
      const result = await this.reviewsService.getMyReviews();
      this.reviews.set(result.data);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}

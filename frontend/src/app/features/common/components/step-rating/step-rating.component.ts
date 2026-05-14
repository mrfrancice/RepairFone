import { Component, Input, Output, EventEmitter, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReviewsService,
  RatingStep,
  RatingCategory,
  CreateStepRatingDto,
  StepRatingItem,
} from '@app/domains/reviews';

@Component({
  selector: 'app-step-rating',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="step-rating-container">
      <!-- Header -->
      <div class="rating-header">
        <div class="rating-icon">{{ getStepIcon() }}</div>
        <div class="rating-info">
          <h3>{{ reviewsService.getStepLabel(step) }}</h3>
          <p>Notez votre expérience (-5 à +5)</p>
        </div>
        <button class="close-btn" (click)="onClose.emit()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Rating Categories -->
      <div class="rating-categories">
        @for (category of reviewsService.stepRatingCategories; track category.key) {
          <div class="rating-category">
            <div class="category-header">
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-label">{{ category.label }}</span>
              <span
                class="category-value"
                [style.color]="reviewsService.getStepRatingColor(ratings()[category.key] || 0)"
              >
                {{ reviewsService.formatStepRating(ratings()[category.key] || 0) }}
              </span>
            </div>
            <div class="rating-slider-container">
              <span class="slider-label negative">-5</span>
              <input
                type="range"
                class="rating-slider"
                [min]="-5"
                [max]="5"
                [value]="ratings()[category.key] || 0"
                (input)="onRatingChange(category.key, $event)"
                [style.--slider-color]="reviewsService.getStepRatingColor(ratings()[category.key] || 0)"
              />
              <span class="slider-label positive">+5</span>
            </div>
            <div class="rating-labels">
              <span class="rating-label-text">{{ reviewsService.getStepRatingLabel(ratings()[category.key] || 0) }}</span>
            </div>
          </div>
        }
      </div>

      <!-- Comment -->
      <div class="comment-section">
        <label for="comment">Commentaire (optionnel)</label>
        <textarea
          id="comment"
          [(ngModel)]="comment"
          placeholder="Partagez votre expérience..."
          rows="3"
        ></textarea>
      </div>

      <!-- Submit Button -->
      <div class="rating-actions">
        <button
          class="btn btn-secondary"
          (click)="onClose.emit()"
          [disabled]="isSubmitting()"
        >
          Annuler
        </button>
        <button
          class="btn btn-primary"
          (click)="submitRating()"
          [disabled]="isSubmitting() || !hasRatings()"
        >
          @if (isSubmitting()) {
            <span class="spinner"></span>
            Envoi...
          } @else {
            Envoyer la note
          }
        </button>
      </div>

      <!-- Error -->
      @if (error()) {
        <div class="error-message">
          {{ error() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .step-rating-container {
      background: var(--color-surface, white);
      border-radius: 16px;
      padding: 1.5rem;
      max-width: 500px;
      margin: 0 auto;
    }

    .rating-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--color-neutral-200, #EEEEEE);
    }

    .rating-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      box-shadow: var(--shadow-warm, 0 8px 24px rgba(255, 152, 0, 0.20));
    }

    .rating-info {
      flex: 1;
    }

    .rating-info h3 {
      font-family: 'Poppins', 'Inter', sans-serif;
      font-size: 1.125rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--color-neutral-900, #111827);
      margin: 0;
    }

    .rating-info p {
      font-size: 0.875rem;
      color: var(--color-text-secondary, rgba(0, 0, 0, 0.60));
      margin: 0.25rem 0 0;
    }

    .close-btn {
      min-width: 48px;
      min-height: 48px;
      border-radius: 50%;
      border: none;
      background: var(--color-neutral-100, #F5F5F5);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-secondary, rgba(0, 0, 0, 0.60));
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: var(--color-neutral-200, #EEEEEE);
      color: var(--color-text-primary, rgba(0, 0, 0, 0.87));
    }

    .close-btn:focus-visible {
      outline: 2px solid var(--color-primary, #FF9800);
      outline-offset: 2px;
    }

    .rating-categories {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .rating-category {
      background: var(--color-neutral-50, #FAFAFA);
      border-radius: 12px;
      padding: 1rem;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .category-icon {
      font-size: 1.25rem;
    }

    .category-label {
      flex: 1;
      font-weight: 500;
      color: var(--color-text-primary, rgba(0, 0, 0, 0.87));
    }

    .category-value {
      font-weight: 700;
      font-size: 1.125rem;
      min-width: 2.5rem;
      text-align: right;
    }

    .rating-slider-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .slider-label {
      font-size: 0.75rem;
      font-weight: 600;
      min-width: 1.5rem;
      text-align: center;
    }

    .slider-label.negative {
      color: var(--color-error, #F44336);
    }

    .slider-label.positive {
      color: var(--color-success, #4CAF50);
    }

    .rating-slider {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 8px;
      border-radius: 4px;
      background: linear-gradient(to right, var(--color-error, #F44336), var(--color-warning, #FFC107) 50%, var(--color-success, #4CAF50));
      outline: none;
      cursor: pointer;
    }

    .rating-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-surface, white);
      border: 3px solid var(--slider-color, var(--color-warning, #FFC107));
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s;
      /* Touch target is larger than visual thumb */
      box-sizing: content-box;
    }

    .rating-slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }

    .rating-slider::-moz-range-thumb {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-surface, white);
      border: 3px solid var(--slider-color, var(--color-warning, #FFC107));
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    /* Increase touch area for slider track */
    .rating-slider {
      padding: 8px 0;
      margin: -8px 0;
    }

    .rating-labels {
      text-align: center;
      margin-top: 0.5rem;
    }

    .rating-label-text {
      font-size: 0.75rem;
      color: var(--color-text-secondary, rgba(0, 0, 0, 0.60));
      font-weight: 500;
    }

    .comment-section {
      margin-bottom: 1.5rem;
    }

    .comment-section label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-neutral-800, #424242);
      margin-bottom: 0.5rem;
    }

    .comment-section textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--color-neutral-200, #EEEEEE);
      border-radius: 8px;
      font-size: 0.875rem;
      resize: vertical;
      font-family: inherit;
    }

    .comment-section textarea:focus {
      outline: none;
      border-color: var(--color-primary-600, #FB8C00);
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
    }

    .rating-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      flex: 1;
      padding: 0 1.5rem;
      min-height: 48px;
      border-radius: 1rem;
      font-family: 'Inter', sans-serif;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 150ms ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border: none;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn:focus-visible {
      outline: 2px solid var(--color-primary, #FF9800);
      outline-offset: 2px;
    }

    .btn-secondary {
      background: var(--color-neutral-100, #F5F5F5);
      border: none;
      color: var(--color-neutral-600, #757575);
    }

    .btn-secondary:hover:not(:disabled) {
      background: var(--color-neutral-200, #EEEEEE);
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      box-shadow: var(--shadow-warm, 0 8px 24px rgba(255, 152, 0, 0.20));
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 12px 32px rgba(255, 152, 0, 0.30);
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      margin-top: 1rem;
      padding: 0.75rem 1rem;
      background: var(--color-error-light, #FFEBEE);
      border-left: 4px solid var(--color-terracotta, #C62828);
      border-radius: 0.75rem;
      color: var(--color-error-dark, #C62828);
      font-size: 0.875rem;
      text-align: center;
    }
  `]
})
export class StepRatingComponent {
  readonly reviewsService = inject(ReviewsService);

  @Input({ required: true }) requestId!: string;
  @Input({ required: true }) step!: RatingStep;
  @Output() onClose = new EventEmitter<void>();
  @Output() onRated = new EventEmitter<void>();

  readonly ratings = signal<Record<string, number>>({});
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);
  comment = '';

  getStepIcon(): string {
    switch (this.step) {
      case RatingStep.QUOTE_ACCEPTED: return '📝';
      case RatingStep.IN_PROGRESS: return '🔧';
      case RatingStep.COMPLETED: return '✅';
      case RatingStep.DELIVERED: return '📦';
      default: return '⭐';
    }
  }

  onRatingChange(category: RatingCategory, event: Event): void {
    const value = parseInt((event.target as HTMLInputElement).value, 10);
    this.ratings.update(r => ({ ...r, [category]: value }));
  }

  hasRatings(): boolean {
    return Object.keys(this.ratings()).length > 0;
  }

  async submitRating(): Promise<void> {
    if (!this.hasRatings()) return;

    this.isSubmitting.set(true);
    this.error.set(null);

    try {
      const ratingItems: StepRatingItem[] = Object.entries(this.ratings()).map(([category, rating]) => ({
        category: category as RatingCategory,
        rating,
      }));

      const dto: CreateStepRatingDto = {
        requestId: this.requestId,
        step: this.step,
        ratings: ratingItems,
        comment: this.comment || undefined,
      };

      await this.reviewsService.createStepRating(dto);
      this.onRated.emit();
      this.onClose.emit();
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de l\'envoi de la note');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

import { Component, Input, Output, EventEmitter, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReviewsService,
  RatingStep,
  RatingCategory,
  CreateStepRatingDto,
  StepRatingItem,
} from '../../../features/reviews/services/reviews.service';

@Component({
  selector: 'app-step-rating',
  standalone: true,
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
      background: white;
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
      border-bottom: 1px solid #e5e7eb;
    }

    .rating-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #f97316, #ea580c);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .rating-info {
      flex: 1;
    }

    .rating-info h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

    .rating-info p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: #f1f5f9;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .rating-categories {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .rating-category {
      background: #f8fafc;
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
      color: #1e293b;
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
      color: #ef4444;
    }

    .slider-label.positive {
      color: #10b981;
    }

    .rating-slider {
      flex: 1;
      -webkit-appearance: none;
      appearance: none;
      height: 8px;
      border-radius: 4px;
      background: linear-gradient(to right, #ef4444, #f59e0b 50%, #10b981);
      outline: none;
      cursor: pointer;
    }

    .rating-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
      border: 3px solid var(--slider-color, #f59e0b);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s;
    }

    .rating-slider::-webkit-slider-thumb:hover {
      transform: scale(1.1);
    }

    .rating-slider::-moz-range-thumb {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: white;
      border: 3px solid var(--slider-color, #f59e0b);
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }

    .rating-labels {
      text-align: center;
      margin-top: 0.5rem;
    }

    .rating-label-text {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    .comment-section {
      margin-bottom: 1.5rem;
    }

    .comment-section label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .comment-section textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      font-size: 0.875rem;
      resize: vertical;
      font-family: inherit;
    }

    .comment-section textarea:focus {
      outline: none;
      border-color: #f97316;
      box-shadow: 0 0 0 3px rgba(249, 115, 22, 0.1);
    }

    .rating-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      flex: 1;
      padding: 0.875rem 1.5rem;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background: #f1f5f9;
      border: none;
      color: #475569;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e2e8f0;
    }

    .btn-primary {
      background: linear-gradient(135deg, #f97316, #ea580c);
      border: none;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
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
      padding: 0.75rem;
      background: #fef2f2;
      border: 1px solid #fee2e2;
      border-radius: 8px;
      color: #dc2626;
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

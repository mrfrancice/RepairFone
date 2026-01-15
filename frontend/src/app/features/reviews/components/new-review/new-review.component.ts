import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReviewsService, CreateReviewDto, SubRatings } from '../../services/reviews.service';
import { RequestsService, RepairRequest } from '../../../requests/services/requests.service';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiStepperComponent } from '../../../../shared/components/ui-stepper/ui-stepper.component';

@Component({
  selector: 'app-new-review',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiCardComponent,
    UiButtonComponent,
    UiLoadingComponent,
    UiStepperComponent,
  ],
  template: `
    <div class="new-review">
      <!-- Header -->
      <header class="header">
        <button class="back-btn" (click)="goBack()">← Retour</button>
        <h1>Laisser un avis</h1>
        <p class="subtitle">Partagez votre expérience</p>
      </header>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="loading-container">
          <ui-loading size="lg" />
          <p>Chargement...</p>
        </div>
      }

      <!-- Error - no request -->
      @if (!isLoading() && !request()) {
        <ui-card class="error-card">
          <p>Demande non trouvée</p>
          <ui-button variant="primary" routerLink="/requests">
            Retour aux demandes
          </ui-button>
        </ui-card>
      }

      @if (!isLoading() && request()) {
        <!-- Stepper -->
        <ui-stepper
          [steps]="steps"
          [currentStep]="currentStep()"
          class="stepper"
        />

        <!-- Step 1: Overall Rating -->
        @if (currentStep() === 0) {
          <div class="step-content">
            <!-- Repair Summary -->
            <ui-card class="summary-card">
              <div class="repair-summary">
                <div class="device-info">
                  <span class="device-icon">📱</span>
                  <div class="device-details">
                    <span class="device-name">
                      {{ request()?.device?.brand }} {{ request()?.device?.model }}
                    </span>
                    <span class="service-type">{{ request()?.serviceType?.name }}</span>
                  </div>
                </div>
                <div class="repairer-info">
                  <span class="label">Réparateur:</span>
                  <span class="value">
                    {{ request()?.repairer?.repairerProfile?.businessName ||
                       (request()?.repairer?.firstName + ' ' + request()?.repairer?.lastName) }}
                  </span>
                </div>
              </div>
            </ui-card>

            <h2>Note globale</h2>
            <p class="step-description">Comment évaluez-vous cette réparation ?</p>

            <div class="star-rating">
              @for (star of [1, 2, 3, 4, 5]; track star) {
                <button
                  type="button"
                  class="star-btn"
                  [class.active]="overallRating >= star"
                  [class.hover]="hoverRating >= star && hoverRating > 0"
                  (click)="setOverallRating(star)"
                  (mouseenter)="hoverRating = star"
                  (mouseleave)="hoverRating = 0"
                >
                  {{ (overallRating >= star || hoverRating >= star) ? '★' : '☆' }}
                </button>
              }
            </div>
            <p class="rating-label" [style.color]="reviewsService.getRatingColor(overallRating)">
              {{ overallRating > 0 ? reviewsService.getRatingLabel(overallRating) : 'Sélectionnez une note' }}
            </p>
          </div>
        }

        <!-- Step 2: Sub-Ratings -->
        @if (currentStep() === 1) {
          <div class="step-content">
            <h2>Notes détaillées</h2>
            <p class="step-description">Évaluez chaque aspect de la réparation</p>

            <div class="sub-ratings">
              @for (category of reviewsService.subRatingCategories; track category.key) {
                <ui-card class="sub-rating-card">
                  <div class="sub-rating-header">
                    <span class="sub-rating-icon">{{ category.icon }}</span>
                    <div class="sub-rating-info">
                      <span class="sub-rating-label">{{ category.label }}</span>
                      <span class="sub-rating-desc">{{ category.description }}</span>
                    </div>
                  </div>

                  <div class="sub-rating-stars">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <button
                        type="button"
                        class="star-btn small"
                        [class.active]="subRatings[category.key] >= star"
                        (click)="setSubRating(category.key, star)"
                      >
                        {{ subRatings[category.key] >= star ? '★' : '☆' }}
                      </button>
                    }
                  </div>
                </ui-card>
              }
            </div>
          </div>
        }

        <!-- Step 3: Comment & Photos -->
        @if (currentStep() === 2) {
          <div class="step-content">
            <h2>Votre avis</h2>
            <p class="step-description">Partagez votre expérience et ajoutez des photos</p>

            <div class="form-group">
              <label>Commentaire</label>
              <textarea
                [(ngModel)]="comment"
                placeholder="Décrivez votre expérience avec ce réparateur..."
                rows="5"
              ></textarea>
              <span class="char-hint">{{ comment.length }} caractères</span>
            </div>

            <div class="photos-section">
              <label>Photos après réparation (optionnel)</label>
              <p class="photos-hint">Montrez le résultat de la réparation</p>

              <div class="photos-grid">
                @for (photo of photos; track $index) {
                  <div class="photo-item">
                    <img [src]="photo" alt="Photo {{ $index + 1 }}" />
                    <button class="remove-btn" (click)="removePhoto($index)">×</button>
                  </div>
                }

                @if (photos.length < 5) {
                  <label class="add-photo-btn">
                    <input
                      type="file"
                      accept="image/*"
                      (change)="onPhotoSelected($event)"
                      hidden
                    />
                    <span class="icon">📷</span>
                    <span class="label">Ajouter</span>
                  </label>
                }
              </div>
            </div>
          </div>
        }

        <!-- Step 4: Confirm -->
        @if (currentStep() === 3) {
          <div class="step-content">
            <h2>Récapitulatif</h2>
            <p class="step-description">Vérifiez votre avis avant publication</p>

            <ui-card class="recap-card">
              <!-- Overall Rating -->
              <div class="recap-section">
                <label>Note globale</label>
                <div class="recap-rating">
                  <div class="stars">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <span [class.active]="overallRating >= star">★</span>
                    }
                  </div>
                  <span class="rating-text" [style.color]="reviewsService.getRatingColor(overallRating)">
                    {{ reviewsService.getRatingLabel(overallRating) }}
                  </span>
                </div>
              </div>

              <!-- Sub-Ratings -->
              <div class="recap-section">
                <label>Notes détaillées</label>
                <div class="recap-sub-ratings">
                  @for (category of reviewsService.subRatingCategories; track category.key) {
                    <div class="recap-sub-rating">
                      <span class="icon">{{ category.icon }}</span>
                      <span class="name">{{ category.label }}</span>
                      <div class="mini-stars">
                        @for (star of [1, 2, 3, 4, 5]; track star) {
                          <span [class.active]="subRatings[category.key] >= star">★</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Comment -->
              @if (comment.trim()) {
                <div class="recap-section">
                  <label>Commentaire</label>
                  <p class="recap-comment">{{ comment }}</p>
                </div>
              }

              <!-- Photos -->
              @if (photos.length > 0) {
                <div class="recap-section">
                  <label>Photos ({{ photos.length }})</label>
                  <div class="recap-photos">
                    @for (photo of photos; track $index) {
                      <img [src]="photo" alt="Photo {{ $index + 1 }}" />
                    }
                  </div>
                </div>
              }
            </ui-card>

            @if (error()) {
              <div class="error-alert">{{ error() }}</div>
            }
          </div>
        }

        <!-- Navigation -->
        <div class="navigation">
          @if (currentStep() > 0) {
            <ui-button variant="outline" (onClick)="previousStep()">
              ← Précédent
            </ui-button>
          } @else {
            <div></div>
          }

          @if (currentStep() < 3) {
            <ui-button
              variant="primary"
              [disabled]="!canProceed()"
              (onClick)="nextStep()"
            >
              Suivant →
            </ui-button>
          } @else {
            <ui-button
              variant="primary"
              [loading]="isSubmitting()"
              (onClick)="submit()"
            >
              Publier mon avis
            </ui-button>
          }
        </div>

        <!-- Success Modal -->
        @if (showSuccess()) {
          <div class="modal-overlay">
            <div class="modal-content">
              <div class="success-icon">🎉</div>
              <h3>Merci pour votre avis !</h3>
              <p>Votre évaluation aide les autres utilisateurs à choisir leur réparateur.</p>
              <div class="modal-actions">
                <ui-button variant="primary" (onClick)="goToRequest()">
                  Voir la réparation
                </ui-button>
                <ui-button variant="outline" routerLink="/reviews/my">
                  Mes avis
                </ui-button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .new-review {
      min-height: 100vh;
      background: #f9fafb;
      padding-bottom: 6rem;
    }

    .header {
      background: white;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;

      .back-btn {
        background: none;
        border: none;
        color: #3b82f6;
        font-size: 0.875rem;
        cursor: pointer;
        padding: 0;
        margin-bottom: 0.5rem;
      }

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 0.25rem 0;
      }

      .subtitle {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: #64748b;
    }

    .error-card {
      margin: 1rem;
      padding: 2rem;
      text-align: center;

      p {
        color: #dc2626;
        margin: 0 0 1rem 0;
      }
    }

    .stepper {
      padding: 1rem;
      background: white;
      margin-bottom: 1rem;
    }

    .step-content {
      padding: 1rem;

      h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.25rem 0;
      }

      .step-description {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0 0 1.5rem 0;
      }
    }

    .summary-card {
      padding: 1rem;
      margin-bottom: 1.5rem;

      .repair-summary {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .device-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .device-icon {
        font-size: 1.5rem;
      }

      .device-details {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .device-name {
        font-weight: 600;
        color: #1e293b;
      }

      .service-type {
        font-size: 0.8125rem;
        color: #64748b;
      }

      .repairer-info {
        display: flex;
        gap: 0.5rem;
        font-size: 0.875rem;

        .label {
          color: #64748b;
        }

        .value {
          color: #1e293b;
          font-weight: 500;
        }
      }
    }

    .star-rating {
      display: flex;
      justify-content: center;
      gap: 0.75rem;
      padding: 1.5rem 0;
    }

    .star-btn {
      background: none;
      border: none;
      font-size: 3rem;
      cursor: pointer;
      color: #d1d5db;
      transition: color 0.2s, transform 0.2s;

      &.active,
      &.hover {
        color: #f59e0b;
      }

      &:hover {
        transform: scale(1.15);
      }

      &.small {
        font-size: 1.75rem;
      }
    }

    .rating-label {
      text-align: center;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0;
    }

    .sub-ratings {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .sub-rating-card {
      padding: 1rem;

      .sub-rating-header {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .sub-rating-icon {
        font-size: 1.5rem;
      }

      .sub-rating-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .sub-rating-label {
        font-weight: 600;
        color: #1e293b;
      }

      .sub-rating-desc {
        font-size: 0.75rem;
        color: #64748b;
      }

      .sub-rating-stars {
        display: flex;
        gap: 0.5rem;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 0.9375rem;
        resize: vertical;
        min-height: 120px;

        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }

      .char-hint {
        display: block;
        font-size: 0.75rem;
        color: #94a3b8;
        margin-top: 0.25rem;
        text-align: right;
      }
    }

    .photos-section {
      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.25rem;
      }

      .photos-hint {
        font-size: 0.75rem;
        color: #94a3b8;
        margin: 0 0 0.75rem 0;
      }
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .photo-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 0.5rem;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .remove-btn {
        position: absolute;
        top: 0.25rem;
        right: 0.25rem;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .add-photo-btn {
      aspect-ratio: 1;
      border: 2px dashed #cbd5e1;
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #3b82f6;
        background: #eff6ff;
      }

      .icon {
        font-size: 1.5rem;
      }

      .label {
        font-size: 0.75rem;
        color: #64748b;
      }
    }

    .recap-card {
      padding: 1rem;

      .recap-section {
        padding: 0.75rem 0;
        border-bottom: 1px solid #f1f5f9;

        &:last-child {
          border-bottom: none;
        }

        label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }
      }

      .recap-rating {
        display: flex;
        align-items: center;
        gap: 1rem;

        .stars {
          display: flex;
          gap: 0.25rem;

          span {
            font-size: 1.5rem;
            color: #d1d5db;

            &.active {
              color: #f59e0b;
            }
          }
        }

        .rating-text {
          font-weight: 600;
          font-size: 1rem;
        }
      }

      .recap-sub-ratings {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .recap-sub-rating {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .icon {
          font-size: 1rem;
        }

        .name {
          flex: 1;
          font-size: 0.875rem;
          color: #475569;
        }

        .mini-stars {
          display: flex;
          gap: 0.125rem;

          span {
            font-size: 0.875rem;
            color: #d1d5db;

            &.active {
              color: #f59e0b;
            }
          }
        }
      }

      .recap-comment {
        font-size: 0.875rem;
        color: #475569;
        line-height: 1.6;
        margin: 0;
      }

      .recap-photos {
        display: flex;
        gap: 0.5rem;

        img {
          width: 3.5rem;
          height: 3.5rem;
          object-fit: cover;
          border-radius: 0.375rem;
        }
      }
    }

    .error-alert {
      padding: 0.875rem;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      color: #dc2626;
      font-size: 0.875rem;
      margin-top: 1rem;
    }

    .navigation {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-top: 1px solid #e2e8f0;
      z-index: 10;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      text-align: center;

      .success-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 0.5rem 0;
      }

      p {
        color: #64748b;
        font-size: 0.875rem;
        margin: 0 0 1.5rem 0;
      }

      .modal-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  `],
})
export class NewReviewComponent implements OnInit {
  readonly reviewsService = inject(ReviewsService);
  private readonly requestsService = inject(RequestsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly request = signal<RepairRequest | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentStep = signal(0);
  readonly showSuccess = signal(false);

  readonly steps = [
    { label: 'Note', icon: '⭐' },
    { label: 'Détails', icon: '📊' },
    { label: 'Avis', icon: '💬' },
    { label: 'Confirmer', icon: '✓' },
  ];

  overallRating = 0;
  hoverRating = 0;
  subRatings: SubRatings = {
    quality: 0,
    communication: 0,
    timeliness: 0,
  };
  comment = '';
  photos: string[] = [];

  ngOnInit(): void {
    const requestId = this.route.snapshot.queryParams['requestId'];
    if (requestId) {
      this.loadRequest(requestId);
    } else {
      this.router.navigate(['/requests']);
    }
  }

  async loadRequest(id: string): Promise<void> {
    this.isLoading.set(true);

    try {
      const request = await this.requestsService.getRequest(id);

      // Check if already reviewed
      const existingReview = await this.reviewsService.getReviewByRequest(id);
      if (existingReview) {
        this.router.navigate(['/tracking', id]);
        return;
      }

      this.request.set(request);
    } catch (err) {
      console.error('Error loading request:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  setOverallRating(value: number): void {
    this.overallRating = value;
  }

  setSubRating(key: keyof SubRatings, value: number): void {
    this.subRatings = {
      ...this.subRatings,
      [key]: value,
    };
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.photos.length < 5) {
      const reader = new FileReader();
      reader.onload = () => {
        this.photos = [...this.photos, reader.result as string];
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removePhoto(index: number): void {
    this.photos = this.photos.filter((_, i) => i !== index);
  }

  canProceed(): boolean {
    switch (this.currentStep()) {
      case 0:
        return this.overallRating > 0;
      case 1:
        return this.subRatings.quality > 0 &&
               this.subRatings.communication > 0 &&
               this.subRatings.timeliness > 0;
      case 2:
        return true; // Comment and photos are optional
      case 3:
        return true;
      default:
        return false;
    }
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep() < 3) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(step => step - 1);
    }
  }

  async submit(): Promise<void> {
    if (!this.request()) return;

    this.error.set(null);
    this.isSubmitting.set(true);

    try {
      const dto: CreateReviewDto = {
        requestId: this.request()!.id,
        rating: this.overallRating,
        subRatings: this.subRatings,
        comment: this.comment.trim() || undefined,
        photos: this.photos.length > 0 ? this.photos : undefined,
      };

      await this.reviewsService.createReview(dto);
      this.showSuccess.set(true);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de la publication');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goToRequest(): void {
    const request = this.request();
    if (request) {
      this.router.navigate(['/tracking', request.id]);
    }
  }

  goBack(): void {
    if (this.currentStep() > 0) {
      this.previousStep();
    } else {
      window.history.back();
    }
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConseilsService, Expert } from '../../services/conseils.service';
import { ConseilsStore } from '../../stores/conseils.store';
import { AuthStore } from '../../../../core/stores/auth.store';

@Component({
  selector: 'app-expert-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="detail-container">
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>
      } @else if (expert()) {
        <!-- Header -->
        <header class="detail-header">
          <button class="back-btn" (click)="goBack()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <div class="expert-hero">
            <div class="expert-avatar">
              @if (expert()?.avatarUrl) {
                <img [src]="expert()?.avatarUrl" [alt]="expert()?.firstName" />
              } @else {
                <div class="avatar-placeholder">
                  {{ getInitials() }}
                </div>
              }
              @if (expert()?.isAvailable) {
                <span class="status-badge available">Disponible</span>
              } @else {
                <span class="status-badge unavailable">Indisponible</span>
              }
            </div>

            <h1>{{ expert()?.firstName }} {{ expert()?.lastName }}</h1>

            <div class="expert-rating">
              <span class="stars">{{ getStars(expert()?.rating || 0) }}</span>
              <span class="rating-value">{{ (expert()?.rating || 0).toFixed(1) }}</span>
              <span class="review-count">({{ expert()?.reviewCount || 0 }} avis)</span>
            </div>

            <div class="expert-stats">
              <div class="stat">
                <span class="stat-value">{{ expert()?.yearsOfExperience }}</span>
                <span class="stat-label">ans d'exp.</span>
              </div>
              <div class="stat">
                <span class="stat-value">~{{ expert()?.responseTime }}</span>
                <span class="stat-label">min réponse</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ expert()?.pricePerSession | number }}</span>
                <span class="stat-label">FCFA/session</span>
              </div>
            </div>
          </div>
        </header>

        <!-- Content -->
        <div class="detail-content">
          <!-- Bio -->
          @if (expert()?.bio) {
            <section class="section">
              <h2>À propos</h2>
              <p>{{ expert()?.bio }}</p>
            </section>
          }

          <!-- Specialties -->
          <section class="section">
            <h2>Spécialités</h2>
            <div class="specialties-list">
              @for (specialty of expert()?.specialties || []; track specialty) {
                <span class="specialty-chip">{{ specialty }}</span>
              }
            </div>
          </section>

          <!-- Conseil types -->
          <section class="section">
            <h2>Types de conseils</h2>
            <div class="conseil-types-list">
              @for (type of expert()?.conseilTypes || []; track type) {
                <div class="conseil-type-item">
                  <span class="type-icon">{{ getTypeIcon(type) }}</span>
                  <span class="type-label">{{ getTypeLabel(type) }}</span>
                </div>
              }
            </div>
          </section>

          <!-- Request Form -->
          @if (expert()?.isAvailable) {
            <section class="section request-section">
              <h2>Demander un conseil</h2>

              <div class="form-group">
                <label>Sujet (optionnel)</label>
                <input
                  type="text"
                  [(ngModel)]="subject"
                  placeholder="Ex: Écran cassé iPhone 12"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Description (optionnel)</label>
                <textarea
                  [(ngModel)]="description"
                  placeholder="Décrivez votre problème ou votre question..."
                  class="form-textarea"
                  rows="3"
                ></textarea>
              </div>

              <div class="price-summary">
                <span>Prix de la session</span>
                <span class="price">{{ expert()?.pricePerSession | number }} FCFA</span>
              </div>
            </section>
          }
        </div>

        <!-- Footer CTA -->
        <footer class="detail-footer">
          @if (expert()?.isAvailable) {
            <button
              class="btn btn-primary btn-block"
              (click)="requestConseil()"
              [disabled]="isSubmitting()"
            >
              @if (isSubmitting()) {
                Envoi en cours...
              } @else {
                Demander un conseil
              }
            </button>
          } @else {
            <button class="btn btn-disabled btn-block" disabled>
              Expert indisponible
            </button>
          }
        </footer>
      } @else {
        <div class="error-state">
          <p>Expert non trouvé</p>
          <button class="btn btn-primary" (click)="goBack()">Retour</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-container {
      min-height: 100vh;
      background: #f9fafb;
      padding-bottom: 100px;
    }

    .loading-state, .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #7c3aed;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .detail-header {
      background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
      color: white;
      padding: 1rem;
      padding-top: calc(1rem + env(safe-area-inset-top, 0));
      padding-bottom: 2rem;
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
      margin-bottom: 1rem;
    }

    .expert-hero {
      text-align: center;
    }

    .expert-avatar {
      position: relative;
      display: inline-block;
      margin-bottom: 1rem;
    }

    .expert-avatar img,
    .avatar-placeholder {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid rgba(255, 255, 255, 0.3);
    }

    .avatar-placeholder {
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 2rem;
    }

    .status-badge {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;
    }

    .status-badge.available {
      background: #10b981;
      color: white;
    }

    .status-badge.unavailable {
      background: #ef4444;
      color: white;
    }

    .expert-hero h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .expert-rating {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .stars {
      color: #fbbf24;
    }

    .rating-value {
      font-weight: 600;
    }

    .review-count {
      opacity: 0.8;
      font-size: 0.875rem;
    }

    .expert-stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .detail-content {
      padding: 1rem;
    }

    .section {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .section h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.75rem;
    }

    .section p {
      color: #4b5563;
      line-height: 1.6;
    }

    .specialties-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .specialty-chip {
      background: #faf5ff;
      color: #7c3aed;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .conseil-types-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .conseil-type-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 8px;
    }

    .type-icon {
      font-size: 1.5rem;
    }

    .type-label {
      font-weight: 500;
      color: #1f2937;
    }

    .request-section {
      border: 2px solid #7c3aed;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #7c3aed;
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .price-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #faf5ff;
      border-radius: 8px;
    }

    .price {
      font-size: 1.25rem;
      font-weight: 700;
      color: #7c3aed;
    }

    .detail-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      padding: 1rem;
      padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0));
      box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
    }

    .btn {
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #7c3aed;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #6d28d9;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-disabled {
      background: #d1d5db;
      color: #6b7280;
      cursor: not-allowed;
    }

    .btn-block {
      width: 100%;
    }
  `],
})
export class ExpertDetailComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly conseilsService = inject(ConseilsService);
  private readonly authStore = inject(AuthStore);
  readonly store = inject(ConseilsStore);

  readonly expert = signal<Expert | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);

  subject = '';
  description = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadExpert(id);
    }
  }

  async loadExpert(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const expert = await this.conseilsService.getExpert(id);
      this.expert.set(expert);
      if (expert) {
        this.store.setSelectedExpert(expert);
      }
    } catch (err) {
      console.error('Error loading expert:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async requestConseil(): Promise<void> {
    if (!this.authStore.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const expert = this.expert();
    const type = this.store.selectedType();
    const format = this.store.selectedFormat();

    if (!expert || !type || !format) {
      // Navigate back to type selection if missing
      this.router.navigate(['/conseils']);
      return;
    }

    this.isSubmitting.set(true);
    try {
      const session = await this.conseilsService.createConseilRequest({
        expertId: expert.id,
        type,
        format,
        subject: this.subject || undefined,
        description: this.description || undefined,
      });

      this.store.setCurrentSession(session);
      this.router.navigate(['/conseils/chat', session.id]);
    } catch (err) {
      console.error('Error creating session:', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  getInitials(): string {
    const exp = this.expert();
    if (exp) {
      return `${exp.firstName[0]}${exp.lastName[0]}`.toUpperCase();
    }
    return '';
  }

  getStars(rating: number): string {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '☆' : '') + '☆'.repeat(empty);
  }

  getTypeIcon(type: string): string {
    const types = this.conseilsService.getConseilTypes();
    return types.find((t) => t.type === type)?.icon || '💬';
  }

  getTypeLabel(type: string): string {
    const types = this.conseilsService.getConseilTypes();
    return types.find((t) => t.type === type)?.label || type;
  }

  goBack(): void {
    this.router.navigate(['/conseils/experts']);
  }
}

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  ContentChild,
  TemplateRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiSkeletonComponent, SkeletonVariant } from '../ui-skeleton/ui-skeleton.component';

@Component({
  selector: 'ui-list-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, UiSkeletonComponent],
  template: `
    <!-- Loading State -->
    @if (isLoading) {
      <div class="loading-state">
        <ui-skeleton
          [variant]="skeletonVariant"
          [count]="skeletonCount"
          animation="shimmer"
          [ariaLabel]="loadingMessage"
        />
      </div>
    }

    <!-- Error State -->
    @else if (error) {
      <div class="error-state">
        <div class="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h3>{{ errorTitle }}</h3>
        <p>{{ error }}</p>
        @if (showRetry) {
          <button class="btn btn-primary" (click)="onRetry.emit()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Réessayer
          </button>
        }
      </div>
    }

    <!-- Empty State -->
    @else if (isEmpty) {
      <div class="empty-state">
        <div class="empty-icon">
          @if (emptyIconTemplate) {
            <ng-container *ngTemplateOutlet="emptyIconTemplate"></ng-container>
          } @else {
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          }
        </div>
        <h3>{{ emptyTitle }}</h3>
        <p>{{ emptyMessage }}</p>
        @if (emptyActionTemplate) {
          <ng-container *ngTemplateOutlet="emptyActionTemplate"></ng-container>
        }
      </div>
    }

    <!-- Content -->
    @else {
      <div class="list-content">
        <ng-content></ng-content>
      </div>

      <!-- Load More -->
      @if (hasMore && !isLoadingMore) {
        <div class="load-more">
          <button class="btn btn-secondary" (click)="onLoadMore.emit()">
            Charger plus
          </button>
        </div>
      }

      @if (isLoadingMore) {
        <div class="loading-more">
          <div class="spinner-small"></div>
        </div>
      }
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 2rem 1rem;
    }

    /* Error State */
    .error-state {
      text-align: center;
      padding: 3rem 1rem;
      background: #FFEBEE;
      border-radius: 16px;
      border: 1px solid #FFCDD2;
    }

    .error-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #FFEBEE;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: var(--color-terracotta, #C62828);
    }

    .error-state h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #991b1b;
      margin-bottom: 0.5rem;
    }

    .error-state p {
      color: var(--color-terracotta, #C62828);
      margin-bottom: 1.5rem;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 1rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .empty-icon {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-50, #FFF3E0), var(--color-primary-100, #FFE0B2));
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      color: var(--color-primary-500, #FF9800);
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #6B7280;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    /* List Content */
    .list-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* Load More */
    .load-more {
      display: flex;
      justify-content: center;
      padding: 1.5rem 1rem;
    }

    .loading-more {
      display: flex;
      justify-content: center;
      padding: 2rem 1rem;
    }

    .spinner-small {
      width: 32px;
      height: 32px;
      border: 3px solid var(--color-neutral-100, #F5F5F5);
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-gold-800, #F9A825) 100%);
      color: white;
      box-shadow: var(--shadow-warm, 0 8px 24px rgba(255, 152, 0, 0.20));
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(255, 152, 0, 0.30);
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #4B5563;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
      transform: translateY(-2px);
    }
  `],
})
export class UiListContainerComponent {
  // State inputs
  @Input() isLoading = false;
  @Input() isLoadingMore = false;
  @Input() isEmpty = false;
  @Input() hasMore = false;
  @Input() error: string | null = null;

  // Loading configuration
  @Input() skeletonVariant: SkeletonVariant = 'card';
  @Input() skeletonCount = 4;
  @Input() loadingMessage = 'Chargement...';

  // Error configuration
  @Input() errorTitle = 'Erreur';
  @Input() showRetry = true;

  // Empty state configuration
  @Input() emptyTitle = 'Aucun élément';
  @Input() emptyMessage = 'Il n\'y a aucun élément à afficher.';

  // Template refs for customization
  @ContentChild('emptyIcon') emptyIconTemplate?: TemplateRef<unknown>;
  @ContentChild('emptyAction') emptyActionTemplate?: TemplateRef<unknown>;

  // Events
  @Output() onRetry = new EventEmitter<void>();
  @Output() onLoadMore = new EventEmitter<void>();
}

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LoadingSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'ui-loading',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (overlay) {
      <div class="loading-overlay">
        <div class="loading-content">
          <div class="spinner" [class]="'spinner-' + size"></div>
          @if (text) {
            <p class="loading-text">{{ text }}</p>
          }
        </div>
      </div>
    } @else {
      <div class="loading-inline" [class.centered]="centered">
        <div class="spinner" [class]="'spinner-' + size"></div>
        @if (text) {
          <p class="loading-text">{{ text }}</p>
        }
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-content,
    .loading-inline {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .loading-inline.centered {
      justify-content: center;
      min-height: 200px;
    }

    .spinner {
      border: 3px solid var(--color-neutral-200, #EEEEEE);
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }

    .spinner-sm {
      width: 20px;
      height: 20px;
      border-width: 2px;
    }

    .spinner-md {
      width: 36px;
      height: 36px;
    }

    .spinner-lg {
      width: 48px;
      height: 48px;
      border-width: 4px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-text {
      color: var(--color-text-secondary, rgba(0, 0, 0, 0.60));
      font-size: 0.875rem;
      margin: 0;
    }
  `]
})
export class UiLoadingComponent {
  @Input() size: LoadingSize = 'md';
  @Input() text?: string;
  @Input() overlay = false;
  @Input() centered = true;
}

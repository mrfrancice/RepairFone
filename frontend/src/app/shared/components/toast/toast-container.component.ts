import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast, ToastType } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" aria-live="polite" aria-atomic="true">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="toast"
          [class]="'toast-' + toast.type"
          role="alert"
        >
          <div class="toast-icon">
            {{ getIcon(toast.type) }}
          </div>
          <div class="toast-content">
            @if (toast.title) {
              <div class="toast-title">{{ toast.title }}</div>
            }
            <div class="toast-message">{{ toast.message }}</div>
          </div>
          @if (toast.dismissible) {
            <button
              class="toast-close"
              (click)="dismiss(toast.id)"
              aria-label="Fermer"
            >
              x
            </button>
          }
          <div class="toast-progress" [style.animation-duration.ms]="toast.duration"></div>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 380px;
      width: calc(100vw - 2rem);
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 12px;
      background: white;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-out;
      position: relative;
      overflow: hidden;
      pointer-events: auto;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      flex-shrink: 0;
    }

    .toast-success .toast-icon {
      background: #dcfce7;
      color: #16a34a;
    }

    .toast-error .toast-icon {
      background: #fee2e2;
      color: #dc2626;
    }

    .toast-warning .toast-icon {
      background: #fef3c7;
      color: #d97706;
    }

    .toast-info .toast-icon {
      background: #dbeafe;
      color: #2563eb;
    }

    .toast-content {
      flex: 1;
      min-width: 0;
    }

    .toast-title {
      font-weight: 600;
      font-size: 0.875rem;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .toast-message {
      font-size: 0.875rem;
      color: #4b5563;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      font-size: 1.125rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .toast-close:hover {
      color: #4b5563;
    }

    .toast-progress {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      width: 100%;
      background: currentColor;
      opacity: 0.3;
      animation: progress linear forwards;
      transform-origin: left;
    }

    @keyframes progress {
      from {
        transform: scaleX(1);
      }
      to {
        transform: scaleX(0);
      }
    }

    .toast-success .toast-progress { color: #16a34a; }
    .toast-error .toast-progress { color: #dc2626; }
    .toast-warning .toast-progress { color: #d97706; }
    .toast-info .toast-progress { color: #2563eb; }

    /* Mobile adjustments */
    @media (max-width: 480px) {
      .toast-container {
        top: auto;
        bottom: 1rem;
        left: 1rem;
        right: 1rem;
        width: auto;
      }

      .toast {
        animation-name: slideUp;
      }

      @keyframes slideUp {
        from {
          transform: translateY(100%);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  getIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = {
      success: '✓',
      error: '!',
      warning: '⚠',
      info: 'i',
    };
    return icons[type];
  }

  dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}

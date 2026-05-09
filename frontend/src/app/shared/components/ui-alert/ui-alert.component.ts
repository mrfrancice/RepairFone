import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'ui-alert',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="alert" [class]="'alert-' + type" role="alert">
      <span class="alert-icon">{{ getIcon() }}</span>
      <div class="alert-content">
        @if (title) {
          <strong class="alert-title">{{ title }}</strong>
        }
        <span class="alert-message">
          <ng-content></ng-content>
        </span>
      </div>
      @if (dismissible) {
        <button class="alert-close" (click)="onDismiss.emit()">✕</button>
      }
    </div>
  `,
  styles: [`
    .alert {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 1rem;
      border-left: 4px solid;
      font-family: 'Inter', sans-serif;
    }

    .alert-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .alert-title {
      font-family: 'Poppins', 'Inter', sans-serif;
      font-weight: 600;
      letter-spacing: -0.005em;
    }

    .alert-message {
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .alert-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      font-size: 1rem;
      opacity: 0.6;
      transition: opacity 150ms ease;
    }

    .alert-close:hover {
      opacity: 1;
    }

    .alert-info {
      background: var(--color-ocean-50, #E3F2FD);
      border-color: var(--color-ocean, #1565C0);
      color: var(--color-info-dark, #1565C0);
    }

    .alert-success {
      background: var(--color-secondary-50, #E8F5E9);
      border-color: var(--color-success, #4CAF50);
      color: var(--color-success-dark, #2E7D32);
    }

    .alert-warning {
      background: #FFF8E1;
      border-color: var(--color-mustard, #FFC107);
      color: #F57C00;
    }

    .alert-error {
      background: var(--color-error-light, #FFEBEE);
      border-color: var(--color-terracotta, #C62828);
      color: var(--color-error-dark, #C62828);
    }
  `]
})
export class UiAlertComponent {
  @Input() type: AlertType = 'info';
  @Input() title?: string;
  @Input() dismissible = false;

  @Output() onDismiss = new EventEmitter<void>();

  getIcon(): string {
    const icons: Record<AlertType, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[this.type];
  }
}

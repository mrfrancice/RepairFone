import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

@Component({
  selector: 'ui-error-state',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="error-state"
      [class]="'severity-' + severity"
      role="alert"
      [attr.aria-live]="severity === 'critical' ? 'assertive' : 'polite'"
    >
      <span class="error-icon" aria-hidden="true">{{ getIcon() }}</span>
      <h3 class="error-title">{{ title }}</h3>
      @if (message) {
        <p class="error-message">{{ message }}</p>
      }
      <div class="error-actions">
        @if (showRetry) {
          <ui-button variant="primary" (onClick)="onRetry.emit()">
            Réessayer
          </ui-button>
        }
        @if (actionLabel) {
          <ui-button variant="outline" (onClick)="onAction.emit()">
            {{ actionLabel }}
          </ui-button>
        }
      </div>
    </div>
  `,
  styles: [`
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      min-height: 250px;
      border-radius: var(--border-radius-lg, 1rem);
      background: var(--color-surface, #FFFFFF);
    }

    .error-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
    }

    .error-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-text-primary, rgba(0, 0, 0, 0.87));
      margin: 0 0 0.5rem;
    }

    .error-message {
      font-size: 0.875rem;
      color: var(--color-text-secondary, #4B5563);
      margin: 0 0 1.5rem;
      max-width: 320px;
    }

    .error-actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      justify-content: center;
    }

    /* Severity: Info */
    .severity-info {
      background: var(--color-ocean-50, #E3F2FD);
      border: 1px solid var(--color-info-light, #64B5F6);
    }

    .severity-info .error-icon { color: var(--color-info, #2196F3); }
    .severity-info .error-title { color: var(--color-info-dark, #1565C0); }

    /* Severity: Warning */
    .severity-warning {
      background: var(--color-gold-50, #FFFDE7);
      border: 1px solid var(--color-warning-light, #FFD54F);
    }

    .severity-warning .error-icon { color: var(--color-warning, #FFC107); }
    .severity-warning .error-title { color: var(--color-warning-dark, #F57C00); }

    /* Severity: Error */
    .severity-error {
      background: var(--color-error-light, #FFEBEE);
      border: 1px solid var(--color-error-light, #EF5350);
    }

    .severity-error .error-icon { color: var(--color-error, #F44336); }
    .severity-error .error-title { color: var(--color-error-dark, #C62828); }

    /* Severity: Critical */
    .severity-critical {
      background: linear-gradient(135deg, var(--color-error-light, #FFEBEE), var(--color-error-100, #FFCDD2));
      border: 2px solid var(--color-error, #F44336);
    }

    .severity-critical .error-icon {
      color: var(--color-error, #F44336);
      animation: pulse 2s infinite;
    }
    .severity-critical .error-title { color: var(--color-error-dark, #C62828); }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class UiErrorStateComponent {
  @Input() icon = '';
  @Input() title = 'Une erreur est survenue';
  @Input() message = '';
  @Input() showRetry = true;
  @Input() actionLabel = '';
  @Input() severity: ErrorSeverity = 'error';

  @Output() onRetry = new EventEmitter<void>();
  @Output() onAction = new EventEmitter<void>();

  getIcon(): string {
    if (this.icon) return this.icon;

    const icons: Record<ErrorSeverity, string> = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨'
    };
    return icons[this.severity];
  }
}

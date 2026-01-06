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
      padding: 1rem;
      border-radius: 8px;
      border: 1px solid;
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
      font-weight: 600;
    }

    .alert-message {
      font-size: 0.875rem;
    }

    .alert-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      font-size: 1rem;
      opacity: 0.6;
      transition: opacity 0.2s;
    }

    .alert-close:hover {
      opacity: 1;
    }

    .alert-info {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1e40af;
    }

    .alert-success {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }

    .alert-warning {
      background: #fffbeb;
      border-color: #fed7aa;
      color: #92400e;
    }

    .alert-error {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
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

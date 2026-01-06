import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UiButtonComponent } from '../ui-button/ui-button.component';

@Component({
  selector: 'ui-empty-state',
  standalone: true,
  imports: [CommonModule, UiButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state">
      @if (icon) {
        <span class="empty-icon">{{ icon }}</span>
      }
      <h3 class="empty-title">{{ title }}</h3>
      @if (description) {
        <p class="empty-description">{{ description }}</p>
      }
      @if (actionLabel) {
        <ui-button [variant]="actionVariant" (onClick)="onAction.emit()">
          {{ actionLabel }}
        </ui-button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      min-height: 250px;
    }

    .empty-icon {
      font-size: 3.5rem;
      margin-bottom: 1rem;
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 0.5rem;
    }

    .empty-description {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 1.5rem;
      max-width: 280px;
    }
  `]
})
export class UiEmptyStateComponent {
  @Input() icon?: string;
  @Input() title = 'Aucun résultat';
  @Input() description?: string;
  @Input() actionLabel?: string;
  @Input() actionVariant: 'primary' | 'outline' = 'primary';

  @Output() onAction = new EventEmitter<void>();
}

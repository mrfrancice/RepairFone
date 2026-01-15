import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';

@Component({
  selector: 'ui-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="badge" [class]="badgeClasses">
      @if (dot) {
        <span class="badge-dot"></span>
      }
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-weight: 500;
      border-radius: var(--border-radius-full, 9999px);
    }

    .badge-sm {
      padding: 0.125rem 0.5rem;
      font-size: 0.75rem;
    }

    .badge-md {
      padding: 0.25rem 0.75rem;
      font-size: 0.875rem;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .badge-default {
      background: var(--color-neutral-100, #F5F5F5);
      color: var(--color-neutral-700, #616161);
    }

    .badge-primary {
      background: var(--color-primary-50, #FFF3E0);
      color: var(--color-primary-700, #F57C00);
    }

    .badge-success {
      background: var(--color-secondary-50, #E8F5E9);
      color: var(--color-success-dark, #2E7D32);
    }

    .badge-warning {
      background: var(--color-gold-50, #FFFDE7);
      color: var(--color-warning-dark, #F57C00);
    }

    .badge-danger {
      background: var(--color-primary-50, #FFF3E0);
      color: var(--color-error, #F44336);
    }

    .badge-info {
      background: var(--color-ocean-50, #E3F2FD);
      color: var(--color-info-dark, #1565C0);
    }
  `]
})
export class UiBadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() size: BadgeSize = 'md';
  @Input() dot = false;

  get badgeClasses(): string {
    return `badge-${this.variant} badge-${this.size}`;
  }
}

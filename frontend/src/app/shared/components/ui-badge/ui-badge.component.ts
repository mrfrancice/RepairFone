import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'premium' | 'neutral';
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
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      letter-spacing: 0;
      border-radius: 9999px;
    }

    .badge-sm {
      padding: 0.125rem 0.5rem;
      font-size: 0.6875rem;
    }

    .badge-md {
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .badge-default,
    .badge-neutral {
      background: var(--color-neutral-100, #F5F5F5);
      color: var(--color-neutral-700, #374151);
    }

    .badge-primary {
      background: var(--color-primary-50, #FFF3E0);
      color: var(--color-primary-900, #E65100);
    }

    .badge-success {
      background: var(--color-secondary-50, #E8F5E9);
      color: var(--color-success-dark, #2E7D32);
    }

    .badge-warning {
      background: #FFF8E1;
      color: #F57C00;
    }

    .badge-danger {
      background: var(--color-error-light, #FFEBEE);
      color: var(--color-terracotta, #C62828);
    }

    .badge-info {
      background: var(--color-ocean-50, #E3F2FD);
      color: var(--color-info-dark, #1565C0);
    }

    .badge-premium {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-gold-800, #F9A825) 100%);
      color: white;
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

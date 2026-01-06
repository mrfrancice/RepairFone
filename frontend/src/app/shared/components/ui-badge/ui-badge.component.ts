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
      border-radius: 9999px;
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
      background: #f3f4f6;
      color: #4b5563;
    }

    .badge-primary {
      background: #eff6ff;
      color: #2563eb;
    }

    .badge-success {
      background: #f0fdf4;
      color: #16a34a;
    }

    .badge-warning {
      background: #fffbeb;
      color: #d97706;
    }

    .badge-danger {
      background: #fef2f2;
      color: #dc2626;
    }

    .badge-info {
      background: #f0f9ff;
      color: #0284c7;
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

import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'ui-avatar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="avatar" [class]="'avatar-' + size" [class.online]="online">
      @if (src) {
        <img [src]="src" [alt]="alt" class="avatar-img" />
      } @else {
        <span class="avatar-initials">{{ initials }}</span>
      }
      @if (online !== undefined) {
        <span class="status-dot"></span>
      }
    </div>
  `,
  styles: [`
    .avatar {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-primary-700, #F57C00) 100%);
      color: white;
      font-weight: 600;
      flex-shrink: 0;
    }

    .avatar-xs {
      width: 28px;
      height: 28px;
      font-size: 0.625rem;
    }

    .avatar-sm {
      width: 36px;
      height: 36px;
      font-size: 0.75rem;
    }

    .avatar-md {
      width: 48px;
      height: 48px;
      font-size: 0.875rem;
    }

    .avatar-lg {
      width: 64px;
      height: 64px;
      font-size: 1.125rem;
    }

    .avatar-xl {
      width: 96px;
      height: 96px;
      font-size: 1.5rem;
    }

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
    }

    .status-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 25%;
      height: 25%;
      min-width: 8px;
      min-height: 8px;
      border-radius: 50%;
      background: var(--color-error, #F44336);
      border: 2px solid var(--color-surface, white);
    }

    .online .status-dot {
      background: var(--color-success, #4CAF50);
    }
  `]
})
export class UiAvatarComponent {
  @Input() src?: string;
  @Input() alt = '';
  @Input() name?: string;
  @Input() size: AvatarSize = 'md';
  @Input() online?: boolean;

  get initials(): string {
    if (!this.name) return '?';
    const parts = this.name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return this.name.substring(0, 2).toUpperCase();
  }
}

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationsService } from '@app/domains/notifications';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <a class="notification-bell" routerLink="/notifications">
      <span class="icon">🔔</span>
      @if (notificationService.unreadCount() > 0) {
        <span class="badge">
          {{ notificationService.unreadCount() > 99 ? '99+' : notificationService.unreadCount() }}
        </span>
      }
    </a>
  `,
  styles: [`
    .notification-bell {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
      min-height: 48px;
      text-decoration: none;
      border-radius: var(--border-radius-md, 8px);
      transition: background 0.15s ease;

      .icon {
        font-size: 1.375rem;
      }

      .badge {
        position: absolute;
        top: 2px;
        right: 2px;
        min-width: 1.125rem;
        height: 1.125rem;
        padding: 0 0.25rem;
        background: var(--color-error, #F44336);
        color: white;
        font-size: 0.625rem;
        font-weight: 700;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .notification-bell:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .notification-bell:focus-visible {
      outline: 2px solid var(--color-primary, #FF9800);
      outline-offset: 2px;
    }
  `]
})
export class NotificationBellComponent {
  readonly notificationService = inject(NotificationsService);
}

import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
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
      width: 2.5rem;
      height: 2.5rem;
      text-decoration: none;

      .icon {
        font-size: 1.375rem;
      }

      .badge {
        position: absolute;
        top: 0;
        right: 0;
        min-width: 1.125rem;
        height: 1.125rem;
        padding: 0 0.25rem;
        background: #ef4444;
        color: white;
        font-size: 0.625rem;
        font-weight: 700;
        border-radius: 9999px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  `]
})
export class NotificationBellComponent {
  readonly notificationService = inject(NotificationService);
}

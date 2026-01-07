import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService, AppNotification } from '../../../../core/services/notification.service';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiEmptyStateComponent } from '../../../../shared/components/ui-empty-state/ui-empty-state.component';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    UiLoadingComponent,
    UiEmptyStateComponent,
    UiHeaderComponent,
  ],
  template: `
    <div class="notification-list">
      <!-- Header -->
      <ui-header
        title="Notifications"
        [subtitle]="notificationService.unreadCount() > 0 ? notificationService.unreadCount() + ' non lue(s)' : 'Toutes lues'"
        [showBack]="true"
        [showProfile]="true"
      >
        @if (notificationService.unreadCount() > 0) {
          <button header-actions class="mark-all-btn" (click)="markAllAsRead()">
            Tout lire
          </button>
        }
      </ui-header>

      <!-- Push notification banner -->
      @if (notificationService.pushSupported() && !notificationService.pushEnabled()) {
        <div class="push-banner">
          <div class="banner-content">
            <span class="icon">🔔</span>
            <div class="text">
              <strong>Activez les notifications</strong>
              <p>Recevez des alertes pour vos demandes et messages</p>
            </div>
          </div>
          <button class="enable-btn" (click)="enablePush()">
            Activer
          </button>
        </div>
      }

      <!-- Filters -->
      <div class="filters">
        <button
          class="filter-btn"
          [class.active]="currentFilter() === 'all'"
          (click)="setFilter('all')"
        >
          Toutes
        </button>
        <button
          class="filter-btn"
          [class.active]="currentFilter() === 'unread'"
          (click)="setFilter('unread')"
        >
          Non lues
          @if (notificationService.unreadCount() > 0) {
            <span class="badge">{{ notificationService.unreadCount() }}</span>
          }
        </button>
      </div>

      <!-- Loading -->
      @if (notificationService.isLoading() && notificationService.notifications().length === 0) {
        <div class="loading-container">
          <ui-loading size="lg" text="Chargement des notifications..." />
        </div>
      }

      <!-- Empty state -->
      @if (!notificationService.isLoading() && filteredNotifications().length === 0) {
        <ui-empty-state
          icon="🔔"
          [title]="currentFilter() === 'unread' ? 'Aucune notification non lue' : 'Aucune notification'"
          [description]="currentFilter() === 'unread'
            ? 'Vous êtes à jour !'
            : 'Vos notifications apparaîtront ici'"
        />
      }

      <!-- Notifications -->
      @if (filteredNotifications().length > 0) {
        <div class="notifications">
          @for (notification of filteredNotifications(); track notification.id) {
            <div
              class="notification-item"
              [class.unread]="!notification.read"
              (click)="handleNotificationClick(notification)"
            >
              <div class="notification-icon">
                {{ notificationService.getTypeIcon(notification.type) }}
              </div>

              <div class="notification-content">
                <div class="notification-header">
                  <span class="type">{{ notificationService.getTypeLabel(notification.type) }}</span>
                  <span class="time">{{ notificationService.formatTime(notification.createdAt) }}</span>
                </div>

                <h3 class="title">{{ notification.title }}</h3>
                <p class="message">{{ notification.message }}</p>
              </div>

              <button
                class="delete-btn"
                (click)="deleteNotification($event, notification.id)"
                title="Supprimer"
              >
                ×
              </button>
            </div>
          }

          @if (hasMore()) {
            <button
              class="load-more"
              [disabled]="notificationService.isLoading()"
              (click)="loadMore()"
            >
              @if (notificationService.isLoading()) {
                <ui-loading size="sm" />
              } @else {
                Charger plus
              }
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notification-list {
      min-height: 100vh;
      background: #f9fafb;
      padding-top: 100px;
      padding-bottom: 5rem;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 1rem 1rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .mark-all-btn {
        background: none;
        border: none;
        color: #3b82f6;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
      }
    }

    .push-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: white;

      .banner-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .icon {
          font-size: 1.5rem;
        }

        .text {
          strong {
            display: block;
            font-size: 0.9375rem;
          }

          p {
            margin: 0;
            font-size: 0.8125rem;
            opacity: 0.9;
          }
        }
      }

      .enable-btn {
        background: white;
        color: #3b82f6;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
      }
    }

    .filters {
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;

      .filter-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 1rem;
        background: #f1f5f9;
        border: none;
        border-radius: 9999px;
        color: #64748b;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;

        &.active {
          background: #3b82f6;
          color: white;

          .badge {
            background: white;
            color: #3b82f6;
          }
        }

        .badge {
          background: #3b82f6;
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
          min-width: 1.25rem;
          text-align: center;
        }
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: #64748b;
    }

    .notifications {
      background: white;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.2s;
      position: relative;

      &:hover {
        background: #f8fafc;
      }

      &.unread {
        background: #eff6ff;

        .title {
          font-weight: 600;
        }

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: #3b82f6;
        }
      }
    }

    .notification-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    .notification-content {
      flex: 1;
      min-width: 0;

      .notification-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.25rem;

        .type {
          font-size: 0.75rem;
          color: #3b82f6;
          font-weight: 500;
          text-transform: uppercase;
        }

        .time {
          font-size: 0.75rem;
          color: #94a3b8;
        }
      }

      .title {
        font-size: 0.9375rem;
        font-weight: 500;
        color: #1e293b;
        margin: 0 0 0.25rem;
      }

      .message {
        font-size: 0.8125rem;
        color: #64748b;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }

    .delete-btn {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      opacity: 0;
      transition: opacity 0.2s;

      .notification-item:hover & {
        opacity: 1;
      }

      &:hover {
        color: #ef4444;
      }
    }

    .load-more {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      padding: 1rem;
      background: white;
      border: none;
      border-top: 1px solid #f1f5f9;
      color: #3b82f6;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: #f8fafc;
      }

      &:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
    }
  `]
})
export class NotificationListComponent implements OnInit {
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  currentFilter = signal<'all' | 'unread'>('all');
  currentPage = signal(1);
  hasMore = signal(true);

  ngOnInit(): void {
    this.notificationService.loadNotifications();
  }

  filteredNotifications(): AppNotification[] {
    const notifications = this.notificationService.notifications();

    if (this.currentFilter() === 'unread') {
      return notifications.filter((n) => !n.read);
    }

    return notifications;
  }

  setFilter(filter: 'all' | 'unread'): void {
    this.currentFilter.set(filter);
  }

  handleNotificationClick(notification: AppNotification): void {
    // Mark as read
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }

    // Navigate to relevant page
    const route = this.notificationService.getNotificationRoute(notification);
    this.router.navigate(route);
  }

  deleteNotification(event: Event, id: string): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  async enablePush(): Promise<void> {
    await this.notificationService.requestPushPermission();
  }

  async loadMore(): Promise<void> {
    const nextPage = this.currentPage() + 1;
    this.currentPage.set(nextPage);

    const countBefore = this.notificationService.notifications().length;
    await this.notificationService.loadNotifications(nextPage);
    const countAfter = this.notificationService.notifications().length;

    // If no new notifications were loaded, no more to load
    if (countAfter === countBefore) {
      this.hasMore.set(false);
    }
  }
}

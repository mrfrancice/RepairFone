import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export type NotificationType =
  | 'request_created'
  | 'request_accepted'
  | 'request_rejected'
  | 'quote_received'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'repair_started'
  | 'repair_completed'
  | 'payment_received'
  | 'payment_requested'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'new_message'
  | 'new_review'
  | 'profile_verified';

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  push: boolean;
  sms: boolean;
  email: boolean;
  types: {
    [key in NotificationType]?: boolean;
  };
}

interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly api = inject(ApiService);

  // State
  readonly notifications = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly isLoading = signal(false);
  readonly pushEnabled = signal(false);
  readonly pushSupported = signal(false);

  // Service Worker registration
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.checkPushSupport();
  }

  // Check if push notifications are supported
  private checkPushSupport(): void {
    this.pushSupported.set(
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  // Initialize notifications
  async init(): Promise<void> {
    await this.loadNotifications();
    await this.checkPushPermission();
  }

  // Load notifications from API
  async loadNotifications(page = 1, limit = 20): Promise<void> {
    this.isLoading.set(true);

    try {
      const response = await firstValueFrom(
        this.api.get<{ data: AppNotification[]; total: number; unread: number }>(
          '/notifications',
          { page, limit }
        )
      );

      if (page === 1) {
        this.notifications.set(response.data);
      } else {
        this.notifications.update((current) => [...current, ...response.data]);
      }

      this.unreadCount.set(response.unread);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.api.post<void>(`/notifications/${notificationId}/read`, {})
      );

      this.notifications.update((notifications) =>
        notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );

      this.unreadCount.update((count) => Math.max(0, count - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await firstValueFrom(
        this.api.post<void>('/notifications/read-all', {})
      );

      this.notifications.update((notifications) =>
        notifications.map((n) => ({ ...n, read: true }))
      );

      this.unreadCount.set(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await firstValueFrom(
        this.api.delete<void>(`/notifications/${notificationId}`)
      );

      const notification = this.notifications().find((n) => n.id === notificationId);
      this.notifications.update((notifications) =>
        notifications.filter((n) => n.id !== notificationId)
      );

      if (notification && !notification.read) {
        this.unreadCount.update((count) => Math.max(0, count - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      return await firstValueFrom(
        this.api.get<NotificationPreferences>('/notifications/preferences')
      );
    } catch (err) {
      console.error('Error loading notification preferences:', err);
      return {
        push: false,
        sms: true,
        email: true,
        types: {},
      };
    }
  }

  // Update notification preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      await firstValueFrom(
        this.api.put<void>('/notifications/preferences', preferences)
      );
    } catch (err) {
      console.error('Error updating notification preferences:', err);
      throw err;
    }
  }

  // Check current push permission status
  private async checkPushPermission(): Promise<void> {
    if (!this.pushSupported()) return;

    const permission = Notification.permission;
    this.pushEnabled.set(permission === 'granted');
  }

  // Request push notification permission
  async requestPushPermission(): Promise<boolean> {
    if (!this.pushSupported()) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        await this.subscribeToPush();
        this.pushEnabled.set(true);
        return true;
      }

      this.pushEnabled.set(false);
      return false;
    } catch (err) {
      console.error('Error requesting push permission:', err);
      return false;
    }
  }

  // Subscribe to push notifications
  private async subscribeToPush(): Promise<void> {
    try {
      // Register service worker if not already registered
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js');
      }

      // Get VAPID public key from server
      const { publicKey } = await firstValueFrom(
        this.api.get<{ publicKey: string }>('/notifications/vapid-key')
      );

      // Subscribe to push
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      // Send subscription to server
      const subscriptionJson = subscription.toJSON();
      const keys = subscriptionJson.keys || {};
      const payload: PushSubscriptionPayload = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: keys['p256dh'] || '',
          auth: keys['auth'] || '',
        },
      };

      await firstValueFrom(
        this.api.post<void>('/notifications/subscribe', payload)
      );
    } catch (err) {
      console.error('Error subscribing to push:', err);
      throw err;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribeFromPush(): Promise<void> {
    if (!this.swRegistration) return;

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify server
        await firstValueFrom(
          this.api.post<void>('/notifications/unsubscribe', {
            endpoint: subscription.endpoint,
          })
        );
      }

      this.pushEnabled.set(false);
    } catch (err) {
      console.error('Error unsubscribing from push:', err);
    }
  }

  // Convert VAPID key to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Show local notification (for testing or when app is in foreground)
  showLocalNotification(title: string, options?: NotificationOptions): void {
    if (!this.pushEnabled() || Notification.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return;
    }

    new Notification(title, {
      icon: '/assets/icons/icon-192x192.png',
      badge: '/assets/icons/badge-72x72.png',
      ...options,
    });
  }

  // Handle incoming notification (called from service worker)
  handleIncomingNotification(notification: AppNotification): void {
    // Add to local state
    this.notifications.update((notifications) => [notification, ...notifications]);
    this.unreadCount.update((count) => count + 1);

    // Show local notification if app is in foreground
    if (document.visibilityState === 'visible') {
      this.showLocalNotification(notification.title, {
        body: notification.message,
        tag: notification.id,
        data: notification.data,
      });
    }
  }

  // Get notification type label
  getTypeLabel(type: NotificationType): string {
    const labels: Record<NotificationType, string> = {
      request_created: 'Nouvelle demande',
      request_accepted: 'Demande acceptée',
      request_rejected: 'Demande refusée',
      quote_received: 'Devis reçu',
      quote_accepted: 'Devis accepté',
      quote_rejected: 'Devis refusé',
      repair_started: 'Réparation commencée',
      repair_completed: 'Réparation terminée',
      payment_received: 'Paiement reçu',
      payment_requested: 'Demande de paiement',
      dispute_opened: 'Litige ouvert',
      dispute_resolved: 'Litige résolu',
      new_message: 'Nouveau message',
      new_review: 'Nouvel avis',
      profile_verified: 'Profil vérifié',
    };

    return labels[type] || type;
  }

  // Get notification type icon
  getTypeIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      request_created: '📱',
      request_accepted: '✅',
      request_rejected: '❌',
      quote_received: '📋',
      quote_accepted: '✅',
      quote_rejected: '❌',
      repair_started: '🔧',
      repair_completed: '🎉',
      payment_received: '💰',
      payment_requested: '💳',
      dispute_opened: '⚠️',
      dispute_resolved: '✓',
      new_message: '💬',
      new_review: '⭐',
      profile_verified: '✔️',
    };

    return icons[type] || '🔔';
  }

  // Get notification route based on type and data
  getNotificationRoute(notification: AppNotification): string[] {
    const { type, data } = notification;

    switch (type) {
      case 'request_created':
      case 'request_accepted':
      case 'request_rejected':
        return ['/requests', data?.['requestId'] || ''];

      case 'quote_received':
      case 'quote_accepted':
      case 'quote_rejected':
        return ['/quotes', data?.['quoteId'] || ''];

      case 'repair_started':
      case 'repair_completed':
        return ['/tracking', data?.['requestId'] || ''];

      case 'payment_received':
      case 'payment_requested':
        return ['/payment', data?.['paymentId'] || ''];

      case 'dispute_opened':
      case 'dispute_resolved':
        return ['/disputes', data?.['disputeId'] || ''];

      case 'new_message':
        return ['/chat', data?.['conversationId'] || ''];

      case 'new_review':
        return ['/reviews', data?.['reviewId'] || ''];

      case 'profile_verified':
        return ['/profile'];

      default:
        return ['/notifications'];
    }
  }

  // Format notification time
  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  }
}

// ============================================
// NOTIFICATIONS DOMAIN — Types
// ============================================

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

// Nom AppNotification pour eviter le conflit avec le type DOM `Notification`
// (Web Notifications API).
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

// Alias pour retro-compatibilite du barrel @app/models (Phase 1).
// A supprimer en Phase 4.
export type Notification = AppNotification;

export interface NotificationPreferences {
  push: boolean;
  sms: boolean;
  email: boolean;
  types: {
    [key in NotificationType]?: boolean;
  };
}

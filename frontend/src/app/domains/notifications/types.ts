// ============================================
// NOTIFICATIONS DOMAIN — Types
// ============================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'request_created'
  | 'request_accepted'
  | 'request_rejected'
  | 'request_completed'
  | 'new_review'
  | 'system';

export type NotificationTypeExtended =
  | NotificationType
  | 'quote_received'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'payment_received'
  | 'payment_released'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'chat_message'
  | 'conseil_matched';

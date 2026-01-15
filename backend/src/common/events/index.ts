// Event classes for the event-driven architecture
export * from './quote-accepted.event';
export * from './quote-created.event';
export * from './payment-completed.event';
export * from './request-status-changed.event';
export * from './review-created.event';
export * from './dispute-created.event';
export * from './dispute-resolved.event';

// Event name constants for type safety
export const EventNames = {
  QUOTE_ACCEPTED: 'quote.accepted',
  QUOTE_CREATED: 'quote.created',
  PAYMENT_COMPLETED: 'payment.completed',
  REQUEST_STATUS_CHANGED: 'request.status.changed',
  REVIEW_CREATED: 'review.created',
  DISPUTE_CREATED: 'dispute.created',
  DISPUTE_RESOLVED: 'dispute.resolved',
} as const;

export type EventName = typeof EventNames[keyof typeof EventNames];

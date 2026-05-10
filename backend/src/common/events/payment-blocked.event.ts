/**
 * Event emitted when an admin blocks a payment (suspicious activity).
 * Consumed by the notifications module to inform client + repairer
 * that funds are frozen pending investigation.
 */
export class PaymentBlockedEvent {
  public readonly eventName = 'payment.blocked';
  public readonly occurredAt: Date;

  constructor(
    public readonly paymentId: string,
    public readonly paymentNumber: string,
    public readonly requestId: string,
    public readonly clientId: string,
    public readonly repairerId: string,
    public readonly reason: string,
    public readonly blockedByAdminId: string,
  ) {
    this.occurredAt = new Date();
  }

  toLogString(): string {
    return `Payment ${this.paymentNumber} blocked by admin ${this.blockedByAdminId} - Reason: ${this.reason}`;
  }
}

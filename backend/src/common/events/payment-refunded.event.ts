/**
 * Event emitted when an admin manually refunds a payment.
 * Consumed by the notifications module to inform client + repairer.
 */
export class PaymentRefundedEvent {
  public readonly eventName = 'payment.refunded';
  public readonly occurredAt: Date;

  constructor(
    public readonly paymentId: string,
    public readonly paymentNumber: string,
    public readonly requestId: string,
    public readonly clientId: string,
    public readonly repairerId: string,
    public readonly amount: number,
    public readonly reason: string,
    public readonly refundedByAdminId: string,
  ) {
    this.occurredAt = new Date();
  }

  toLogString(): string {
    return `Payment ${this.paymentNumber} refunded by admin ${this.refundedByAdminId} - Amount: ${this.amount} XOF - Reason: ${this.reason}`;
  }
}

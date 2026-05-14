import {
  PaymentMethod,
  PaymentType,
} from '../../modules/payments/entities/payment.entity';

/**
 * Event emitted when a payment is successfully completed
 */
export class PaymentCompletedEvent {
  public readonly eventName = 'payment.completed';
  public readonly occurredAt: Date;

  constructor(
    public readonly paymentId: string,
    public readonly paymentNumber: string,
    public readonly requestId: string,
    public readonly quoteId: string,
    public readonly clientId: string,
    public readonly repairerId: string,
    public readonly amount: number,
    public readonly platformFee: number,
    public readonly repairerAmount: number,
    public readonly paymentType: PaymentType,
    public readonly paymentMethod: PaymentMethod | undefined,
    public readonly transactionRef: string | null,
  ) {
    this.occurredAt = new Date();
  }

  /**
   * Check if this is a full payment
   */
  isFullPayment(): boolean {
    return this.paymentType === PaymentType.FULL;
  }

  /**
   * Check if this is a deposit payment
   */
  isDepositPayment(): boolean {
    return this.paymentType === PaymentType.DEPOSIT;
  }

  /**
   * Check if this is a balance payment
   */
  isBalancePayment(): boolean {
    return this.paymentType === PaymentType.BALANCE;
  }

  /**
   * Get a summary of the event for logging purposes
   */
  toLogString(): string {
    return `Payment ${this.paymentNumber} completed - Type: ${this.paymentType}, Amount: ${this.amount} XOF, Method: ${this.paymentMethod || 'N/A'}`;
  }
}

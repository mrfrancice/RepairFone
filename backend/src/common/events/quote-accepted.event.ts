/**
 * Event emitted when a quote is accepted by a client
 */
export class QuoteAcceptedEvent {
  public readonly eventName = 'quote.accepted';
  public readonly occurredAt: Date;

  constructor(
    public readonly quoteId: string,
    public readonly requestId: string,
    public readonly clientId: string,
    public readonly repairerId: string,
    public readonly amount: number,
    public readonly laborCost: number,
    public readonly partsCost: number,
    public readonly estimatedDuration: string,
  ) {
    this.occurredAt = new Date();
  }

  /**
   * Get a summary of the event for logging purposes
   */
  toLogString(): string {
    return `Quote ${this.quoteId} accepted for request ${this.requestId} - Amount: ${this.amount} XOF`;
  }
}

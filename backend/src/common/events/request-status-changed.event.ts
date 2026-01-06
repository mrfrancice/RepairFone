import { RequestStatus } from '../../modules/requests/entities/repair-request.entity';

/**
 * Event emitted when a repair request status changes
 */
export class RequestStatusChangedEvent {
  public readonly eventName = 'request.status.changed';
  public readonly occurredAt: Date;

  constructor(
    public readonly requestId: string,
    public readonly requestNumber: string,
    public readonly clientId: string,
    public readonly repairerId: string | undefined,
    public readonly previousStatus: RequestStatus,
    public readonly newStatus: RequestStatus,
    public readonly changedBy: string,
    public readonly comment?: string,
  ) {
    this.occurredAt = new Date();
  }

  /**
   * Check if the request was just accepted
   */
  wasAccepted(): boolean {
    return this.newStatus === RequestStatus.ACCEPTED;
  }

  /**
   * Check if the request was just completed
   */
  wasCompleted(): boolean {
    return this.newStatus === RequestStatus.COMPLETED;
  }

  /**
   * Check if the request was just cancelled
   */
  wasCancelled(): boolean {
    return this.newStatus === RequestStatus.CANCELLED;
  }

  /**
   * Check if the request was just rejected
   */
  wasRejected(): boolean {
    return this.newStatus === RequestStatus.REJECTED;
  }

  /**
   * Check if the request started repair (in progress)
   */
  startedRepair(): boolean {
    return this.newStatus === RequestStatus.IN_PROGRESS;
  }

  /**
   * Check if the request is now awaiting parts
   */
  isAwaitingParts(): boolean {
    return this.newStatus === RequestStatus.AWAITING_PARTS;
  }

  /**
   * Check if the request was delivered
   */
  wasDelivered(): boolean {
    return this.newStatus === RequestStatus.DELIVERED;
  }

  /**
   * Check if the request is in dispute
   */
  isDisputed(): boolean {
    return this.newStatus === RequestStatus.DISPUTED;
  }

  /**
   * Get a summary of the event for logging purposes
   */
  toLogString(): string {
    return `Request ${this.requestNumber} status changed: ${this.previousStatus} -> ${this.newStatus} (by ${this.changedBy})`;
  }
}

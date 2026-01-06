/**
 * Event emitted when a review is created for a completed repair
 */
export class ReviewCreatedEvent {
  public readonly eventName = 'review.created';
  public readonly occurredAt: Date;

  constructor(
    public readonly reviewId: string,
    public readonly requestId: string,
    public readonly clientId: string,
    public readonly repairerId: string,
    public readonly rating: number,
    public readonly comment: string | undefined,
  ) {
    this.occurredAt = new Date();
  }

  /**
   * Check if this is a positive review (4-5 stars)
   */
  isPositive(): boolean {
    return this.rating >= 4;
  }

  /**
   * Check if this is a negative review (1-2 stars)
   */
  isNegative(): boolean {
    return this.rating <= 2;
  }

  /**
   * Check if this is a neutral review (3 stars)
   */
  isNeutral(): boolean {
    return this.rating === 3;
  }

  /**
   * Check if the review has a comment
   */
  hasComment(): boolean {
    return !!this.comment && this.comment.trim().length > 0;
  }

  /**
   * Get a summary of the event for logging purposes
   */
  toLogString(): string {
    return `Review ${this.reviewId} created for request ${this.requestId} - Rating: ${this.rating}/5`;
  }
}

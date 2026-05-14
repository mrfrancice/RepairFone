import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReviewCreatedEvent, EventNames } from '../events';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { RepairersService } from '../../modules/users/repairers.service';

/**
 * Event listener for review-related events
 */
@Injectable()
export class ReviewListener {
  private readonly logger = new Logger(ReviewListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly repairersService: RepairersService,
  ) {}

  /**
   * Handle when a review is created
   * - Notify the repairer about the new review
   * - Log for analytics purposes
   */
  @OnEvent(EventNames.REVIEW_CREATED, { async: true })
  async handleReviewCreated(event: ReviewCreatedEvent): Promise<void> {
    this.logger.log(event.toLogString());

    try {
      // Get repairer profile to find the user ID for notification
      const repairerProfile = await this.repairersService.findByIdOrNull(
        event.repairerId,
      );

      if (repairerProfile) {
        // Send notification to repairer about new review
        await this.notificationsService.notifyReviewReceived(
          repairerProfile.userId,
          event.reviewId,
          event.rating,
        );
        this.logger.debug(
          `Review notification sent to repairer ${repairerProfile.userId} - Rating: ${event.rating}/5`,
        );
      }

      // Log review sentiment for analytics
      if (event.isPositive()) {
        this.logger.log(
          `Positive review (${event.rating}/5) received for repairer ${event.repairerId}`,
        );
      } else if (event.isNegative()) {
        this.logger.warn(
          `Negative review (${event.rating}/5) received for repairer ${event.repairerId}`,
        );
      }

      // Log if review has a comment (useful for sentiment analysis in the future)
      if (event.hasComment()) {
        this.logger.debug(`Review ${event.reviewId} includes a comment`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle review created event: ${error.message}`,
        error.stack,
      );
    }
  }
}

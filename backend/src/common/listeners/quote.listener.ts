import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { QuoteAcceptedEvent, EventNames } from '../events';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { RepairersService } from '../../modules/users/repairers.service';

/**
 * Event listener for quote-related events
 */
@Injectable()
export class QuoteListener {
  private readonly logger = new Logger(QuoteListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly repairersService: RepairersService,
  ) {}

  /**
   * Handle when a quote is accepted
   * - Notify the repairer
   * - Update repairer statistics (accepted quotes count)
   */
  @OnEvent(EventNames.QUOTE_ACCEPTED)
  async handleQuoteAccepted(event: QuoteAcceptedEvent): Promise<void> {
    this.logger.log(event.toLogString());

    try {
      // Get repairer profile to find the user ID for notification
      const repairerProfile = await this.repairersService.findById(event.repairerId);

      if (repairerProfile) {
        // Send notification to repairer
        await this.notificationsService.notifyQuoteAccepted(
          repairerProfile.userId,
          event.quoteId,
        );
        this.logger.debug(`Notification sent to repairer ${repairerProfile.userId} for accepted quote ${event.quoteId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle quote accepted event: ${error.message}`, error.stack);
    }
  }
}

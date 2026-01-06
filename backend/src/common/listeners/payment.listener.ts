import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PaymentCompletedEvent, EventNames } from '../events';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { RepairersService } from '../../modules/users/repairers.service';

/**
 * Event listener for payment-related events
 */
@Injectable()
export class PaymentListener {
  private readonly logger = new Logger(PaymentListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly repairersService: RepairersService,
  ) {}

  /**
   * Handle when a payment is completed
   * - Notify the repairer about the payment
   * - Could update financial statistics in the future
   */
  @OnEvent(EventNames.PAYMENT_COMPLETED)
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    this.logger.log(event.toLogString());

    try {
      // Get repairer profile to find the user ID for notification
      const repairerProfile = await this.repairersService.findById(event.repairerId);

      if (repairerProfile) {
        // Send notification to repairer about payment received
        await this.notificationsService.notifyPaymentReceived(
          repairerProfile.userId,
          event.paymentId,
          event.repairerAmount,
        );
        this.logger.debug(
          `Payment notification sent to repairer ${repairerProfile.userId} for ${event.repairerAmount} XOF`,
        );
      }

      // Log payment type specific information
      if (event.isDepositPayment()) {
        this.logger.log(`Deposit payment received for request ${event.requestId}`);
      } else if (event.isBalancePayment()) {
        this.logger.log(`Balance payment received for request ${event.requestId} - Full payment complete`);
      } else if (event.isFullPayment()) {
        this.logger.log(`Full payment received for request ${event.requestId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle payment completed event: ${error.message}`, error.stack);
    }
  }
}

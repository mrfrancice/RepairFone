import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  PaymentCompletedEvent,
  PaymentRefundedEvent,
  PaymentBlockedEvent,
  EventNames,
} from '../events';
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
  @OnEvent(EventNames.PAYMENT_COMPLETED, { async: true })
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    this.logger.log(event.toLogString());

    try {
      // Get repairer profile to find the user ID for notification
      const repairerProfile = await this.repairersService.findByIdOrNull(event.repairerId);

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

  /**
   * Handle when an admin refunds a payment.
   * Notifie le client (l'argent revient) ET le réparateur (les fonds sont repris).
   */
  @OnEvent(EventNames.PAYMENT_REFUNDED, { async: true })
  async handlePaymentRefunded(event: PaymentRefundedEvent): Promise<void> {
    this.logger.log(event.toLogString());

    try {
      // Notif client
      await this.notificationsService.notifyPaymentRefunded(
        event.clientId,
        event.paymentId,
        event.paymentNumber,
        event.amount,
        event.reason,
      );

      // Notif réparateur (via son user_id)
      const repairerProfile = await this.repairersService.findByIdOrNull(event.repairerId);
      if (repairerProfile) {
        await this.notificationsService.notifyPaymentRefunded(
          repairerProfile.userId,
          event.paymentId,
          event.paymentNumber,
          event.amount,
          event.reason,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle payment refunded event: ${error.message}`, error.stack);
    }
  }

  /**
   * Handle when an admin blocks a payment.
   * Les deux parties doivent savoir que les fonds sont gelés.
   */
  @OnEvent(EventNames.PAYMENT_BLOCKED, { async: true })
  async handlePaymentBlocked(event: PaymentBlockedEvent): Promise<void> {
    this.logger.log(event.toLogString());

    try {
      await this.notificationsService.notifyPaymentBlocked(
        event.clientId,
        event.paymentId,
        event.paymentNumber,
        event.reason,
      );

      const repairerProfile = await this.repairersService.findByIdOrNull(event.repairerId);
      if (repairerProfile) {
        await this.notificationsService.notifyPaymentBlocked(
          repairerProfile.userId,
          event.paymentId,
          event.paymentNumber,
          event.reason,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to handle payment blocked event: ${error.message}`, error.stack);
    }
  }
}

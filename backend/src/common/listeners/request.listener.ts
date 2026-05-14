import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RequestStatusChangedEvent, EventNames } from '../events';
import { NotificationsService } from '../../modules/notifications/notifications.service';
import { RepairersService } from '../../modules/users/repairers.service';
import { NotificationType } from '../../modules/notifications/entities/notification.entity';

/**
 * Event listener for repair request-related events
 */
@Injectable()
export class RequestListener {
  private readonly logger = new Logger(RequestListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly repairersService: RepairersService,
  ) {}

  /**
   * Handle when a request status changes
   * - Send appropriate notifications to client and/or repairer
   * - Update statistics based on status changes
   */
  @OnEvent(EventNames.REQUEST_STATUS_CHANGED, { async: true })
  async handleRequestStatusChanged(
    event: RequestStatusChangedEvent,
  ): Promise<void> {
    this.logger.log(event.toLogString());

    try {
      // Handle different status changes
      if (event.wasCompleted()) {
        await this.handleRequestCompleted(event);
      } else if (event.wasAccepted()) {
        await this.handleRequestAccepted(event);
      } else if (event.wasRejected()) {
        await this.handleRequestRejected(event);
      } else if (event.wasCancelled()) {
        await this.handleRequestCancelled(event);
      } else if (event.startedRepair()) {
        await this.handleRepairStarted(event);
      } else if (event.wasDelivered()) {
        await this.handleRequestDelivered(event);
      } else if (event.isDisputed()) {
        await this.handleRequestDisputed(event);
      } else if (event.isAwaitingParts()) {
        await this.handleAwaitingParts(event);
      }
    } catch (error) {
      this.logger.error(
        `Failed to handle request status changed event: ${error.message}`,
        error.stack,
      );
    }
  }

  private async handleRequestCompleted(
    event: RequestStatusChangedEvent,
  ): Promise<void> {
    // Notify client that repair is completed
    await this.notificationsService.notifyRepairCompleted(
      event.clientId,
      event.requestId,
    );
    this.logger.debug(
      `Completion notification sent to client ${event.clientId} for request ${event.requestNumber}`,
    );
  }

  private async handleRequestAccepted(
    event: RequestStatusChangedEvent,
  ): Promise<void> {
    // Notify client that request was accepted
    await this.notificationsService.create({
      userId: event.clientId,
      type: NotificationType.REQUEST_ACCEPTED,
      title: 'Demande acceptee',
      body: `Votre demande ${event.requestNumber} a ete acceptee par le reparateur`,
      referenceType: 'request',
      referenceId: event.requestId,
    });
    this.logger.debug(
      `Acceptance notification sent to client ${event.clientId} for request ${event.requestNumber}`,
    );
  }

  private async handleRequestRejected(
    event: RequestStatusChangedEvent,
  ): Promise<void> {
    // Notify client that request was rejected
    await this.notificationsService.create({
      userId: event.clientId,
      type: NotificationType.REQUEST_REJECTED,
      title: 'Demande refusee',
      body: `Votre demande ${event.requestNumber} a ete refusee${event.comment ? `: ${event.comment}` : ''}`,
      referenceType: 'request',
      referenceId: event.requestId,
    });
    this.logger.debug(
      `Rejection notification sent to client ${event.clientId} for request ${event.requestNumber}`,
    );
  }

  private async handleRequestCancelled(
    event: RequestStatusChangedEvent,
  ): Promise<void> {
    // Notify the other party about cancellation
    const _notifyUserId =
      event.changedBy === event.clientId && event.repairerId
        ? event.repairerId
        : event.clientId;

    if (event.changedBy === event.clientId && event.repairerId) {
      // Client cancelled - notify repairer
      const repairerProfile = await this.repairersService.findByIdOrNull(
        event.repairerId,
      );
      if (repairerProfile) {
        await this.notificationsService.create({
          userId: repairerProfile.userId,
          type: NotificationType.REQUEST_CANCELLED,
          title: 'Demande annulee',
          body: `La demande ${event.requestNumber} a ete annulee par le client`,
          referenceType: 'request',
          referenceId: event.requestId,
        });
      }
    } else {
      // Repairer cancelled - notify client
      await this.notificationsService.create({
        userId: event.clientId,
        type: NotificationType.REQUEST_CANCELLED,
        title: 'Demande annulee',
        body: `La demande ${event.requestNumber} a ete annulee`,
        referenceType: 'request',
        referenceId: event.requestId,
      });
    }
    this.logger.debug(
      `Cancellation notification sent for request ${event.requestNumber}`,
    );
  }

  private async handleRepairStarted(
    event: RequestStatusChangedEvent,
  ): Promise<void> {
    // Notify client that repair has started
    await this.notificationsService.create({
      userId: event.clientId,
      type: NotificationType.REPAIR_STARTED,
      title: 'Reparation en cours',
      body: `La reparation de votre appareil (${event.requestNumber}) a commence`,
      referenceType: 'request',
      referenceId: event.requestId,
    });
    this.logger.debug(
      `Repair started notification sent to client ${event.clientId} for request ${event.requestNumber}`,
    );
  }

  private async handleRequestDelivered(
    event: RequestStatusChangedEvent,
  ): Promise<void> {
    // Notify client that the device has been delivered
    await this.notificationsService.create({
      userId: event.clientId,
      type: NotificationType.REQUEST_DELIVERED,
      title: 'Appareil livre',
      body: `Votre appareil (${event.requestNumber}) a ete livre. N'oubliez pas de laisser un avis!`,
      referenceType: 'request',
      referenceId: event.requestId,
    });
    this.logger.debug(
      `Delivery notification sent to client ${event.clientId} for request ${event.requestNumber}`,
    );
  }

  private async handleRequestDisputed(
    event: RequestStatusChangedEvent,
  ): Promise<void> {
    // Notify repairer about the dispute
    if (event.repairerId) {
      const repairerProfile = await this.repairersService.findByIdOrNull(
        event.repairerId,
      );
      if (repairerProfile) {
        await this.notificationsService.notifyDisputeOpened(
          repairerProfile.userId,
          event.requestId,
        );
        this.logger.debug(
          `Dispute notification sent to repairer ${repairerProfile.userId} for request ${event.requestNumber}`,
        );
      }
    }
  }

  private async handleAwaitingParts(
    event: RequestStatusChangedEvent,
  ): Promise<void> {
    // Notify client that repair is waiting for parts
    await this.notificationsService.create({
      userId: event.clientId,
      type: NotificationType.AWAITING_PARTS,
      title: 'En attente de pieces',
      body: `La reparation de votre appareil (${event.requestNumber}) est en attente de pieces`,
      referenceType: 'request',
      referenceId: event.requestId,
    });
    this.logger.debug(
      `Awaiting parts notification sent to client ${event.clientId} for request ${event.requestNumber}`,
    );
  }
}

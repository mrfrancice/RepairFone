// BIZ-108: Événement création de litige
import { DisputeReason } from '../../modules/disputes/entities/dispute.entity';

export class DisputeCreatedEvent {
  constructor(
    public readonly disputeId: string,
    public readonly requestId: string,
    public readonly clientId: string,
    public readonly repairerId: string,
    public readonly reason: DisputeReason,
    public readonly description: string,
  ) {}
}

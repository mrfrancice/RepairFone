// BIZ-108: Événement résolution de litige
import { DisputeResolution } from '../../modules/disputes/entities/dispute.entity';

export class DisputeResolvedEvent {
  constructor(
    public readonly disputeId: string,
    public readonly requestId: string,
    public readonly clientId: string,
    public readonly repairerId: string,
    public readonly resolution: DisputeResolution,
    public readonly refundAmount?: number,
    public readonly notes?: string,
  ) {}
}

// BIZ-108: Événement création de devis
export class QuoteCreatedEvent {
  constructor(
    public readonly quoteId: string,
    public readonly requestId: string,
    public readonly clientId: string,
    public readonly repairerId: string,
    public readonly totalAmount: number,
    public readonly laborCost: number,
    public readonly partsCost: number,
    public readonly estimatedDuration?: string,
  ) {}
}

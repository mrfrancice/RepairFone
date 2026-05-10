import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuotesService, Quote } from '../../services/quotes.service';
import { QuotesStore } from '../../stores/quotes.store';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { LoggerService } from '../../../../core/services/logger.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-quote-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, UiButtonComponent, UiLoadingComponent, FormatDatePipe, UiHeaderComponent],
  template: `
    <div class="quote-detail-container">
      <ui-header
        title="Détail du devis"
        [subtitle]="quote() ? '#' + (quote()?.id?.slice(0, 8)?.toUpperCase() || '') : ''"
        [showBack]="true"
        (onBack)="goBack()"
      />

      @if (isLoading()) {
        <div class="loading-state">
          <ui-loading size="lg" />
          <p>Chargement du devis...</p>
        </div>
      } @else if (!quote()) {
        <div class="error-state">
          <span class="error-icon">❌</span>
          <p>Devis non trouvé</p>
          <ui-button variant="primary" routerLink="/quotes">
            Retour aux devis
          </ui-button>
        </div>
      } @else {
        <div class="detail-content">
          <!-- Status Banner -->
          <div class="status-banner" [style.background]="getStatusBannerColor()">
            <div class="status-info">
              <span class="status-icon">{{ getStatusIcon() }}</span>
              <div class="status-text">
                <span class="status-label">{{ quotesService.getStatusLabel(quote()!.status) }}</span>
                <span class="status-desc">{{ getStatusDescription() }}</span>
              </div>
            </div>
            @if (quote()?.status === 'pending' && !quotesService.isExpired(quote()!)) {
              <span class="expiry-badge">
                Expire {{ getExpiryText() }}
              </span>
            }
          </div>

          <!-- Total Amount -->
          <section class="section amount-section">
            <div class="total-display">
              <span class="total-label">Montant total</span>
              <span class="total-amount">{{ quote()?.totalAmount | number:'1.0-0' }} FCFA</span>
            </div>
          </section>

          <!-- Price Breakdown -->
          <section class="section">
            <h2>💰 Détail du prix</h2>
            <div class="price-breakdown">
              <div class="price-row">
                <span>Main d'œuvre</span>
                <span>{{ quote()?.laborCost | number:'1.0-0' }} FCFA</span>
              </div>

              @if (quote()?.parts?.length) {
                <div class="parts-section">
                  <span class="parts-label">Pièces détachées</span>
                  @for (part of quote()?.parts; track part.name) {
                    <div class="part-row">
                      <div class="part-info">
                        <span class="part-name">{{ part.name }}</span>
                        @if (part.description) {
                          <span class="part-desc">{{ part.description }}</span>
                        }
                        <span class="part-qty">x{{ part.quantity }}</span>
                      </div>
                      <span class="part-price">{{ part.price * part.quantity | number:'1.0-0' }} FCFA</span>
                    </div>
                  }
                </div>
              }

              <div class="price-row subtotal">
                <span>Sous-total pièces</span>
                <span>{{ quote()?.partsCost | number:'1.0-0' }} FCFA</span>
              </div>

              @if (quote()?.request?.urgencySupplement) {
                <div class="price-row supplement">
                  <span>⚡ Supplément express</span>
                  <span>+ {{ quote()?.request?.urgencySupplement | number:'1.0-0' }} FCFA</span>
                </div>
              }

              <div class="price-total">
                <span>Total</span>
                <span>{{ quote()?.totalAmount | number:'1.0-0' }} FCFA</span>
              </div>
            </div>
          </section>

          <!-- Repair Details -->
          <section class="section">
            <h2>🔧 Détails de la réparation</h2>
            <div class="repair-details">
              @if (quote()?.request?.device) {
                <div class="detail-item">
                  <span class="detail-label">Appareil</span>
                  <span class="detail-value">{{ quote()?.request?.device?.brand }} {{ quote()?.request?.device?.model }}</span>
                </div>
              }
              @if (quote()?.request?.serviceType) {
                <div class="detail-item">
                  <span class="detail-label">Service</span>
                  <span class="detail-value">{{ quote()?.request?.serviceType?.name }}</span>
                </div>
              }
              <div class="detail-item">
                <span class="detail-label">Durée estimée</span>
                <span class="detail-value">{{ quote()?.estimatedDuration }}</span>
              </div>
              @if (quote()?.request?.urgency === 'express') {
                <div class="detail-item">
                  <span class="detail-label">Priorité</span>
                  <span class="detail-value express">⚡ Express</span>
                </div>
              }
            </div>

            @if (quote()?.notes) {
              <div class="notes-section">
                <span class="notes-label">Notes du réparateur</span>
                <p class="notes-text">{{ quote()?.notes }}</p>
              </div>
            }
          </section>

          <!-- Repairer Info -->
          <section class="section">
            <h2>👨‍🔧 Réparateur</h2>
            <div class="repairer-card">
              <div class="repairer-avatar">
                @if (quote()?.repairer?.avatarUrl) {
                  <img [src]="quote()?.repairer?.avatarUrl" alt="Avatar" />
                } @else {
                  <span class="avatar-placeholder">{{ getRepairerInitials() }}</span>
                }
              </div>
              <div class="repairer-info">
                <span class="repairer-name">{{ getRepairerName() }}</span>
                @if (quote()?.repairer?.repairerProfile?.rating) {
                  <span class="repairer-rating">
                    ⭐ {{ quote()?.repairer?.repairerProfile?.rating?.toFixed(1) }}
                  </span>
                }
              </div>
              <a [routerLink]="['/search/repairer', quote()?.repairer?.id]" class="view-profile-btn">
                Voir profil →
              </a>
            </div>
          </section>

          <!-- Validity Info -->
          <section class="section validity-section">
            <div class="validity-info">
              <span class="validity-icon">📅</span>
              <div class="validity-text">
                <span class="validity-label">Validité du devis</span>
                <span class="validity-date">
                  Jusqu'au {{ quote()?.validUntil | formatDate:'long' }}
                </span>
              </div>
            </div>
          </section>

          <!-- Actions -->
          @if (quote()?.status === 'pending' && !quotesService.isExpired(quote()!)) {
            <div class="actions-section">
              <ui-button variant="outline" fullWidth (click)="rejectQuote()">
                Refuser le devis
              </ui-button>
              <ui-button variant="primary" fullWidth (click)="acceptQuote()">
                Accepter le devis
              </ui-button>
            </div>
          }

          @if (quote()?.status === 'accepted') {
            <div class="actions-section">
              <ui-button variant="primary" fullWidth [routerLink]="['/tracking', quote()?.requestId]">
                Suivre la réparation
              </ui-button>
            </div>
          }

          <!-- Terms -->
          <div class="terms-section">
            <h3>Conditions</h3>
            <ul>
              <li>Le prix est garanti pendant la durée de validité du devis</li>
              <li>En cas de pièces supplémentaires nécessaires, vous serez contacté</li>
              <li>Garantie 3 mois sur les pièces et la main d'œuvre</li>
              <li>Paiement sécurisé via la plateforme</li>
            </ul>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .quote-detail-container {
      min-height: 100vh;
      background: #FFF3E0;
      padding-top: var(--header-height, 100px);
      padding-bottom: 2rem;
    }

    .detail-header h1 {
      font-family: 'Poppins', 'Inter', sans-serif;
      flex: 1;
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: white;
    }

    .quote-id {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.65);
      font-family: monospace;
    }

    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      gap: 1rem;
    }

    .error-icon {
      font-size: 4rem;
    }

    .detail-content {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }

    /* Status Banner */
    .status-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-radius: 16px;
      margin-bottom: 1rem;
      color: white;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-icon {
      font-size: 2rem;
    }

    .status-text {
      display: flex;
      flex-direction: column;
    }

    .status-label {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .status-desc {
      font-size: 0.75rem;
      opacity: 0.9;
    }

    .expiry-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Sections */
    .section {
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #FFE5D9;
    }

    .section h2 {
      margin: 0 0 1.25rem;
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f2937;
    }

    /* Amount Section */
    .amount-section {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      color: white;
      text-align: center;
      box-shadow: 0 4px 16px rgba(255, 152, 0, 0.3);
    }

    .total-display {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .total-label {
      font-size: 1rem;
      opacity: 0.95;
      font-weight: 600;
    }

    .total-amount {
      font-size: 2.5rem;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* Price Breakdown */
    .price-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }

    .price-row.subtotal {
      border-top: 1px dashed #EEEEEE;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
      color: #6b7280;
    }

    .price-row.supplement {
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
    }

    .parts-section {
      background: linear-gradient(135deg, #FFF3E0 0%, #FFFFFF 100%);
      border-radius: 12px;
      padding: 1rem;
      margin: 0.75rem 0;
      border: 1px solid #FFE5D9;
    }

    .parts-label {
      display: block;
      font-size: 0.75rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .part-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 0.5rem 0;
      border-bottom: 1px solid #EEEEEE;
    }

    .part-row:last-child {
      border-bottom: none;
    }

    .part-info {
      display: flex;
      flex-direction: column;
    }

    .part-name {
      font-weight: 500;
      color: #1f2937;
    }

    .part-desc {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .part-qty {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .part-price {
      font-weight: 500;
    }

    .price-total {
      display: flex;
      justify-content: space-between;
      padding-top: 1rem;
      margin-top: 0.75rem;
      border-top: 3px solid #FFE5D9;
      font-weight: 700;
      font-size: 1.25rem;
    }

    .price-total span:last-child {
      color: var(--color-primary-500, #FF9800);
      font-size: 1.5rem;
    }

    /* Repair Details */
    .repair-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .detail-value {
      font-weight: 500;
      color: #1f2937;
    }

    .detail-value.express {
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
    }

    .notes-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 2px solid #FFE5D9;
    }

    .notes-label {
      display: block;
      font-size: 0.8125rem;
      color: #6b7280;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .notes-text {
      margin: 0;
      font-size: 0.875rem;
      color: #4b5563;
      line-height: 1.6;
      background: linear-gradient(135deg, #FFF3E0 0%, #FFFFFF 100%);
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid #FFE5D9;
    }

    /* Repairer Card */
    .repairer-card {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .repairer-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      overflow: hidden;
      background: #EEEEEE;
    }

    .repairer-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      color: white;
      font-weight: 700;
      font-size: 1.25rem;
    }

    .repairer-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .repairer-name {
      font-weight: 700;
      color: #1f2937;
      font-size: 1rem;
    }

    .repairer-rating {
      font-size: 0.875rem;
      color: #F9A825;
      font-weight: 600;
    }

    .view-profile-btn {
      font-size: 0.875rem;
      color: var(--color-primary-500, #FF9800);
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
    }

    .view-profile-btn:hover {
      color: #FF5722;
      transform: translateX(2px);
    }

    /* Validity Section */
    .validity-section {
      background: linear-gradient(135deg, #FFF3E0 0%, #FFE5D9 100%);
      border: 2px solid #F9A825;
    }

    .validity-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .validity-icon {
      font-size: 2rem;
    }

    .validity-text {
      display: flex;
      flex-direction: column;
    }

    .validity-label {
      font-size: 0.8125rem;
      color: #E65100;
      font-weight: 600;
    }

    .validity-date {
      font-weight: 700;
      color: #F9A825;
      font-size: 1rem;
    }

    /* Actions */
    .actions-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    /* Terms */
    .terms-section {
      padding: 1rem;
    }

    .terms-section h3 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #6b7280;
    }

    .terms-section ul {
      margin: 0;
      padding-left: 1.25rem;
    }

    .terms-section li {
      font-size: 0.75rem;
      color: #9ca3af;
      margin-bottom: 0.5rem;
    }
  `]
})
export class QuoteDetailComponent implements OnInit {
  readonly quotesService = inject(QuotesService);
  readonly store = inject(QuotesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  readonly quote = signal<Quote | null>(null);
  readonly isLoading = signal(true);

  async ngOnInit(): Promise<void> {
    const quoteId = this.route.snapshot.paramMap.get('id');
    if (quoteId) {
      await this.loadQuote(quoteId);
    }
  }

  async loadQuote(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const quote = await this.quotesService.getQuote(id);
      this.quote.set(quote);
      this.store.setSelectedQuote(quote);
    } catch (err) {
      this.logger.error('QuoteDetailComponent', 'Error loading quote', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  getStatusBannerColor(): string {
    const status = this.quote()?.status;
    const colors: Record<string, string> = {
      pending: 'linear-gradient(135deg, #F9A825 0%, #FF9800 100%)',
      accepted: 'linear-gradient(135deg, #4CAF50 0%, var(--color-secondary, #4CAF50) 100%)',
      rejected: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
      expired: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',  /* WCAG AA compliant */
    };
    return colors[status || 'pending'] || colors['pending'];
  }

  getStatusIcon(): string {
    const status = this.quote()?.status;
    const icons: Record<string, string> = {
      pending: '⏳',
      accepted: '✅',
      rejected: '❌',
      expired: '⌛',
    };
    return icons[status || 'pending'] || '⏳';
  }

  getStatusDescription(): string {
    const status = this.quote()?.status;
    const descriptions: Record<string, string> = {
      pending: 'En attente de votre réponse',
      accepted: 'Devis accepté, réparation programmée',
      rejected: 'Vous avez refusé ce devis',
      expired: 'Ce devis n\'est plus valide',
    };
    return descriptions[status || 'pending'] || '';
  }

  getRepairerName(): string {
    const q = this.quote();
    if (q?.repairer?.repairerProfile?.businessName) {
      return q.repairer.repairerProfile.businessName;
    }
    if (q?.repairer?.firstName || q?.repairer?.lastName) {
      return `${q.repairer.firstName || ''} ${q.repairer.lastName || ''}`.trim();
    }
    return 'Réparateur';
  }

  getRepairerInitials(): string {
    const name = this.getRepairerName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getExpiryText(): string {
    const q = this.quote();
    if (!q) return '';
    const days = this.quotesService.getDaysUntilExpiry(q);
    if (days <= 0) return 'aujourd\'hui';
    if (days === 1) return 'demain';
    return `dans ${days} jours`;
  }

  async acceptQuote(): Promise<void> {
    const q = this.quote();
    if (!q) return;

    try {
      await this.quotesService.acceptQuote(q.id);
      this.quote.set({ ...q, status: 'accepted' });
      this.store.updateQuote(q.id, { status: 'accepted' });

      // Navigate to payment page
      this.router.navigate(['/payments/summary'], {
        queryParams: { requestId: q.requestId, quoteId: q.id }
      });
    } catch (err) {
      this.logger.error('QuoteDetailComponent', 'Error accepting quote', err);
    }
  }

  async rejectQuote(): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir refuser ce devis ?')) return;

    const q = this.quote();
    if (!q) return;

    try {
      await this.quotesService.rejectQuote(q.id);
      this.quote.set({ ...q, status: 'rejected' });
      this.store.updateQuote(q.id, { status: 'rejected' });
    } catch (err) {
      this.logger.error('QuoteDetailComponent', 'Error rejecting quote', err);
    }
  }

  goBack(): void {
    this.router.navigate(['/quotes']);
  }
}

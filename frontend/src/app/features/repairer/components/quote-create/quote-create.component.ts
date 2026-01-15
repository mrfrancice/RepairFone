import { Component, inject, OnInit, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RepairerService, RepairerRequest, CreateQuoteDto, QuotePart } from '../../services/repairer.service';
import { QuotesService, Quote } from '../../../quotes/services/quotes.service';
import {
  UiButtonComponent,
  UiLoadingComponent,
  UiModalComponent,
} from '@app/shared';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

// Liste prédéfinie des pièces détachées
const AVAILABLE_PARTS: { name: string; defaultPrice: number; category: string }[] = [
  // Écrans
  { name: 'Écran LCD', defaultPrice: 25000, category: 'Écran' },
  { name: 'Écran OLED', defaultPrice: 45000, category: 'Écran' },
  { name: 'Écran AMOLED', defaultPrice: 55000, category: 'Écran' },
  { name: 'Vitre tactile', defaultPrice: 15000, category: 'Écran' },
  // Batterie
  { name: 'Batterie standard', defaultPrice: 12000, category: 'Batterie' },
  { name: 'Batterie haute capacité', defaultPrice: 18000, category: 'Batterie' },
  // Connectique
  { name: 'Connecteur de charge', defaultPrice: 8000, category: 'Connectique' },
  { name: 'Prise jack audio', defaultPrice: 5000, category: 'Connectique' },
  { name: 'Nappe de charge', defaultPrice: 7000, category: 'Connectique' },
  // Caméra
  { name: 'Caméra arrière', defaultPrice: 20000, category: 'Caméra' },
  { name: 'Caméra frontale', defaultPrice: 12000, category: 'Caméra' },
  { name: 'Lentille caméra', defaultPrice: 5000, category: 'Caméra' },
  // Boutons
  { name: 'Bouton power', defaultPrice: 4000, category: 'Boutons' },
  { name: 'Boutons volume', defaultPrice: 4000, category: 'Boutons' },
  { name: 'Bouton home', defaultPrice: 8000, category: 'Boutons' },
  // Autres
  { name: 'Haut-parleur', defaultPrice: 6000, category: 'Audio' },
  { name: 'Écouteur interne', defaultPrice: 5000, category: 'Audio' },
  { name: 'Micro', defaultPrice: 5000, category: 'Audio' },
  { name: 'Vibreur', defaultPrice: 4000, category: 'Autres' },
  { name: 'Antenne WiFi', defaultPrice: 6000, category: 'Autres' },
  { name: 'Carte mère', defaultPrice: 80000, category: 'Autres' },
];

interface SelectedPart {
  name: string;
  price: number;
  quantity: number;
  selected: boolean;
}

@Component({
  selector: 'app-quote-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiHeaderComponent,
    UiButtonComponent,
    UiLoadingComponent,
    UiModalComponent,
  ],
  template: `
    <div class="quote-create">
      <!-- Header - Utilisation du composant partagé -->
      <ui-header
        title="📝 Créer un devis"
        subtitle="Établissez votre proposition de réparation"
        [showBack]="true"
        (onBack)="goBack()"
      />

      <!-- Loading - Utilisation du composant partagé -->
      @if (isLoading()) {
        <ui-loading size="lg" text="Chargement de la demande..." [centered]="true" />
      }

      <!-- Error State -->
      @if (!isLoading() && !request()) {
        <div class="error-container">
          <p>Impossible de charger la demande</p>
          <a routerLink="/repairer/requests" class="btn-link">Retour aux demandes</a>
        </div>
      }

      <!-- Main Content -->
      @if (!isLoading() && request()) {
        <div class="content">
          <!-- Request Info -->
          <section class="card request-card">
            <div class="request-card-header">
              <div class="device-icon-wrapper">
                <span class="device-icon">📱</span>
              </div>
              <div class="device-info">
                <h3 class="device-name">{{ getDeviceInfo() }}</h3>
                <div class="service-row">
                  <span class="service-badge">🔧 {{ getServiceTypeName() }}</span>
                  @if (request()?.urgency === 'express') {
                    <span class="express-badge">⚡ Express</span>
                  }
                </div>
              </div>
            </div>
            @if (request()?.problemDescription) {
              <div class="problem-section">
                <span class="problem-label">Description du problème</span>
                <p class="problem-description">{{ request()?.problemDescription }}</p>
              </div>
            }
          </section>

          <!-- Counter Proposal Alert -->
          @if (lastRejectedQuote()?.clientProposedPrice) {
            <section class="alert-card proposal-alert">
              <div class="alert-content">
                <h4>💰 Contre-proposition du client</h4>
                <p class="proposal-amount">{{ lastRejectedQuote()?.clientProposedPrice | number }} FCFA</p>
                @if (lastRejectedQuote()?.rejectionReason) {
                  <p class="proposal-reason">« {{ lastRejectedQuote()?.rejectionReason }} »</p>
                }
              </div>
              <button class="use-proposal-btn" (click)="useClientProposal()">
                ✓ Utiliser ce montant
              </button>
            </section>
          }

          <!-- Labor Cost -->
          <section class="card">
            <h3 class="section-title">🔧 Main d'œuvre</h3>
            <div class="form-group">
              <label>Coût de la main d'œuvre (FCFA) *</label>
              <input
                type="number"
                class="form-input"
                [value]="laborCost()"
                (input)="updateLaborCost($event)"
                placeholder="Ex: 15000"
                min="0"
              />
            </div>
          </section>

          <!-- Parts Selection -->
          <section class="card">
            <h3 class="section-title">⚙️ Pièces détachées</h3>
            <p class="section-hint">Sélectionnez les pièces nécessaires</p>

            <div class="parts-grid">
              @for (part of selectableParts(); track part.name) {
                <div
                  class="part-chip"
                  [class.selected]="part.selected"
                  (click)="togglePart(part)"
                >
                  <span class="part-name">{{ part.name }}</span>
                  <span class="part-price">{{ part.price | number }} F</span>
                  @if (part.selected) {
                    <span class="check-icon">✓</span>
                  }
                </div>
              }
            </div>

            <!-- Selected Parts Details -->
            @if (getSelectedParts().length > 0) {
              <div class="selected-parts">
                <h4>Pièces sélectionnées</h4>
                @for (part of getSelectedParts(); track part.name) {
                  <div class="selected-part-row">
                    <span class="part-label">{{ part.name }}</span>
                    <div class="part-controls">
                      <label>Qté:</label>
                      <input
                        type="number"
                        class="qty-input"
                        [value]="part.quantity"
                        (input)="updatePartQuantity(part, $event)"
                        min="1"
                      />
                      <label>Prix:</label>
                      <input
                        type="number"
                        class="price-input-small"
                        [value]="part.price"
                        (input)="updatePartPrice(part, $event)"
                        min="0"
                      />
                      <span class="fcfa">F</span>
                    </div>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Duration & Notes -->
          <section class="card">
            <h3 class="section-title">🕐 Délais & Informations</h3>

            <div class="form-row">
              <div class="form-group">
                <label>Délai estimé *</label>
                <select
                  class="form-select"
                  [value]="estimatedDuration()"
                  (change)="updateDuration($event)"
                >
                  <option value="">Sélectionnez</option>
                  <option value="1h">1 heure</option>
                  <option value="2h">2 heures</option>
                  <option value="3h">3 heures</option>
                  <option value="1j">1 jour</option>
                  <option value="2j">2 jours</option>
                  <option value="3j">3 jours</option>
                  <option value="1s">1 semaine</option>
                </select>
              </div>
              <div class="form-group">
                <label>Validité</label>
                <select
                  class="form-select"
                  [value]="validityDays()"
                  (change)="updateValidity($event)"
                >
                  <option value="3">3 jours</option>
                  <option value="7">7 jours</option>
                  <option value="14">14 jours</option>
                  <option value="30">30 jours</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Notes (optionnel)</label>
              <textarea
                class="form-textarea"
                [value]="notes()"
                (input)="updateNotes($event)"
                placeholder="Conditions, recommandations..."
                rows="3"
              ></textarea>
            </div>
          </section>

          <!-- Summary -->
          <section class="card summary-card">
            <h3>💳 Récapitulatif</h3>
            <div class="summary-line">
              <span>Main d'œuvre</span>
              <span>{{ laborCost() | number }} FCFA</span>
            </div>
            <div class="summary-line">
              <span>Pièces ({{ getSelectedParts().length }})</span>
              <span>{{ partsTotal() | number }} FCFA</span>
            </div>
            @if (request()?.urgency === 'express') {
              <div class="summary-line express">
                <span>⚡ Express (+30%)</span>
                <span>{{ expressSupplementAmount() | number }} FCFA</span>
              </div>
            }
            <div class="summary-total">
              <span>Total TTC</span>
              <span class="total-amount">{{ totalAmount() | number }} FCFA</span>
            </div>
          </section>
        </div>
      }

      <!-- Bottom Actions (Always visible) -->
      <div class="bottom-actions">
        @if (errorMessage()) {
          <div class="error-banner">⚠️ {{ errorMessage() }}</div>
        }
        <ui-button
          variant="primary"
          size="lg"
          [block]="true"
          [disabled]="!canSubmit()"
          [loading]="isSubmitting()"
          icon="📤"
          (onClick)="submitQuote()"
        >
          {{ isSubmitting() ? 'Envoi en cours...' : 'Envoyer le devis' }}
        </ui-button>
      </div>

      <!-- Success Modal - Utilisation du composant partagé -->
      <ui-modal
        [isOpen]="showSuccess()"
        title="Devis envoyé !"
        size="sm"
        [closable]="false"
        [closeOnBackdrop]="false"
      >
        <div class="success-content">
          <div class="success-icon">✅</div>
          <p>Le client a été notifié.</p>
        </div>
        <div modal-footer>
          <ui-button variant="primary" [block]="true" routerLink="/repairer/requests">
            Retour aux demandes
          </ui-button>
        </div>
      </ui-modal>
    </div>
  `,
  styles: [`
    .quote-create {
      min-height: 100vh;
      background: var(--color-neutral-50, #f8fafc);
      padding-bottom: 180px;
      padding-top: 100px; /* Space for fixed header */
    }

    /* ==================== ERROR STATE ==================== */
    .error-container {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--color-text-secondary, #64748b);
    }

    .btn-link {
      color: var(--color-primary-500, #FF9800);
      text-decoration: none;
      font-weight: 500;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    /* ==================== CONTENT ==================== */
    .content {
      padding: 0 1rem;
      position: relative;
    }

    /* ==================== CARDS ==================== */
    .card {
      background: var(--color-surface, white);
      border-radius: var(--border-radius-xl, 1.25rem);
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1));
      border: 1px solid var(--color-neutral-100, rgba(0,0,0,0.04));
    }

    /* ==================== REQUEST CARD ==================== */
    .request-card {
      background: linear-gradient(135deg, var(--color-surface, #ffffff) 0%, var(--color-primary-50, #FFF3E0) 100%);
      border: none;
      box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
      position: relative;
      overflow: hidden;
    }

    .request-card::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 5px;
      background: linear-gradient(180deg, var(--color-primary-500, #FF9800), var(--color-primary-300, #FFB74D));
      border-radius: 5px 0 0 5px;
    }

    .request-card-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .device-icon-wrapper {
      width: 56px;
      height: 56px;
      background: linear-gradient(135deg, #fff5f2 0%, #ffe8e0 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid rgba(255, 107, 53, 0.15);
    }

    .device-icon {
      font-size: 1.75rem;
    }

    .device-info {
      flex: 1;
    }

    .device-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .service-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .service-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #FF6B35;
      background: rgba(255, 107, 53, 0.1);
      padding: 0.375rem 0.75rem;
      border-radius: 2rem;
    }

    .express-badge {
      display: inline-flex;
      align-items: center;
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #b45309;
      padding: 0.375rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.8125rem;
      font-weight: 600;
      border: 1px solid rgba(180, 83, 9, 0.2);
    }

    .problem-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px dashed rgba(0,0,0,0.1);
    }

    .problem-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
    }

    .problem-description {
      font-size: 0.9375rem;
      color: #475569;
      margin: 0;
      padding: 0.875rem;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-radius: 0.75rem;
      line-height: 1.5;
      border: 1px solid #e2e8f0;
    }

    /* ==================== ALERT CARD ==================== */
    .alert-card {
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      border: 2px solid #10b981;
      border-radius: 1.25rem;
      padding: 1.25rem;
      margin: 0 0 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.15);
    }

    .alert-content h4 {
      margin: 0 0 0.5rem;
      color: #047857;
      font-size: 1rem;
      font-weight: 600;
    }

    .proposal-amount {
      font-size: 1.375rem;
      font-weight: 700;
      color: #059669;
      margin: 0;
    }

    .proposal-reason {
      font-size: 0.8125rem;
      color: #065f46;
      font-style: italic;
      margin: 0.25rem 0 0;
    }

    .use-proposal-btn {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      padding: 0.75rem 1.25rem;
      border-radius: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: all 0.2s;
    }

    .use-proposal-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
    }

    /* ==================== SECTION TITLE ==================== */
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.0625rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f1f5f9;
    }

    .section-hint {
      font-size: 0.8125rem;
      color: #94a3b8;
      margin: -0.5rem 0 1rem;
      padding-left: 0.25rem;
    }

    /* ==================== FORM ==================== */
    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group:last-child {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .form-input, .form-select, .form-textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      font-size: 1rem;
      transition: all 0.2s ease;
      box-sizing: border-box;
      background: #fafbfc;
    }

    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: #FF6B35;
      background: white;
      box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    /* ==================== PARTS GRID ==================== */
    .parts-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.625rem;
    }

    .part-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.875rem;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border: 2px solid #e2e8f0;
      border-radius: 2rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.8125rem;
    }

    .part-chip:hover {
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      border-color: #cbd5e1;
    }

    .part-chip.selected {
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      border-color: #FF6B35;
      color: #FF6B35;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);
    }

    .part-name {
      font-weight: 600;
    }

    .part-price {
      color: #94a3b8;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .part-chip.selected .part-price {
      color: #FF8F5C;
    }

    .check-icon {
      font-weight: bold;
      color: #FF6B35;
    }

    /* ==================== SELECTED PARTS ==================== */
    .selected-parts {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    }

    .selected-parts h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
      margin: 0 0 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .selected-part-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      border-radius: 0.75rem;
      border: 1px solid rgba(255, 107, 53, 0.2);
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .part-label {
      font-weight: 600;
      color: #1e293b;
      font-size: 0.9375rem;
    }

    .part-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #64748b;
      font-weight: 500;
    }

    .qty-input {
      width: 55px;
      padding: 0.5rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      text-align: center;
      font-weight: 600;
    }

    .qty-input:focus {
      outline: none;
      border-color: #FF6B35;
    }

    .price-input-small {
      width: 90px;
      padding: 0.5rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.5rem;
      text-align: right;
      font-weight: 600;
    }

    .price-input-small:focus {
      outline: none;
      border-color: #FF6B35;
    }

    .fcfa {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #94a3b8;
    }

    /* ==================== SUMMARY CARD ==================== */
    .summary-card {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: white;
      border-radius: 1.25rem;
      box-shadow: 0 8px 30px rgba(15, 23, 42, 0.3);
    }

    .summary-card h3 {
      color: white;
      margin: 0 0 1.25rem;
      font-size: 1.125rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .summary-line {
      display: flex;
      justify-content: space-between;
      padding: 0.625rem 0;
      font-size: 0.9375rem;
      color: rgba(255,255,255,0.75);
    }

    .summary-line.express {
      background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(245, 158, 11, 0.15));
      margin: 0.5rem -0.75rem;
      padding: 0.625rem 0.75rem;
      border-radius: 0.5rem;
      color: #fbbf24;
      font-weight: 500;
    }

    .summary-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      margin-top: 0.75rem;
      border-top: 2px solid rgba(255,255,255,0.15);
      font-weight: 700;
      font-size: 1.0625rem;
    }

    .total-amount {
      font-size: 1.5rem;
      color: #FF6B35;
      font-weight: 800;
    }

    /* ==================== BOTTOM ACTIONS ==================== */
    .bottom-actions {
      position: fixed;
      bottom: 70px;
      left: 0;
      right: 0;
      padding: 1rem 1rem 1.25rem;
      background: linear-gradient(180deg, rgba(255,255,255,0.95), white);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 -8px 30px rgba(0,0,0,0.1);
      z-index: 1001;
    }

    .error-banner {
      background: linear-gradient(135deg, #fef2f2, #fee2e2);
      color: #dc2626;
      padding: 0.875rem;
      border-radius: 0.75rem;
      margin-bottom: 0.75rem;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid rgba(220, 38, 38, 0.2);
    }

    /* ==================== SUCCESS MODAL CONTENT ==================== */
    .success-content {
      text-align: center;
      padding: 1rem 0;
    }

    .success-content .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .success-content p {
      color: var(--color-text-secondary, #64748b);
      margin: 0;
    }

    /* ==================== RESPONSIVE ==================== */
    @media (max-width: 400px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .selected-part-row {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class QuoteCreateComponent implements OnInit {
  private readonly repairerService = inject(RepairerService);
  private readonly quotesService = inject(QuotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // Signals
  readonly request = signal<RepairerRequest | null>(null);
  readonly lastRejectedQuote = signal<Quote | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showSuccess = signal(false);

  // Form signals
  readonly laborCost = signal(0);
  readonly estimatedDuration = signal('');
  readonly validityDays = signal(7);
  readonly notes = signal('');
  readonly selectableParts = signal<SelectedPart[]>([]);

  // Computed values
  readonly partsTotal = computed(() => {
    return this.selectableParts()
      .filter(p => p.selected)
      .reduce((sum, p) => sum + (p.price * p.quantity), 0);
  });

  readonly expressSupplementAmount = computed(() => {
    if (this.request()?.urgency !== 'express') return 0;
    return Math.round((this.laborCost() + this.partsTotal()) * 0.3);
  });

  readonly totalAmount = computed(() => {
    return this.laborCost() + this.partsTotal() + this.expressSupplementAmount();
  });

  readonly canSubmit = computed(() => {
    return this.laborCost() > 0 &&
           this.estimatedDuration() !== '' &&
           this.request() !== null;
  });

  ngOnInit(): void {
    // Initialize parts list
    this.selectableParts.set(
      AVAILABLE_PARTS.map(p => ({
        name: p.name,
        price: p.defaultPrice,
        quantity: 1,
        selected: false
      }))
    );

    const requestId = this.route.snapshot.queryParams['requestId'];
    if (requestId) {
      this.loadRequest(requestId);
    } else {
      this.isLoading.set(false);
      this.router.navigate(['/repairer/requests']);
    }
  }

  async loadRequest(id: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const request = await this.repairerService.getRequest(id);
      this.request.set(request);

      const quoteHistory = await this.quotesService.getQuoteHistoryByRequest(id);
      const lastRejected = quoteHistory.find(q => q.status === 'rejected');
      if (lastRejected) {
        this.lastRejectedQuote.set(lastRejected);
      }
    } catch (err) {
      console.error('Error loading request:', err);
      this.errorMessage.set('Erreur lors du chargement de la demande');
    } finally {
      this.isLoading.set(false);
    }
  }

  useClientProposal(): void {
    const proposal = this.lastRejectedQuote()?.clientProposedPrice;
    if (proposal) {
      this.laborCost.set(Number(proposal) || 0);
      // Deselect all parts
      this.selectableParts.update(parts =>
        parts.map(p => ({ ...p, selected: false }))
      );
    }
  }

  updateLaborCost(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.laborCost.set(Number(value) || 0);
  }

  updateDuration(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.estimatedDuration.set(value);
  }

  updateValidity(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.validityDays.set(Number(value) || 7);
  }

  updateNotes(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.notes.set(value);
  }

  togglePart(part: SelectedPart): void {
    this.selectableParts.update(parts =>
      parts.map(p =>
        p.name === part.name
          ? { ...p, selected: !p.selected }
          : p
      )
    );
  }

  updatePartQuantity(part: SelectedPart, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value) || 1;
    this.selectableParts.update(parts =>
      parts.map(p =>
        p.name === part.name
          ? { ...p, quantity: Math.max(1, value) }
          : p
      )
    );
  }

  updatePartPrice(part: SelectedPart, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value) || 0;
    this.selectableParts.update(parts =>
      parts.map(p =>
        p.name === part.name
          ? { ...p, price: Math.max(0, value) }
          : p
      )
    );
  }

  getSelectedParts(): SelectedPart[] {
    return this.selectableParts().filter(p => p.selected);
  }

  async submitQuote(): Promise<void> {
    if (!this.canSubmit() || !this.request()) return;

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    try {
      const selectedParts = this.getSelectedParts();
      const dto: CreateQuoteDto = {
        requestId: this.request()!.id,
        laborCost: this.laborCost(),
        parts: selectedParts.map(p => ({
          name: p.name,
          price: p.price,
          quantity: p.quantity
        })),
        estimatedDuration: this.estimatedDuration(),
        notes: this.notes() || undefined,
        validDays: this.validityDays(),
      };

      await this.repairerService.createQuote(dto);
      this.showSuccess.set(true);
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Erreur lors de l\'envoi du devis');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goBack(): void {
    window.history.back();
  }

  getDeviceInfo(): string {
    const req = this.request();
    if (!req) return 'Appareil';

    const device = req.device;
    if (!device) return 'Appareil non spécifié';

    const brand = device.brand || '';
    const model = device.model || '';

    if (brand || model) {
      return `${brand} ${model}`.trim();
    }
    return 'Appareil non spécifié';
  }

  getServiceTypeName(): string {
    const req = this.request();
    if (!req) return 'Service';

    const serviceType = req.serviceType;
    if (!serviceType) return 'Type de service non spécifié';

    return serviceType.name || 'Service';
  }
}

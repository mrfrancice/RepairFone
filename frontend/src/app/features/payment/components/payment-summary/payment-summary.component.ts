import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaymentsService, PaymentsStore, type PaymentType, type PaymentMethod } from '@app/domains/payments';
import { QuotesService } from '@app/domains/quotes';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { UiStepperComponent } from '../../../../shared/components/ui-stepper/ui-stepper.component';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-payment-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, UiButtonComponent, UiLoadingComponent, UiHeaderComponent, UiStepperComponent, FormatDatePipe],
  template: `
    <div class="payment-container">
      <!-- Header - Utilisation du composant partagé -->
      <ui-header
        title="💳 Paiement"
        subtitle="Finalisez votre commande"
        [showBack]="true"
        (onBack)="goBack()"
      />

      <!-- Progress Steps - Utilisation du composant partagé -->
      <div class="stepper-wrapper">
        <ui-stepper
          [steps]="paymentSteps"
          [currentStep]="currentStep() - 1"
          [showNavigation]="false"
          [linear]="true"
        />
      </div>

      @if (isLoading()) {
        <ui-loading size="lg" text="Chargement..." [centered]="true" />
      } @else {
        <div class="payment-content">
          <!-- Step 1: Summary -->
          @if (store.flowState().step === 'summary') {
            <div class="step-content">
              <h2>Récapitulatif du paiement</h2>

              <!-- Quote Summary -->
              <div class="summary-card">
                <div class="summary-header">
                  <span class="summary-icon">🔧</span>
                  <div class="summary-info">
                    <span class="summary-title">Réparation</span>
                    @if (quote()?.request?.device) {
                      <span class="summary-subtitle">
                        {{ quote()?.request?.device?.brand }} {{ quote()?.request?.device?.model }}
                      </span>
                    }
                  </div>
                </div>

                <div class="price-breakdown">
                  <div class="price-row">
                    <span>Montant du devis</span>
                    <span class="price-value">{{ store.flowState().summary?.quoteAmount | number:'1.0-0' }} FCFA</span>
                  </div>
                  <div class="price-row fee">
                    <span>Frais de plateforme ({{ store.flowState().summary?.platformFeePercent }}%)</span>
                    <span class="price-value">{{ store.flowState().summary?.platformFee | number:'1.0-0' }} FCFA</span>
                  </div>
                  <div class="price-total">
                    <span>Total à payer</span>
                    <span class="total-amount">{{ store.flowState().summary?.totalAmount | number:'1.0-0' }} FCFA</span>
                  </div>
                </div>
              </div>

              <!-- Payment Type Selection -->
              <div class="payment-type-section">
                <h3>Mode de paiement</h3>
                <div class="payment-types">
                  <label class="payment-type-card" [class.selected]="store.flowState().paymentType === 'full'">
                    <input
                      type="radio"
                      name="paymentType"
                      value="full"
                      [checked]="store.flowState().paymentType === 'full'"
                      (change)="setPaymentType('full')"
                    />
                    <div class="type-content">
                      <span class="type-icon">💰</span>
                      <div class="type-info">
                        <span class="type-title">Paiement complet</span>
                        <span class="type-desc">Payez la totalité maintenant</span>
                      </div>
                      <span class="type-amount">{{ store.flowState().summary?.totalAmount | number:'1.0-0' }} FCFA</span>
                    </div>
                  </label>

                  <label class="payment-type-card" [class.selected]="store.flowState().paymentType === 'deposit'">
                    <input
                      type="radio"
                      name="paymentType"
                      value="deposit"
                      [checked]="store.flowState().paymentType === 'deposit'"
                      (change)="setPaymentType('deposit')"
                    />
                    <div class="type-content">
                      <span class="type-icon">📝</span>
                      <div class="type-info">
                        <span class="type-title">Acompte ({{ store.flowState().summary?.depositPercent || 30 }}%)</span>
                        <span class="type-desc">Payez le solde après réparation</span>
                      </div>
                      <span class="type-amount">{{ getDepositAmount() | number:'1.0-0' }} FCFA</span>
                    </div>
                  </label>
                </div>

                @if (store.flowState().paymentType === 'deposit') {
                  <div class="deposit-info">
                    <span class="info-icon">ℹ️</span>
                    <p>
                      Vous paierez <strong>{{ getDepositAmount() | number:'1.0-0' }} FCFA</strong> maintenant
                      et <strong>{{ getBalanceAmount() | number:'1.0-0' }} FCFA</strong> après la réparation.
                    </p>
                  </div>
                }
              </div>

              <!-- Security Badge -->
              <div class="security-badge">
                <span class="badge-icon">🔒</span>
                <div class="badge-text">
                  <strong>Paiement sécurisé</strong>
                  <p>Vos fonds sont bloqués jusqu'à validation de la réparation</p>
                </div>
              </div>

              <!-- Dispute Warning -->
              <div class="warning-badge">
                <span class="badge-icon">⚠️</span>
                <div class="badge-text">
                  <strong>Paiement bloqué en cas de litige</strong>
                  <p>Protection garantie de vos fonds</p>
                </div>
              </div>
            </div>
          }

          <!-- Step 2: Payment Method -->
          @if (store.flowState().step === 'method') {
            <div class="step-content">
              <h2>Choisissez votre moyen de paiement</h2>
              <p class="step-subtitle">Paiement mobile money sécurisé</p>

              <div class="methods-list">
                <label
                  class="method-card orange-money"
                  [class.selected]="store.flowState().selectedMethod === 'orange_money'"
                  [class.disabled]="!isMethodAvailable('orange_money')"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="orange_money"
                    [checked]="store.flowState().selectedMethod === 'orange_money'"
                    [disabled]="!isMethodAvailable('orange_money')"
                    (change)="setPaymentMethod('orange_money')"
                  />
                  <div class="method-logo orange-bg">
                    <span class="logo-text">OM</span>
                  </div>
                  <div class="method-info">
                    <span class="method-name">Orange Money</span>
                    <span class="method-desc">Paiement instantané et sécurisé</span>
                  </div>
                  @if (!isMethodAvailable('orange_money')) {
                    <span class="method-badge unavailable">Bientôt</span>
                  } @else {
                    <span class="method-check">✓</span>
                  }
                </label>

                <label
                  class="method-card mtn-money"
                  [class.selected]="store.flowState().selectedMethod === 'mtn_money'"
                  [class.disabled]="!isMethodAvailable('mtn_money')"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="mtn_money"
                    [checked]="store.flowState().selectedMethod === 'mtn_money'"
                    [disabled]="!isMethodAvailable('mtn_money')"
                    (change)="setPaymentMethod('mtn_money')"
                  />
                  <div class="method-logo mtn-bg">
                    <span class="logo-text">MTN</span>
                  </div>
                  <div class="method-info">
                    <span class="method-name">MTN Money</span>
                    <span class="method-desc">Mobile money rapide</span>
                  </div>
                  @if (!isMethodAvailable('mtn_money')) {
                    <span class="method-badge unavailable">Bientôt</span>
                  } @else {
                    <span class="method-check">✓</span>
                  }
                </label>

                <label
                  class="method-card wave"
                  [class.selected]="store.flowState().selectedMethod === 'wave'"
                  [class.disabled]="!isMethodAvailable('wave')"
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="wave"
                    [checked]="store.flowState().selectedMethod === 'wave'"
                    [disabled]="!isMethodAvailable('wave')"
                    (change)="setPaymentMethod('wave')"
                  />
                  <div class="method-logo wave-bg">
                    <span class="logo-text">W</span>
                  </div>
                  <div class="method-info">
                    <span class="method-name">Wave</span>
                    <span class="method-desc">Paiement mobile sans frais</span>
                  </div>
                  @if (!isMethodAvailable('wave')) {
                    <span class="method-badge unavailable">Bientôt</span>
                  } @else {
                    <span class="method-check">✓</span>
                  }
                </label>
              </div>

              <!-- Amount to pay reminder -->
              <div class="amount-reminder">
                <span>Montant à payer:</span>
                <span class="amount">{{ getAmountToPay() | number:'1.0-0' }} FCFA</span>
              </div>
            </div>
          }

          <!-- Step 3: Confirmation -->
          @if (store.flowState().step === 'confirm') {
            <div class="step-content">
              <h2>Confirmez le paiement</h2>

              <!-- Phone Number Input -->
              <div class="phone-section">
                <label for="phoneNumber">Numéro de téléphone {{ getMethodName() }}</label>
                <div class="phone-input-wrapper">
                  <span class="phone-prefix">+225</span>
                  <input
                    type="tel"
                    id="phoneNumber"
                    [value]="store.flowState().phoneNumber"
                    (input)="onPhoneInput($event)"
                    placeholder="07 XX XX XX XX"
                    maxlength="14"
                    class="phone-input"
                  />
                </div>
                @if (phoneError()) {
                  <span class="phone-error">{{ phoneError() }}</span>
                }
              </div>

              <!-- Payment Summary -->
              <div class="confirm-summary">
                <div class="confirm-row">
                  <span>Moyen de paiement</span>
                  <span class="confirm-value">
                    {{ getMethodName() }}
                  </span>
                </div>
                <div class="confirm-row">
                  <span>Type</span>
                  <span class="confirm-value">{{ paymentService.getPaymentTypeLabel(store.flowState().paymentType) }}</span>
                </div>
                <div class="confirm-row total">
                  <span>Montant</span>
                  <span class="confirm-amount">{{ getAmountToPay() | number:'1.0-0' }} FCFA</span>
                </div>
              </div>

              <!-- Instructions -->
              <div class="instructions">
                <h4>Instructions</h4>
                <ol>
                  <li>Cliquez sur "Payer maintenant"</li>
                  <li>Vous recevrez une notification sur votre téléphone</li>
                  <li>Validez le paiement avec votre code PIN</li>
                  <li>Attendez la confirmation</li>
                </ol>
              </div>
            </div>
          }

          <!-- Step 4: Processing -->
          @if (store.flowState().step === 'processing') {
            <div class="step-content processing-step">
              <div class="processing-animation">
                <div class="processing-circle"></div>
                <span class="processing-icon">📱</span>
              </div>
              <h2>Paiement en cours...</h2>
              <p>Veuillez valider le paiement sur votre téléphone</p>
              <p class="processing-phone">{{ formatPhone() }}</p>

              <div class="processing-tips">
                <p>💡 Vérifiez votre téléphone pour la notification</p>
                <p>🔐 Entrez votre code PIN pour confirmer</p>
              </div>
            </div>
          }

          <!-- Step 5: Result -->
          @if (store.flowState().step === 'result') {
            <div class="step-content result-step">
              @if (paymentSuccess()) {
                <div class="result-success">
                  <span class="result-icon">✅</span>
                  <h2>Paiement réussi !</h2>
                  <p>Votre paiement de <strong>{{ getAmountToPay() | number:'1.0-0' }} FCFA</strong> a été confirmé.</p>

                  <div class="result-details">
                    <div class="result-row">
                      <span>Référence</span>
                      <span class="ref-number">{{ store.flowState().currentPayment?.transactionRef }}</span>
                    </div>
                    <div class="result-row">
                      <span>Date</span>
                      <span>{{ store.flowState().currentPayment?.paidAt | formatDate }}</span>
                    </div>
                  </div>

                  @if (store.flowState().paymentType === 'deposit') {
                    <div class="balance-reminder">
                      <span class="reminder-icon">📝</span>
                      <p>Solde restant à payer après réparation: <strong>{{ getBalanceAmount() | number:'1.0-0' }} FCFA</strong></p>
                    </div>
                  }
                </div>
              } @else {
                <div class="result-failed">
                  <span class="result-icon">❌</span>
                  <h2>Paiement échoué</h2>
                  <p>{{ paymentError() || 'Une erreur est survenue lors du paiement.' }}</p>

                  <ui-button variant="primary" (click)="retryPayment()">
                    Réessayer
                  </ui-button>
                </div>
              }
            </div>
          }

          <!-- Navigation -->
          @if (store.flowState().step !== 'processing' && store.flowState().step !== 'result') {
            <div class="navigation">
              @if (store.flowState().step !== 'summary') {
                <ui-button variant="outline" (click)="previousStep()">
                  ← Retour
                </ui-button>
              } @else {
                <div></div>
              }

              @if (store.flowState().step === 'confirm') {
                <ui-button
                  variant="primary"
                  [disabled]="!canSubmit()"
                  [loading]="isProcessing()"
                  (click)="submitPayment()"
                >
                  Payer {{ getAmountToPay() | number:'1.0-0' }} FCFA
                </ui-button>
              } @else {
                <ui-button
                  variant="primary"
                  [disabled]="!canProceed()"
                  (click)="nextStep()"
                >
                  Continuer →
                </ui-button>
              }
            </div>
          }

          @if (store.flowState().step === 'result' && paymentSuccess()) {
            <div class="navigation">
              <ui-button variant="outline" (click)="goToPayments()">
                Voir mes paiements
              </ui-button>
              <ui-button variant="primary" (click)="goToTracking()">
                Suivre ma réparation
              </ui-button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .payment-container {
      min-height: 100vh;
      background: var(--color-background, #FAFAFA);
      padding-top: var(--header-height, 100px);
      padding-bottom: 2rem;
    }

    /* Progress Bar */
    .progress-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: white;
      border-bottom: 1px solid #EEEEEE;
    }

    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .step-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #E0E0E0;
      color: #757575;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-step.active .step-number {
      background: #FF9800;
      color: white;
    }

    .progress-step.completed .step-number {
      background: #4CAF50;
      color: white;
    }

    .step-label {
      font-size: 0.75rem;
      color: #757575;
    }

    .progress-step.active .step-label {
      color: #FF9800;
      font-weight: 500;
    }

    .progress-line {
      width: 40px;
      height: 2px;
      background: #E0E0E0;
      margin: 0 0.5rem;
      margin-bottom: 1rem;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-line.active {
      background: #4CAF50;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
      color: #757575;
    }

    .payment-content {
      padding: 1rem;
    }

    .step-content {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
    }

    .step-content h2 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      font-weight: 600;
      color: #212121;
    }

    .step-subtitle {
      color: #757575;
      font-size: 0.875rem;
      margin: 0 0 1.5rem;
      display: block;
    }

    /* Summary Card */
    .summary-card {
      background: #FFF8E1;
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      border: 1px solid #FFEB3B;
    }

    .summary-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #FDD835;
    }

    .summary-icon {
      font-size: 2rem;
    }

    .summary-info {
      display: flex;
      flex-direction: column;
    }

    .summary-title {
      font-weight: 600;
      color: #212121;
    }

    .summary-subtitle {
      font-size: 0.875rem;
      color: #616161;
    }

    .price-breakdown {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: #616161;
    }

    .price-row .price-value {
      font-weight: 500;
      color: #424242;
    }

    .price-row.fee {
      color: #757575;
    }

    .price-total {
      display: flex;
      justify-content: space-between;
      padding-top: 0.75rem;
      margin-top: 0.5rem;
      border-top: 2px solid #FDD835;
      font-weight: 600;
      font-size: 1.125rem;
    }

    .total-amount {
      color: #FF9800;
      font-weight: 700;
    }

    /* Payment Type */
    .payment-type-section h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
      font-weight: 600;
      color: #212121;
    }

    .payment-types {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .payment-type-card {
      display: block;
      padding: 1rem;
      border: 2px solid #E0E0E0;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .payment-type-card:hover {
      border-color: #FF9800;
      box-shadow: 0 2px 8px 0 rgba(255, 152, 0, 0.15);
    }

    .payment-type-card.selected {
      border-color: #FF9800;
      background: #FFF3E0;
      box-shadow: 0 2px 8px 0 rgba(255, 152, 0, 0.15);
    }

    .payment-type-card input {
      display: none;
    }

    .type-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .type-icon {
      font-size: 1.5rem;
    }

    .type-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .type-title {
      font-weight: 600;
      color: #212121;
    }

    .type-desc {
      font-size: 0.75rem;
      color: #757575;
    }

    .type-amount {
      font-weight: 600;
      color: #FF9800;
    }

    .deposit-info {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: #FFFBF0;
      border-radius: 0.5rem;
      margin-top: 1rem;
      border: 1px solid #FFC107;
    }

    .info-icon {
      font-size: 1.25rem;
    }

    .deposit-info p {
      margin: 0;
      font-size: 0.875rem;
      color: #616161;
    }

    /* Security & Warning Badges */
    .security-badge,
    .warning-badge {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 0.75rem;
      margin-top: 1.5rem;
    }

    .security-badge {
      background: #E8F5E9;
      border: 1px solid #4CAF50;
    }

    .warning-badge {
      background: #FFF4D5;
      border: 1px solid #FFC107;
    }

    .badge-icon {
      font-size: 1.5rem;
    }

    .badge-text {
      display: flex;
      flex-direction: column;
    }

    .security-badge .badge-text strong {
      color: #2E7D32;
      margin-bottom: 0.25rem;
    }

    .security-badge .badge-text p {
      margin: 0;
      font-size: 0.75rem;
      color: #388E3C;
    }

    .warning-badge .badge-text strong {
      color: #F57C00;
      margin-bottom: 0.25rem;
    }

    .warning-badge .badge-text p {
      margin: 0;
      font-size: 0.75rem;
      color: #FF8F00;
    }

    /* Methods List */
    .methods-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .method-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid #E0E0E0;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .method-card:hover:not(.disabled) {
      border-color: #FF9800;
      box-shadow: 0 2px 8px 0 rgba(255, 152, 0, 0.15);
    }

    .method-card.selected {
      border-color: #FF9800;
      background: #FFF3E0;
      box-shadow: 0 2px 8px 0 rgba(255, 152, 0, 0.15);
    }

    .method-card.disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .method-card input {
      display: none;
    }

    .method-logo {
      width: 56px;
      height: 56px;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
    }

    .orange-bg {
      background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
      color: white;
    }

    .mtn-bg {
      background: linear-gradient(135deg, #FFEB3B 0%, #FBC02D 100%);
      color: #212121;
    }

    .wave-bg {
      background: linear-gradient(135deg, #2196F3 0%, #1565C0 100%);
      color: white;
    }

    .logo-text {
      font-family: 'Poppins', sans-serif;
      letter-spacing: -0.02em;
    }

    .method-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .method-name {
      font-weight: 600;
      color: #212121;
    }

    .method-desc {
      font-size: 0.75rem;
      color: #757575;
    }

    .method-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
    }

    .method-badge.unavailable {
      background: #F5F5F5;
      color: #757575;
    }

    .method-check {
      color: #FF9800;
      font-weight: bold;
      font-size: 1.25rem;
      opacity: 0;
      transition: opacity 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .method-card.selected .method-check {
      opacity: 1;
    }

    .amount-reminder {
      display: flex;
      justify-content: space-between;
      padding: 1rem;
      background: #FFF8E1;
      border-radius: 0.5rem;
      margin-top: 1.5rem;
      border: 1px solid #FFEB3B;
    }

    .amount-reminder .amount {
      font-weight: 600;
      color: #FF9800;
    }

    /* Phone Section */
    .phone-section {
      margin-bottom: 1.5rem;
    }

    .phone-section label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #424242;
    }

    .phone-input-wrapper {
      display: flex;
      border: 2px solid #E0E0E0;
      border-radius: 0.75rem;
      overflow: hidden;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .phone-input-wrapper:focus-within {
      border-color: #FF9800;
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
    }

    .phone-prefix {
      padding: 0.875rem 1rem;
      background: #F5F5F5;
      border-right: 1px solid #E0E0E0;
      color: #616161;
      font-weight: 500;
    }

    .phone-input {
      flex: 1;
      padding: 0.875rem 1rem;
      border: none;
      font-size: 1rem;
      outline: none;
    }

    .phone-error {
      display: block;
      color: #C62828;
      font-size: 0.75rem;
      margin-top: 0.5rem;
    }

    /* Confirm Summary */
    .confirm-summary {
      background: #FFF8E1;
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      border: 1px solid #FFEB3B;
    }

    .confirm-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      color: #616161;
    }

    .confirm-value {
      font-weight: 500;
      color: #212121;
    }

    .confirm-row.total {
      border-top: 2px solid #FDD835;
      margin-top: 0.5rem;
      padding-top: 0.75rem;
    }

    .confirm-amount {
      font-size: 1.25rem;
      font-weight: 700;
      color: #FF9800;
    }

    /* Instructions */
    .instructions {
      background: #E3F2FD;
      border-radius: 0.75rem;
      padding: 1rem;
      border: 1px solid #2196F3;
    }

    .instructions h4 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      color: #1565C0;
      font-weight: 600;
    }

    .instructions ol {
      margin: 0;
      padding-left: 1.25rem;
    }

    .instructions li {
      font-size: 0.875rem;
      color: #1976D2;
      margin-bottom: 0.5rem;
    }

    /* Processing Step */
    .processing-step {
      text-align: center;
      padding: 3rem 1.5rem;
    }

    .processing-animation {
      position: relative;
      width: 120px;
      height: 120px;
      margin: 0 auto 2rem;
    }

    .processing-circle {
      position: absolute;
      inset: 0;
      border: 4px solid #E0E0E0;
      border-top-color: #FF9800;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .processing-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 3rem;
    }

    .processing-step h2 {
      margin-bottom: 0.5rem;
      color: #212121;
    }

    .processing-step p {
      color: #757575;
      margin: 0;
    }

    .processing-phone {
      font-size: 1.25rem;
      font-weight: 600;
      color: #FF9800;
      margin-top: 0.5rem !important;
    }

    .processing-tips {
      margin-top: 2rem;
      padding: 1rem;
      background: #FFF8E1;
      border-radius: 0.75rem;
      border: 1px solid #FFEB3B;
    }

    .processing-tips p {
      margin: 0.5rem 0;
      font-size: 0.875rem;
      color: #616161;
    }

    /* Result Step */
    .result-step {
      text-align: center;
      padding: 2rem 1.5rem;
    }

    .result-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .result-success h2 {
      color: #2E7D32;
      margin-bottom: 0.5rem;
    }

    .result-failed h2 {
      color: #C62828;
      margin-bottom: 0.5rem;
    }

    .result-success p,
    .result-failed p {
      color: #757575;
    }

    .result-details {
      background: #F5F5F5;
      border-radius: 0.75rem;
      padding: 1rem;
      margin: 1.5rem 0;
      text-align: left;
    }

    .result-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      color: #616161;
    }

    .result-row span:last-child {
      font-weight: 500;
      color: #212121;
    }

    .ref-number {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
    }

    .balance-reminder {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: #FFFBF0;
      border-radius: 0.75rem;
      text-align: left;
      border: 1px solid #FFC107;
    }

    .reminder-icon {
      font-size: 1.5rem;
    }

    .balance-reminder p {
      margin: 0;
      font-size: 0.875rem;
      color: #616161;
    }

    /* Navigation */
    .navigation {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
    }

    .navigation > * {
      flex: 1;
    }

    @media (max-width: 640px) {
      .step-content {
        padding: 1rem;
      }

      .navigation {
        flex-direction: column;
      }
    }
  `]
})
export class PaymentSummaryComponent implements OnInit {
  readonly paymentService = inject(PaymentsService);
  readonly store = inject(PaymentsStore);
  private readonly quotesService = inject(QuotesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  readonly isLoading = signal(true);
  readonly isProcessing = signal(false);
  readonly quote = signal<any>(null);
  readonly phoneError = signal<string | null>(null);
  readonly paymentSuccess = signal(false);
  readonly paymentError = signal<string | null>(null);

  readonly currentStep = computed(() => {
    const step = this.store.flowState().step;
    const steps = ['summary', 'method', 'confirm', 'processing', 'result'];
    return steps.indexOf(step) + 1;
  });

  // Configuration des étapes du stepper
  readonly paymentSteps = [
    { label: 'Récapitulatif', icon: '📋' },
    { label: 'Moyen', icon: '💳' },
    { label: 'Confirmation', icon: '✅' },
  ];

  async ngOnInit(): Promise<void> {
    const requestId = this.route.snapshot.queryParamMap.get('requestId');
    const quoteId = this.route.snapshot.queryParamMap.get('quoteId');

    if (!requestId || !quoteId) {
      this.router.navigate(['/requests']);
      return;
    }

    try {
      const quote = await this.quotesService.getQuote(quoteId);
      this.quote.set(quote);

      const summary = this.paymentService.calculateSummary(quote.totalAmount);
      this.store.initFlow(requestId, quoteId, quote.totalAmount, summary);
    } catch (err) {
      this.logger.error('PaymentSummaryComponent', 'Error loading quote', err);
      this.router.navigate(['/requests']);
    } finally {
      this.isLoading.set(false);
    }
  }

  setPaymentType(type: PaymentType): void {
    this.store.setPaymentType(type);
    const summary = this.paymentService.calculateSummary(
      this.store.flowState().quoteAmount,
      type
    );
    this.store.initFlow(
      this.store.flowState().requestId!,
      this.store.flowState().quoteId!,
      this.store.flowState().quoteAmount,
      summary
    );
    this.store.setPaymentType(type);
  }

  setPaymentMethod(method: PaymentMethod): void {
    this.store.setSelectedMethod(method);
  }

  isMethodAvailable(method: string): boolean {
    return this.paymentService.paymentMethods.find(m => m.id === method)?.available || false;
  }

  getDepositAmount(): number {
    const summary = this.store.flowState().summary;
    if (summary?.depositAmount) return summary.depositAmount;
    return Math.round((summary?.totalAmount || 0) * 0.3);
  }

  getBalanceAmount(): number {
    const summary = this.store.flowState().summary;
    if (summary?.balanceAmount) return summary.balanceAmount;
    return (summary?.totalAmount || 0) - this.getDepositAmount();
  }

  getAmountToPay(): number {
    const state = this.store.flowState();
    if (state.paymentType === 'deposit') {
      return this.getDepositAmount();
    }
    return state.summary?.totalAmount || 0;
  }

  getMethodName(): string {
    const method = this.store.flowState().selectedMethod;
    return this.paymentService.paymentMethods.find(m => m.id === method)?.name || '';
  }

  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.length > 0) {
      value = value.match(/.{1,2}/g)?.join(' ') || value;
    }

    this.store.setPhoneNumber(value.replace(/\s/g, ''));
    input.value = value;

    const method = this.store.flowState().selectedMethod;
    if (method && value.replace(/\s/g, '').length === 10) {
      if (!this.paymentService.validatePhoneNumber(value, method)) {
        this.phoneError.set('Numéro invalide pour ' + this.getMethodName());
      } else {
        this.phoneError.set(null);
      }
    } else {
      this.phoneError.set(null);
    }
  }

  formatPhone(): string {
    return this.paymentService.formatPhoneNumber(this.store.flowState().phoneNumber);
  }

  canProceed(): boolean {
    const state = this.store.flowState();
    switch (state.step) {
      case 'summary':
        return true;
      case 'method':
        return state.selectedMethod !== null;
      default:
        return false;
    }
  }

  canSubmit(): boolean {
    const state = this.store.flowState();
    return state.phoneNumber.length === 10 && !this.phoneError();
  }

  nextStep(): void {
    this.store.nextStep();
  }

  previousStep(): void {
    this.store.previousStep();
  }

  async submitPayment(): Promise<void> {
    const state = this.store.flowState();
    if (!state.requestId || !state.quoteId || !state.selectedMethod) return;

    this.isProcessing.set(true);
    this.store.setStep('processing');

    try {
      const payment = await this.paymentService.initiatePayment({
        requestId: state.requestId,
        quoteId: state.quoteId,
        paymentMethod: state.selectedMethod,
        paymentType: state.paymentType,
        phoneNumber: state.phoneNumber,
      });

      this.store.setCurrentPayment(payment);

      await new Promise(resolve => setTimeout(resolve, 3000));

      this.paymentSuccess.set(true);
      this.store.setStep('result');
    } catch (err: any) {
      this.paymentError.set(err.message || 'Erreur lors du paiement');
      this.paymentSuccess.set(false);
      this.store.setStep('result');
    } finally {
      this.isProcessing.set(false);
    }
  }

  retryPayment(): void {
    this.paymentError.set(null);
    this.store.setStep('confirm');
  }

  goToPayments(): void {
    this.router.navigate(['/payments']);
  }

  goToTracking(): void {
    this.router.navigate(['/tracking', this.store.flowState().requestId]);
  }

  goBack(): void {
    if (this.store.flowState().step === 'summary') {
      window.history.back();
    } else {
      this.previousStep();
    }
  }
}

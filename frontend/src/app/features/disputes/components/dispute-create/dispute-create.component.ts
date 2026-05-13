import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DisputesService, DisputeReason, CreateDisputeDto, DisputesStore } from '@app/domains/disputes';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiStepperComponent } from '../../../../shared/components/ui-stepper/ui-stepper.component';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-dispute-create',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    UiButtonComponent,
    UiStepperComponent,
    UiHeaderComponent,
  ],
  template: `
    <div class="dispute-create">
      <ui-header
        title="Signaler un problème"
        subtitle="Nous allons vous aider à résoudre ce litige"
        [showBack]="true"
        (onBack)="goBack()"
      />

      <!-- Stepper -->
      <div class="stepper-wrapper">
        <ui-stepper
          [steps]="steps"
          [currentStep]="getCurrentStepIndex()"
        />
      </div>

      <!-- Step 1: Reason -->
      @if (store.formState().step === 'reason') {
        <div class="step-content">
          <h2>Quel est le problème ?</h2>
          <p class="step-description">Sélectionnez la raison principale de votre réclamation</p>

          <div class="reasons-grid">
            <button
              type="button"
              class="reason-card"
              [class.selected]="store.formState().reason === 'non_conforming_repair'"
              (click)="selectReason('non_conforming_repair')"
            >
              <span class="reason-icon">⚠️</span>
              <div class="reason-content">
                <span class="reason-label">Réparation non conforme</span>
                <span class="reason-description">Le travail ne correspond pas à ce qui était prévu</span>
              </div>
              @if (store.formState().reason === 'non_conforming_repair') {
                <span class="check-indicator">✓</span>
              }
            </button>

            <button
              type="button"
              class="reason-card"
              [class.selected]="store.formState().reason === 'delay'"
              (click)="selectReason('delay')"
            >
              <span class="reason-icon">⏱️</span>
              <div class="reason-content">
                <span class="reason-label">Retard</span>
                <span class="reason-description">La réparation n'est pas terminée dans les délais</span>
              </div>
              @if (store.formState().reason === 'delay') {
                <span class="check-indicator">✓</span>
              }
            </button>

            <button
              type="button"
              class="reason-card"
              [class.selected]="store.formState().reason === 'price_not_respected'"
              (click)="selectReason('price_not_respected')"
            >
              <span class="reason-icon">💰</span>
              <div class="reason-content">
                <span class="reason-label">Prix non respecté</span>
                <span class="reason-description">Le montant demandé diffère du devis</span>
              </div>
              @if (store.formState().reason === 'price_not_respected') {
                <span class="check-indicator">✓</span>
              }
            </button>
          </div>
        </div>
      }

      <!-- Step 2: Details -->
      @if (store.formState().step === 'details') {
        <div class="step-content">
          <h2>Décrivez votre problème</h2>
          <p class="step-description">Plus vous donnez de détails, plus vite nous pourrons vous aider</p>

          <div class="form-group">
            <label>Description détaillée *</label>
            <textarea
              [ngModel]="store.formState().description"
              (ngModelChange)="updateDescription($event)"
              placeholder="Expliquez ce qui s'est passé, quand, et ce que vous attendiez..."
              rows="6"
            ></textarea>
            <span class="char-count" [class.error]="store.formState().description.length < 20">
              {{ store.formState().description.length }}/20 caractères minimum
            </span>
          </div>

          <div class="tips-card">
            <h4>💡 Conseils pour une résolution rapide</h4>
            <ul>
              <li>Soyez précis sur les dates et les faits</li>
              <li>Mentionnez ce qui a été convenu initialement</li>
              <li>Expliquez ce que vous attendez comme solution</li>
            </ul>
          </div>
        </div>
      }

      <!-- Step 3: Evidence -->
      @if (store.formState().step === 'evidence') {
        <div class="step-content">
          <h2>Ajoutez des preuves</h2>
          <p class="step-description">Les photos aident à mieux comprendre votre situation (optionnel)</p>

          <div class="photos-grid">
            @for (photo of store.formState().photos; track $index) {
              <div class="photo-item">
                <img [src]="photo" alt="Photo {{ $index + 1 }}" />
                <button class="remove-btn" (click)="removePhoto($index)">×</button>
              </div>
            }

            @if (store.formState().photos.length < 5) {
              <label class="add-photo-btn">
                <input
                  type="file"
                  accept="image/*"
                  (change)="onPhotoSelected($event)"
                  hidden
                />
                <span class="icon">📷</span>
                <span class="label">Ajouter une photo</span>
              </label>
            }
          </div>

          <p class="photo-hint">Maximum 5 photos. Formats: JPG, PNG</p>

          <div class="evidence-tips">
            <h4>📸 Quelles preuves ajouter ?</h4>
            <ul>
              <li>Photos du problème actuel</li>
              <li>Captures d'écran des conversations</li>
              <li>Photos de l'état avant réparation</li>
              <li>Devis ou facture reçus</li>
            </ul>
          </div>
        </div>
      }

      <!-- Step 4: Confirm -->
      @if (store.formState().step === 'confirm') {
        <div class="step-content">
          <h2>Récapitulatif</h2>
          <p class="step-description">Vérifiez les informations avant de soumettre</p>

          <div class="recap-card">
            <div class="recap-section">
              <label>Raison</label>
              <div class="recap-value">
                <span class="reason-icon-small">{{ getSelectedReasonIcon() }}</span>
                <span>{{ getSelectedReasonLabel() }}</span>
              </div>
            </div>

            <div class="recap-section">
              <label>Description</label>
              <p class="description-preview">{{ store.formState().description }}</p>
            </div>

            @if (store.formState().photos.length > 0) {
              <div class="recap-section">
                <label>Preuves ({{ store.formState().photos.length }})</label>
                <div class="photos-preview">
                  @for (photo of store.formState().photos; track $index) {
                    <img [src]="photo" alt="Photo {{ $index + 1 }}" />
                  }
                </div>
              </div>
            }
          </div>

          <div class="info-card">
            <h4>📋 Ce qui va se passer</h4>
            <ol>
              <li>Votre litige sera ouvert et assigné à notre équipe</li>
              <li>Le réparateur sera notifié et pourra répondre</li>
              <li>Notre équipe examinera le dossier sous 24-48h</li>
              <li>Une solution sera proposée (remboursement, réparation, etc.)</li>
            </ol>
          </div>

          <div class="support-badge">
            <span class="badge-icon">🎧</span>
            <div class="badge-text">
              <strong>Support plateforme intégré</strong>
              <p>Notre équipe vous accompagne tout au long de la résolution</p>
            </div>
          </div>

          <div class="warning-card">
            <p>
              <strong>⚠️ Important :</strong> Si vous avez un paiement en cours, il sera bloqué
              jusqu'à la résolution du litige pour protéger vos intérêts.
            </p>
          </div>
        </div>
      }

      <!-- Navigation -->
      <div class="navigation">
        @if (store.formState().step !== 'reason') {
          <ui-button variant="outline" (onClick)="previousStep()">
            ← Précédent
          </ui-button>
        } @else {
          <div></div>
        }

        @if (store.formState().step === 'confirm') {
          <ui-button
            variant="danger"
            [loading]="isSubmitting()"
            (onClick)="submit()"
          >
            Soumettre le litige
          </ui-button>
        } @else {
          <ui-button
            variant="primary"
            [disabled]="!store.canProceed()"
            (onClick)="nextStep()"
          >
            Suivant →
          </ui-button>
        }
      </div>

      <!-- Success Modal -->
      @if (showSuccess()) {
        <div class="modal-overlay">
          <div class="modal-content success">
            <div class="success-icon">✅</div>
            <h3>Litige ouvert</h3>
            <p>Votre réclamation a été enregistrée. Notre équipe va l'examiner dans les plus brefs délais.</p>
            <p class="ref">Référence: #{{ createdDisputeId() }}</p>
            <div class="modal-actions">
              <ui-button variant="primary" (onClick)="goToDispute()">
                Voir le litige
              </ui-button>
              <ui-button variant="outline" (onClick)="goToList()">
                Mes litiges
              </ui-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dispute-create {
      min-height: 100vh;
      background: var(--color-background, #FAFAFA);
      padding-top: var(--header-height, 100px);
      padding-bottom: 6rem;
    }

    .stepper-wrapper {
      background: white;
      padding: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid #EEEEEE;
    }

    .step-content {
      background: white;
      border-radius: 1rem;
      padding: 1.5rem;
      margin: 0 1rem 1rem;
      box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
    }

    .step-content h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #212121;
      margin: 0 0 0.25rem 0;
    }

    .step-description {
      color: #757575;
      font-size: 0.875rem;
      margin: 0 0 1.5rem 0;
    }

    .reasons-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .reason-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: white;
      border: 2px solid #E0E0E0;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      text-align: left;
    }

    .reason-card:hover {
      border-color: #C62828;
      box-shadow: 0 2px 8px 0 rgba(198, 40, 40, 0.15);
    }

    .reason-card.selected {
      border-color: #C62828;
      background: #FFEBEE;
      box-shadow: 0 2px 8px 0 rgba(198, 40, 40, 0.15);
    }

    .reason-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .reason-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .reason-label {
      font-weight: 600;
      color: #212121;
      font-size: 0.9375rem;
    }

    .reason-description {
      font-size: 0.8125rem;
      color: #757575;
    }

    .check-indicator {
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: #C62828;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #424242;
      margin-bottom: 0.5rem;
    }

    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #E0E0E0;
      border-radius: 0.75rem;
      font-size: 0.9375rem;
      resize: vertical;
      min-height: 120px;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
      font-family: inherit;
    }

    .form-group textarea:focus {
      outline: none;
      border-color: #FF9800;
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
    }

    .char-count {
      display: block;
      font-size: 0.75rem;
      color: #757575;
      margin-top: 0.25rem;
      text-align: right;
    }

    .char-count.error {
      color: #C62828;
    }

    .tips-card,
    .evidence-tips {
      padding: 1rem;
      background: #E8F5E9;
      border-radius: 0.75rem;
      border: 1px solid #4CAF50;
    }

    .tips-card h4,
    .evidence-tips h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #2E7D32;
      margin: 0 0 0.5rem 0;
    }

    .tips-card ul,
    .evidence-tips ul {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.8125rem;
      color: #388E3C;
    }

    .tips-card li,
    .evidence-tips li {
      margin-bottom: 0.25rem;
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .photo-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .photo-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .remove-btn {
      position: absolute;
      top: 0.25rem;
      right: 0.25rem;
      width: 1.5rem;
      height: 1.5rem;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .remove-btn:hover {
      background: #C62828;
    }

    .add-photo-btn {
      aspect-ratio: 1;
      border: 2px dashed #BDBDBD;
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      cursor: pointer;
      transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .add-photo-btn:hover {
      border-color: #FF9800;
      background: #FFF3E0;
    }

    .add-photo-btn .icon {
      font-size: 1.5rem;
    }

    .add-photo-btn .label {
      font-size: 0.75rem;
      color: #757575;
    }

    .photo-hint {
      font-size: 0.75rem;
      color: #6B7280;  /* WCAG AA compliant */
      margin: 0 0 1.5rem 0;
    }

    .recap-card {
      background: #FFF8E1;
      border: 1px solid #FFEB3B;
      border-radius: 0.75rem;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    .recap-section {
      padding: 0.75rem 0;
      border-bottom: 1px solid #FDD835;
    }

    .recap-section:last-child {
      border-bottom: none;
    }

    .recap-section label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: #757575;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }

    .recap-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      color: #212121;
    }

    .reason-icon-small {
      font-size: 1.25rem;
    }

    .description-preview {
      font-size: 0.875rem;
      color: #616161;
      line-height: 1.6;
      margin: 0;
    }

    .photos-preview {
      display: flex;
      gap: 0.5rem;
    }

    .photos-preview img {
      width: 3rem;
      height: 3rem;
      object-fit: cover;
      border-radius: 0.375rem;
    }

    .info-card {
      padding: 1rem;
      margin-bottom: 1rem;
      background: #E3F2FD;
      border-radius: 0.75rem;
      border: 1px solid #2196F3;
    }

    .info-card h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1565C0;
      margin: 0 0 0.75rem 0;
    }

    .info-card ol {
      margin: 0;
      padding-left: 1.25rem;
      font-size: 0.8125rem;
      color: #1976D2;
    }

    .info-card li {
      margin-bottom: 0.375rem;
    }

    .support-badge {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: #E8F5E9;
      border: 1px solid #4CAF50;
      border-radius: 0.75rem;
      margin-bottom: 1rem;
    }

    .badge-icon {
      font-size: 1.5rem;
    }

    .badge-text strong {
      color: #2E7D32;
      display: block;
      margin-bottom: 0.25rem;
    }

    .badge-text p {
      margin: 0;
      font-size: 0.75rem;
      color: #388E3C;
    }

    .warning-card {
      padding: 1rem;
      background: #FFF4D5;
      border: 1px solid #FFC107;
      border-radius: 0.75rem;
    }

    .warning-card p {
      margin: 0;
      font-size: 0.8125rem;
      color: #616161;
    }

    .navigation {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 1rem;
      background: white;
      border-top: 1px solid #EEEEEE;
      z-index: 10;
    }

    .navigation > * {
      flex: 1;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 1rem;
      padding: 2rem;
      width: 100%;
      max-width: 400px;
      text-align: center;
    }

    .success-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .modal-content h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #212121;
      margin: 0 0 0.5rem 0;
    }

    .modal-content p {
      color: #757575;
      font-size: 0.875rem;
      margin: 0 0 0.5rem 0;
    }

    .ref {
      font-family: 'JetBrains Mono', monospace;
      color: #FF9800;
      font-weight: 500;
      margin-bottom: 1.5rem !important;
    }

    .modal-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    @media (max-width: 640px) {
      .photos-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .navigation {
        flex-direction: column;
      }
    }
  `]
})
export class DisputeCreateComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly disputesService = inject(DisputesService);
  readonly store = inject(DisputesStore);
  private readonly logger = inject(LoggerService);

  readonly isSubmitting = signal(false);
  readonly showSuccess = signal(false);
  readonly createdDisputeId = signal<string | null>(null);

  readonly steps = [
    { label: 'Raison', icon: '❓' },
    { label: 'Détails', icon: '📝' },
    { label: 'Preuves', icon: '📷' },
    { label: 'Confirmer', icon: '✓' },
  ];

  ngOnInit(): void {
    const requestId = this.route.snapshot.queryParamMap.get('requestId');
    if (requestId) {
      this.store.initForm(requestId);
    }
  }

  getCurrentStepIndex(): number {
    const stepMap: Record<string, number> = {
      reason: 0,
      details: 1,
      evidence: 2,
      confirm: 3,
    };
    return stepMap[this.store.formState().step] || 0;
  }

  selectReason(reason: DisputeReason): void {
    this.store.setReason(reason);
  }

  updateDescription(description: string): void {
    this.store.setDescription(description);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.store.addPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removePhoto(index: number): void {
    this.store.removePhoto(index);
  }

  nextStep(): void {
    this.store.nextStep();
  }

  previousStep(): void {
    this.store.previousStep();
  }

  getSelectedReasonIcon(): string {
    const reason = this.store.formState().reason;
    const icons: Record<string, string> = {
      not_compliant: '⚠️',
      delay: '⏱️',
      price_issue: '💰',
    };
    return icons[reason || ''] || '❓';
  }

  getSelectedReasonLabel(): string {
    const reason = this.store.formState().reason;
    const labels: Record<string, string> = {
      not_compliant: 'Réparation non conforme',
      delay: 'Retard',
      price_issue: 'Prix non respecté',
    };
    return labels[reason || ''] || '';
  }

  async submit(): Promise<void> {
    const formState = this.store.formState();

    if (!formState.requestId || !formState.reason) {
      return;
    }

    this.isSubmitting.set(true);

    try {
      const dto: CreateDisputeDto = {
        requestId: formState.requestId,
        reason: formState.reason as DisputeReason,
        description: formState.description,
        evidencePhotos: formState.photos,
      };

      const dispute = await this.disputesService.createDispute(dto);
      this.createdDisputeId.set(dispute.id);
      this.showSuccess.set(true);
    } catch (err: any) {
      this.logger.error('DisputeCreateComponent', 'Failed to create dispute', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goToDispute(): void {
    const id = this.createdDisputeId();
    if (id) {
      this.router.navigate(['/disputes', id]);
    }
  }

  goToList(): void {
    this.router.navigate(['/disputes']);
  }

  goBack(): void {
    if (this.store.formState().step !== 'reason') {
      this.previousStep();
    } else {
      this.router.navigate(['/disputes']);
    }
  }
}

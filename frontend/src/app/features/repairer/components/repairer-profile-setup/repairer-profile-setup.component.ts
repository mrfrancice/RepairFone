import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RepairersService, RepairersStore, type UpdateRepairerSettingsDto } from '@app/domains/repairers';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiStepperComponent } from '../../../../shared/components/ui-stepper/ui-stepper.component';
import { UiSliderComponent } from '../../../../shared/components/ui-slider/ui-slider.component';
import { LoggerService } from '../../../../core/services/logger.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

@Component({
  selector: 'app-repairer-profile-setup',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    UiCardComponent,
    UiButtonComponent,
    UiStepperComponent,
    UiSliderComponent,
    UiHeaderComponent,
  ],
  template: `
    <div class="profile-setup">
      <ui-header
        title="Configuration du profil"
        subtitle="Configurez votre profil professionnel"
      />

      <!-- Stepper -->
      <ui-stepper
        [steps]="steps"
        [currentStep]="getCurrentStepIndex()"
        class="stepper"
      />

      <!-- Step 1: Type -->
      @if (store.profileForm().step === 'type') {
        <div class="step-content">
          <h2>Type d'activité</h2>
          <p class="step-description">Êtes-vous une boutique ou un réparateur indépendant ?</p>

          <div class="type-options">
            <div
              class="type-card"
              [class.selected]="store.profileForm().type === 'shop'"
              (click)="store.setProfileFormType('shop')"
            >
              <span class="type-icon">🏪</span>
              <span class="type-label">Boutique</span>
              <span class="type-desc">Vous avez un local commercial</span>
              <div class="check-indicator">✓</div>
            </div>

            <div
              class="type-card"
              [class.selected]="store.profileForm().type === 'independent'"
              (click)="store.setProfileFormType('independent')"
            >
              <span class="type-icon">🛠️</span>
              <span class="type-label">Indépendant</span>
              <span class="type-desc">Vous vous déplacez chez le client</span>
              <div class="check-indicator">✓</div>
            </div>
          </div>
        </div>
      }

      <!-- Step 2: Info -->
      @if (store.profileForm().step === 'info') {
        <div class="step-content">
          <h2>Informations</h2>
          <p class="step-description">Présentez-vous aux clients</p>

          <div class="form-group">
            <label>
              {{ store.profileForm().type === 'shop' ? 'Nom de la boutique' : 'Nom professionnel' }} *
            </label>
            <input
              type="text"
              [ngModel]="store.profileForm().businessName"
              (ngModelChange)="store.setProfileFormBusinessName($event)"
              placeholder="Ex: TechRepair Pro"
            />
          </div>

          <div class="form-group">
            <label>Description (optionnel)</label>
            <textarea
              [ngModel]="store.profileForm().description"
              (ngModelChange)="store.setProfileFormDescription($event)"
              placeholder="Décrivez votre expertise et votre expérience..."
              rows="4"
            ></textarea>
            <span class="hint">{{ store.profileForm().description.length }}/500 caractères</span>
          </div>
        </div>
      }

      <!-- Step 3: Specialties -->
      @if (store.profileForm().step === 'specialties') {
        <div class="step-content">
          <h2>Spécialités</h2>
          <p class="step-description">Sélectionnez vos domaines d'expertise</p>

          <div class="specialties-grid">
            @for (specialty of repairerService.availableSpecialties(); track specialty.id) {
              <div
                class="specialty-card"
                [class.selected]="store.profileForm().specialties.includes(specialty.id)"
                (click)="store.toggleProfileFormSpecialty(specialty.id)"
              >
                <span class="specialty-icon">{{ specialty.icon }}</span>
                <span class="specialty-label">{{ specialty.label }}</span>
                <div class="check-indicator">✓</div>
              </div>
            }
          </div>

          <p class="selection-count">
            {{ store.profileForm().specialties.length }} spécialité(s) sélectionnée(s)
          </p>
        </div>
      }

      <!-- Step 4: Area -->
      @if (store.profileForm().step === 'area') {
        <div class="step-content">
          <h2>Zone d'intervention</h2>
          <p class="step-description">Définissez votre zone de couverture</p>

          <div class="form-group">
            <label>Adresse</label>
            <input
              type="text"
              [ngModel]="store.profileForm().address"
              (ngModelChange)="store.setProfileFormAddress($event)"
              placeholder="Votre adresse ou quartier"
            />
          </div>

          <ui-card class="location-card">
            <div class="location-header">
              <span class="icon">📍</span>
              <span>Position actuelle</span>
              <ui-button variant="outline" size="sm" (onClick)="detectLocation()">
                {{ isDetectingLocation() ? 'Détection...' : 'Détecter' }}
              </ui-button>
            </div>

            @if (store.profileForm().serviceArea.latitude !== 0) {
              <p class="location-coords">
                {{ store.profileForm().serviceArea.latitude.toFixed(4) }},
                {{ store.profileForm().serviceArea.longitude.toFixed(4) }}
              </p>
            }
          </ui-card>

          <div class="radius-section">
            <label>Rayon d'intervention : {{ store.profileForm().serviceArea.radius }} km</label>
            <ui-slider
              [value]="store.profileForm().serviceArea.radius"
              [min]="1"
              [max]="50"
              [step]="1"
              (valueChange)="updateRadius($event)"
            />
            <div class="radius-labels">
              <span>1 km</span>
              <span>50 km</span>
            </div>
          </div>
        </div>
      }

      <!-- Step 5: Hours -->
      @if (store.profileForm().step === 'hours') {
        <div class="step-content">
          <h2>Horaires</h2>
          <p class="step-description">Définissez vos heures de travail (optionnel)</p>

          <div class="hours-list">
            @for (day of weekDays; track day.key) {
              <div class="day-row">
                <div class="day-header">
                  <label class="day-toggle">
                    <input
                      type="checkbox"
                      [checked]="!isDayClosed(day.key)"
                      (change)="toggleDay(day.key)"
                    />
                    <span class="day-name">{{ day.label }}</span>
                  </label>
                </div>

                @if (!isDayClosed(day.key)) {
                  <div class="day-hours">
                    <input
                      type="time"
                      [value]="getDayOpen(day.key)"
                      (change)="setDayOpen(day.key, $event)"
                    />
                    <span>à</span>
                    <input
                      type="time"
                      [value]="getDayClose(day.key)"
                      (change)="setDayClose(day.key, $event)"
                    />
                  </div>
                } @else {
                  <span class="closed-label">Fermé</span>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- Step 6: Photos -->
      @if (store.profileForm().step === 'photos') {
        <div class="step-content">
          <h2>Photos</h2>
          <p class="step-description">Ajoutez des photos de votre atelier/travail (optionnel)</p>

          <div class="photos-grid">
            @for (photo of store.profileForm().photos; track $index) {
              <div class="photo-item">
                <img [src]="photo" alt="Photo {{ $index + 1 }}" />
                <button class="remove-btn" (click)="store.removeProfileFormPhoto($index)">×</button>
              </div>
            }

            @if (store.profileForm().photos.length < 6) {
              <label class="add-photo-btn">
                <input
                  type="file"
                  accept="image/*"
                  (change)="onPhotoSelected($event)"
                  hidden
                />
                <span class="icon">📷</span>
                <span class="label">Ajouter</span>
              </label>
            }
          </div>

          <p class="photo-hint">Maximum 6 photos. Montrez votre atelier, vos outils, vos réalisations.</p>
        </div>
      }

      <!-- Step 7: KYC -->
      @if (store.profileForm().step === 'kyc') {
        <div class="step-content">
          <h2>Vérification</h2>
          <p class="step-description">Soumettez vos documents pour être vérifié</p>

          <ui-card class="kyc-info">
            <h4>📋 Pourquoi la vérification ?</h4>
            <ul>
              <li>Badge "Vérifié" visible par les clients</li>
              <li>Accès prioritaire aux demandes</li>
              <li>Plus de confiance = plus de clients</li>
            </ul>
          </ui-card>

          <div class="kyc-documents">
            <div class="kyc-item">
              <div class="kyc-header">
                <span class="kyc-icon">🪪</span>
                <div class="kyc-info">
                  <span class="kyc-label">Pièce d'identité</span>
                  <span class="kyc-desc">CNI, Passeport ou Permis</span>
                </div>
              </div>
              <label class="upload-btn">
                <input type="file" accept="image/*" (change)="uploadKyc('id_card', $event)" hidden />
                <span>{{ kycUploaded()['id_card'] ? '✅ Envoyé' : 'Télécharger' }}</span>
              </label>
            </div>

            @if (store.profileForm().type === 'shop') {
              <div class="kyc-item">
                <div class="kyc-header">
                  <span class="kyc-icon">📄</span>
                  <div class="kyc-info">
                    <span class="kyc-label">Registre de commerce</span>
                    <span class="kyc-desc">RCCM ou équivalent</span>
                  </div>
                </div>
                <label class="upload-btn">
                  <input type="file" accept="image/*" (change)="uploadKyc('business_license', $event)" hidden />
                  <span>{{ kycUploaded()['business_license'] ? '✅ Envoyé' : 'Télécharger' }}</span>
                </label>
              </div>
            }

            <div class="kyc-item">
              <div class="kyc-header">
                <span class="kyc-icon">🎓</span>
                <div class="kyc-info">
                  <span class="kyc-label">Certification (optionnel)</span>
                  <span class="kyc-desc">Diplôme ou attestation</span>
                </div>
              </div>
              <label class="upload-btn">
                <input type="file" accept="image/*" (change)="uploadKyc('certification', $event)" hidden />
                <span>{{ kycUploaded()['certification'] ? '✅ Envoyé' : 'Télécharger' }}</span>
              </label>
            </div>
          </div>

          <p class="kyc-note">
            Vous pouvez compléter la vérification plus tard depuis votre profil.
          </p>
        </div>
      }

      <!-- Navigation -->
      <div class="navigation">
        @if (store.profileForm().step !== 'type') {
          <ui-button variant="outline" (onClick)="store.previousProfileStep()">
            ← Précédent
          </ui-button>
        } @else {
          <div></div>
        }

        @if (store.profileForm().step === 'kyc') {
          <ui-button
            variant="primary"
            [loading]="isSubmitting()"
            (onClick)="submit()"
          >
            Terminer
          </ui-button>
        } @else {
          <ui-button
            variant="primary"
            [disabled]="!store.canProceedProfileSetup()"
            (onClick)="store.nextProfileStep()"
          >
            Suivant →
          </ui-button>
        }
      </div>

      <!-- Success Modal -->
      @if (showSuccess()) {
        <div class="modal-overlay">
          <div class="modal-content">
            <div class="success-icon">🎉</div>
            <h3>Profil créé !</h3>
            <p>Votre profil professionnel est prêt. Vous pouvez maintenant recevoir des demandes de réparation.</p>
            @if (!kycUploaded()['id_card']) {
              <p class="warning">N'oubliez pas de compléter la vérification pour obtenir le badge "Vérifié".</p>
            }
            <ui-button variant="primary" (onClick)="goToDashboard()">
              Aller au tableau de bord
            </ui-button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-setup {
      min-height: 100vh;
      background: #FAFAFA;
      padding-top: var(--header-height, 100px);
      padding-bottom: 6rem;
    }

    .stepper {
      padding: 1rem;
      background: white;
      overflow-x: auto;
    }

    .step-content {
      padding: 1.5rem 1rem;

      h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1F2937;
        margin: 0 0 0.25rem 0;
      }

      .step-description {
        color: #6B7280;
        font-size: 0.875rem;
        margin: 0 0 1.5rem 0;
      }
    }

    .type-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .type-card {
      position: relative;
      padding: 1.25rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #D1D5DB;
      }

      &.selected {
        border-color: var(--color-primary-500, #FF9800);
        background: #FFF3E0;

        .check-indicator {
          opacity: 1;
        }
      }

      .type-icon {
        font-size: 2rem;
        display: block;
        margin-bottom: 0.5rem;
      }

      .type-label {
        display: block;
        font-weight: 600;
        color: #1F2937;
        font-size: 1.125rem;
        margin-bottom: 0.25rem;
      }

      .type-desc {
        font-size: 0.875rem;
        color: #6B7280;
      }

      .check-indicator {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: var(--color-primary-500, #FF9800);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        opacity: 0;
        transition: opacity 0.2s;
      }
    }

    .form-group {
      margin-bottom: 1.5rem;

      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.5rem;
      }

      input[type="text"],
      textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 0.5rem;
        font-size: 0.9375rem;

        &:focus {
          outline: none;
          border-color: var(--color-primary-500, #FF9800);
          box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
        }
      }

      textarea {
        resize: vertical;
        min-height: 100px;
      }

      .hint {
        display: block;
        font-size: 0.75rem;
        color: #9CA3AF;
        margin-top: 0.25rem;
        text-align: right;
      }
    }

    .specialties-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .specialty-card {
      position: relative;
      padding: 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;

      &:hover {
        border-color: #D1D5DB;
      }

      &.selected {
        border-color: var(--color-primary-500, #FF9800);
        background: #FFF3E0;

        .check-indicator {
          opacity: 1;
        }
      }

      .specialty-icon {
        font-size: 1.5rem;
        display: block;
        margin-bottom: 0.25rem;
      }

      .specialty-label {
        font-size: 0.8125rem;
        font-weight: 500;
        color: #1F2937;
      }

      .check-indicator {
        position: absolute;
        top: 0.5rem;
        right: 0.5rem;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 50%;
        background: var(--color-primary-500, #FF9800);
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.625rem;
        opacity: 0;
        transition: opacity 0.2s;
      }
    }

    .selection-count {
      text-align: center;
      color: #6B7280;
      font-size: 0.875rem;
      margin-top: 1rem;
    }

    .location-card {
      padding: 1rem;
      margin-bottom: 1.5rem;

      .location-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .icon {
          font-size: 1.25rem;
        }

        span {
          flex: 1;
          font-weight: 500;
          color: #1F2937;
        }
      }

      .location-coords {
        margin: 0.75rem 0 0 0;
        font-size: 0.8125rem;
        color: #6B7280;
        font-family: monospace;
      }
    }

    .radius-section {
      label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
        margin-bottom: 0.75rem;
      }

      .radius-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: #9CA3AF;
        margin-top: 0.25rem;
      }
    }

    .hours-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .day-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background: white;
      border-radius: 0.5rem;
      border: 1px solid #e2e8f0;

      .day-header {
        .day-toggle {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;

          input[type="checkbox"] {
            width: 1.125rem;
            height: 1.125rem;
            accent-color: var(--color-primary-500, #FF9800);
          }

          .day-name {
            font-weight: 500;
            color: #1F2937;
          }
        }
      }

      .day-hours {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        input[type="time"] {
          padding: 0.375rem 0.5rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
        }

        span {
          color: #6B7280;
          font-size: 0.8125rem;
        }
      }

      .closed-label {
        font-size: 0.8125rem;
        color: #9CA3AF;
        font-style: italic;
      }
    }

    .photos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .photo-item {
      position: relative;
      aspect-ratio: 1;
      border-radius: 0.5rem;
      overflow: hidden;

      img {
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
      }
    }

    .add-photo-btn {
      aspect-ratio: 1;
      border: 2px dashed #D1D5DB;
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: var(--color-primary-500, #FF9800);
        background: #FFF3E0;
      }

      .icon {
        font-size: 1.5rem;
      }

      .label {
        font-size: 0.75rem;
        color: #6B7280;
      }
    }

    .photo-hint {
      font-size: 0.75rem;
      color: #9CA3AF;
      margin-top: 1rem;
      text-align: center;
    }

    .kyc-info {
      padding: 1rem;
      background: #E8F5E9;
      border: 1px solid #4CAF50;
      border-radius: 0.75rem;
      margin-bottom: 1.5rem;

      h4 {
        font-size: 0.9375rem;
        font-weight: 600;
        color: #2E7D32;
        margin: 0 0 0.5rem 0;
      }

      ul {
        margin: 0;
        padding-left: 1.25rem;
        font-size: 0.8125rem;
        color: #388E3C;

        li {
          margin-bottom: 0.25rem;
        }
      }
    }

    .kyc-documents {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .kyc-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;

      .kyc-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .kyc-icon {
        font-size: 1.5rem;
      }

      .kyc-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .kyc-label {
        font-weight: 500;
        color: #1F2937;
        font-size: 0.9375rem;
      }

      .kyc-desc {
        font-size: 0.75rem;
        color: #6B7280;
      }

      .upload-btn {
        padding: 0.5rem 1rem;
        background: var(--color-primary-500, #FF9800);
        color: white;
        border-radius: 0.5rem;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;

        &:hover {
          background: #F4511E;
        }
      }
    }

    .kyc-note {
      font-size: 0.8125rem;
      color: #6B7280;
      text-align: center;
      margin-top: 1.5rem;
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
      border-top: 1px solid #e2e8f0;
      z-index: 10;
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

      .success-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
      }

      h3 {
        font-size: 1.25rem;
        font-weight: 600;
        color: #1F2937;
        margin: 0 0 0.5rem 0;
      }

      p {
        color: #6B7280;
        font-size: 0.875rem;
        margin: 0 0 1rem 0;

        &.warning {
          color: var(--color-mustard, #FFC107);
          font-size: 0.8125rem;
        }
      }
    }
  `]
})
export class RepairerProfileSetupComponent implements OnInit {
  readonly repairerService = inject(RepairersService);
  readonly store = inject(RepairersStore);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  readonly isSubmitting = signal(false);
  readonly showSuccess = signal(false);
  readonly isDetectingLocation = signal(false);
  readonly kycUploaded = signal<Record<string, boolean>>({});

  readonly steps = [
    { label: 'Type', icon: '🏪' },
    { label: 'Infos', icon: '📝' },
    { label: 'Spécialités', icon: '🔧' },
    { label: 'Zone', icon: '📍' },
    { label: 'Horaires', icon: '🕐' },
    { label: 'Photos', icon: '📷' },
    { label: 'Vérification', icon: '✓' },
  ];

  readonly weekDays = [
    { key: 'monday', label: 'Lundi' },
    { key: 'tuesday', label: 'Mardi' },
    { key: 'wednesday', label: 'Mercredi' },
    { key: 'thursday', label: 'Jeudi' },
    { key: 'friday', label: 'Vendredi' },
    { key: 'saturday', label: 'Samedi' },
    { key: 'sunday', label: 'Dimanche' },
  ];

  ngOnInit(): void {
    this.store.initProfileForm();
  }

  getCurrentStepIndex(): number {
    const stepMap: Record<string, number> = {
      type: 0,
      info: 1,
      specialties: 2,
      area: 3,
      hours: 4,
      photos: 5,
      kyc: 6,
    };
    return stepMap[this.store.profileForm().step] || 0;
  }

  detectLocation(): void {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    this.isDetectingLocation.set(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.store.setProfileFormServiceArea({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radius: this.store.profileForm().serviceArea.radius,
        });
        this.isDetectingLocation.set(false);
      },
      (error) => {
        this.logger.error('RepairerProfileSetupComponent', 'Geolocation error', error);
        this.isDetectingLocation.set(false);
        alert('Impossible de détecter votre position');
      }
    );
  }

  updateRadius(value: number): void {
    this.store.setProfileFormServiceArea({
      ...this.store.profileForm().serviceArea,
      radius: value,
    });
  }

  isDayClosed(day: string): boolean {
    const hours = this.store.profileForm().workingHours as any;
    return hours[day]?.closed === true || !hours[day];
  }

  getDayOpen(day: string): string {
    const hours = this.store.profileForm().workingHours as any;
    return hours[day]?.open || '08:00';
  }

  getDayClose(day: string): string {
    const hours = this.store.profileForm().workingHours as any;
    return hours[day]?.close || '18:00';
  }

  toggleDay(day: string): void {
    const currentHours = { ...this.store.profileForm().workingHours } as any;

    if (currentHours[day]?.closed === false || currentHours[day]) {
      currentHours[day] = { closed: true };
    } else {
      currentHours[day] = { open: '08:00', close: '18:00', closed: false };
    }

    this.store.setProfileFormWorkingHours(currentHours);
  }

  setDayOpen(day: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const currentHours = { ...this.store.profileForm().workingHours } as any;
    currentHours[day] = { ...currentHours[day], open: value };
    this.store.setProfileFormWorkingHours(currentHours);
  }

  setDayClose(day: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    const currentHours = { ...this.store.profileForm().workingHours } as any;
    currentHours[day] = { ...currentHours[day], close: value };
    this.store.setProfileFormWorkingHours(currentHours);
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.store.profileForm().photos.length < 6) {
      const reader = new FileReader();
      reader.onload = () => {
        this.store.addProfileFormPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  uploadKyc(type: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file) {
      // In production, upload to server and get URL
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          await this.repairerService.uploadKycDocument(type as any, reader.result as string);
          this.kycUploaded.update(uploaded => ({ ...uploaded, [type]: true }));
        } catch (err) {
          this.logger.error('RepairerProfileSetupComponent', 'KYC upload failed', err);
        }
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  async submit(): Promise<void> {
    const form = this.store.profileForm();

    this.isSubmitting.set(true);

    try {
      const dto: UpdateRepairerSettingsDto = {
        type: form.type!,
        businessName: form.businessName,
        description: form.description || undefined,
        specialties: form.specialties,
        serviceArea: form.serviceArea,
        address: form.address || undefined,
        workingHours: Object.keys(form.workingHours).length > 0 ? form.workingHours : undefined,
        photos: form.photos.length > 0 ? form.photos : undefined,
      };

      const profile = await this.repairerService.updateProfile(dto);
      this.store.setProfile(profile);
      this.showSuccess.set(true);
    } catch (err: any) {
      this.logger.error('RepairerProfileSetupComponent', 'Profile update failed', err);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/repairer']);
  }
}

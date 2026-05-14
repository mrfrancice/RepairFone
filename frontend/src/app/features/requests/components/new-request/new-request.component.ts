import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RequestsService, type CreateRequestDto, type UrgencyLevel } from '@app/domains/requests';
import { SearchService, Repairer } from '../../../search/services/search.service';
import { DevicesService, type Device, type ServiceType } from '@app/domains/devices';
import { SearchStore } from '../../../search/stores/search.store';
import { UiImageUploadComponent, UploadedImage } from '../../../../shared/components/ui-image-upload/ui-image-upload.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiStepperComponent, StepConfig } from '../../../../shared/components/ui-stepper/ui-stepper.component';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { LoggerService } from '../../../../core/services/logger.service';
import { ToastService } from '../../../../core/services/toast.service';

interface DraftData {
  step: number;
  description: string;
  preferredDate: string;
  preferredTime: string;
  clientAddress: string;
  deliveryMode: 'in_shop' | 'at_home';
  urgency: UrgencyLevel;
  savedAt: string;
  queryParams?: {
    repairerId?: string;
    serviceId?: string;
    deviceId?: string;
  };
}

interface RequestStep {
  id: string;
  title: string;
  icon: string;
}

@Component({
  selector: 'app-new-request',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, UiImageUploadComponent, UiButtonComponent, UiStepperComponent, UiHeaderComponent, FormatDatePipe],
  template: `
    <div class="new-request-container">
      <!-- Header -->
      <ui-header
        title="Nouvelle demande"
        subtitle="Créez votre demande de réparation"
        [showBack]="true"
        [showProfile]="true"
        (onBack)="goBack()"
      />

      <!-- Stepper -->
      <div class="stepper-wrapper">
        <ui-stepper
          [steps]="stepTitles"
          [currentStep]="currentStep()"
          [completedSteps]="completedSteps()"
        />
      </div>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>
      } @else {
        <div class="request-content">
          @if (error()) {
            <div class="alert alert-error">
              <span class="alert-icon">⚠️</span>
              {{ error() }}
            </div>
          }

          <!-- Step 1: Description -->
          @if (currentStep() === 0) {
            <div class="step-content">
              <div class="step-header">
                <h2>Décrivez votre problème</h2>
                <p>Expliquez en détail le problème rencontré avec votre appareil</p>
              </div>

              <div class="form-group">
                <label for="description">Description <span class="required">*</span></label>
                <textarea
                  id="description"
                  [(ngModel)]="description"
                  (ngModelChange)="onFormChange()"
                  placeholder="Ex: Mon écran est fissuré depuis une chute, l'écran tactile ne répond plus sur la partie droite..."
                  rows="5"
                  maxlength="1000"
                  class="form-textarea"
                  [class.invalid]="descriptionTouched && description.length < 20"
                  (blur)="descriptionTouched = true"
                ></textarea>
                <div class="textarea-footer">
                  @if (descriptionTouched && description.length < 20) {
                    <span class="field-error">Minimum 20 caractères requis</span>
                  }
                  <span class="char-count" [class.warning]="description.length > 900">{{ description.length }}/1000</span>
                </div>
              </div>

              <div class="form-group">
                <label>Photos de l'appareil (optionnel)</label>
                <p class="field-hint">Ajoutez des photos pour aider le réparateur à comprendre le problème</p>
                <ui-image-upload
                  mode="gallery"
                  [maxFiles]="5"
                  [maxSizeMB]="5"
                  hint="Jusqu'à 5 photos (5 MB max chacune)"
                  (filesChange)="onImagesChange($event)"
                ></ui-image-upload>
              </div>
            </div>
          }

          <!-- Step 2: Preferences -->
          @if (currentStep() === 1) {
            <div class="step-content">
              <div class="step-header">
                <h2>Vos préférences</h2>
                <p>Choisissez le mode de livraison et vos disponibilités</p>
              </div>

              <!-- Delivery Mode -->
              <div class="form-group">
                <label>Mode de service <span class="required">*</span></label>
                <div class="option-cards">
                  <label class="option-card" [class.selected]="deliveryMode === 'in_shop'">
                    <input type="radio" name="deliveryMode" value="in_shop" [(ngModel)]="deliveryMode" (ngModelChange)="onFormChange()" />
                    <span class="option-icon">🏪</span>
                    <span class="option-title">En boutique</span>
                    <span class="option-desc">Je me déplace chez le réparateur</span>
                  </label>
                  <label class="option-card" [class.selected]="deliveryMode === 'at_home'">
                    <input type="radio" name="deliveryMode" value="at_home" [(ngModel)]="deliveryMode" (ngModelChange)="onFormChange()" />
                    <span class="option-icon">🏠</span>
                    <span class="option-title">À domicile</span>
                    <span class="option-desc">Le réparateur vient chez moi</span>
                    @if (deliveryMode === 'at_home') {
                      <span class="option-fee">+ Frais de déplacement</span>
                    }
                  </label>
                </div>
              </div>

              <!-- Address (if at_home) -->
              @if (deliveryMode === 'at_home') {
                <div class="form-group address-group" [@fadeIn]>
                  <label for="address">Adresse d'intervention <span class="required">*</span></label>
                  <div class="address-input-wrapper">
                    <input
                      type="text"
                      id="address"
                      [(ngModel)]="clientAddress"
                      (ngModelChange)="onFormChange()"
                      placeholder="Votre adresse complète"
                      class="form-input"
                      [class.invalid]="addressTouched && !clientAddress"
                      (blur)="addressTouched = true"
                    />
                    <button type="button" class="location-btn" (click)="useCurrentLocation()" [disabled]="isDetectingLocation()">
                      @if (isDetectingLocation()) {
                        <span class="spinner-small"></span>
                      } @else {
                        <span>📍</span>
                      }
                    </button>
                  </div>
                  @if (addressTouched && !clientAddress) {
                    <span class="field-error">L'adresse est requise pour une intervention à domicile</span>
                  }
                </div>
              }

              <!-- Date & Time -->
              <div class="form-row">
                <div class="form-group">
                  <label for="preferredDate">Date souhaitée</label>
                  <input
                    type="date"
                    id="preferredDate"
                    [(ngModel)]="preferredDate"
                    (ngModelChange)="onFormChange()"
                    [min]="minDate"
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label for="preferredTime">Créneau horaire</label>
                  <select id="preferredTime" [(ngModel)]="preferredTime" (ngModelChange)="onFormChange()" class="form-input">
                    <option value="">Flexible</option>
                    <option value="08:00-10:00">08h00 - 10h00</option>
                    <option value="10:00-12:00">10h00 - 12h00</option>
                    <option value="12:00-14:00">12h00 - 14h00</option>
                    <option value="14:00-16:00">14h00 - 16h00</option>
                    <option value="16:00-18:00">16h00 - 18h00</option>
                  </select>
                </div>
              </div>

              <!-- Urgency -->
              <div class="form-group">
                <label>Niveau d'urgence</label>
                <div class="urgency-options">
                  <label class="urgency-option" [class.selected]="urgency === 'normal'">
                    <input type="radio" name="urgency" value="normal" [(ngModel)]="urgency" (ngModelChange)="onFormChange()" />
                    <div class="urgency-content">
                      <span class="urgency-icon">🕐</span>
                      <div class="urgency-info">
                        <span class="urgency-title">Normal</span>
                        <span class="urgency-desc">Délai standard (2-5 jours)</span>
                      </div>
                      <span class="urgency-price">Prix de base</span>
                    </div>
                  </label>
                  <label class="urgency-option express" [class.selected]="urgency === 'express'">
                    <input type="radio" name="urgency" value="express" [(ngModel)]="urgency" (ngModelChange)="onFormChange()" />
                    <div class="urgency-content">
                      <span class="urgency-icon">⚡</span>
                      <div class="urgency-info">
                        <span class="urgency-title">Express</span>
                        <span class="urgency-desc">Prioritaire (24-48h)</span>
                      </div>
                      <span class="urgency-price express">+30%</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          }

          <!-- Step 3: Confirmation -->
          @if (currentStep() === 2) {
            <div class="step-content">
              <div class="step-header">
                <h2>Récapitulatif</h2>
                <p>Vérifiez les informations avant d'envoyer votre demande</p>
              </div>

              <!-- Summary Card -->
              <div class="summary-card">
                <!-- Device & Service -->
                <div class="summary-section">
                  <h3>🔧 Réparation</h3>
                  <div class="summary-row">
                    <span class="summary-label">Appareil</span>
                    <span class="summary-value">{{ device()?.brand }} {{ device()?.model }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Service</span>
                    <span class="summary-value">{{ serviceType()?.name }}</span>
                  </div>
                  @if (store.selectedProblem()) {
                    <div class="summary-row">
                      <span class="summary-label">Problème</span>
                      <span class="summary-value">{{ store.selectedProblem() }}</span>
                    </div>
                  }
                </div>

                <!-- Repairer -->
                <div class="summary-section">
                  <h3>👨‍🔧 Réparateur</h3>
                  <div class="repairer-summary">
                    <div class="repairer-avatar">
                      @if (repairer()?.avatarUrl) {
                        <img [src]="repairer()?.avatarUrl" alt="Avatar" />
                      } @else {
                        <span class="avatar-placeholder">{{ getRepairerInitials() }}</span>
                      }
                    </div>
                    <div class="repairer-info">
                      <span class="repairer-name">{{ getRepairerName() }}</span>
                      @if (repairer()?.repairerProfile?.rating) {
                        <span class="repairer-rating">
                          ⭐ {{ repairer()?.repairerProfile?.rating?.toFixed(1) }}
                          ({{ repairer()?.repairerProfile?.reviewCount }} avis)
                        </span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Mode & Schedule -->
                <div class="summary-section">
                  <h3>📅 Modalités</h3>
                  <div class="summary-row">
                    <span class="summary-label">Mode</span>
                    <span class="summary-value">
                      {{ deliveryMode === 'in_shop' ? '🏪 En boutique' : '🏠 À domicile' }}
                    </span>
                  </div>
                  @if (deliveryMode === 'at_home' && clientAddress) {
                    <div class="summary-row">
                      <span class="summary-label">Adresse</span>
                      <span class="summary-value address">{{ clientAddress }}</span>
                    </div>
                  }
                  @if (preferredDate) {
                    <div class="summary-row">
                      <span class="summary-label">Date souhaitée</span>
                      <span class="summary-value">{{ preferredDate | formatDate:'long' }}</span>
                    </div>
                  }
                  @if (preferredTime) {
                    <div class="summary-row">
                      <span class="summary-label">Créneau</span>
                      <span class="summary-value">{{ preferredTime }}</span>
                    </div>
                  }
                  <div class="summary-row">
                    <span class="summary-label">Urgence</span>
                    <span class="summary-value" [class.express]="urgency === 'express'">
                      {{ urgency === 'express' ? '⚡ Express' : '🕐 Normal' }}
                    </span>
                  </div>
                </div>

                <!-- Pricing -->
                <div class="summary-section pricing">
                  <h3>💰 Estimation</h3>
                  <div class="price-row">
                    <span>Prix de base</span>
                    <span>{{ serviceType()?.basePrice | number:'1.0-0' }} FCFA</span>
                  </div>
                  @if (urgency === 'express') {
                    <div class="price-row supplement">
                      <span>Supplément express (+30%)</span>
                      <span>+ {{ getExpressSupplement() | number:'1.0-0' }} FCFA</span>
                    </div>
                  }
                  @if (deliveryMode === 'at_home') {
                    <div class="price-row">
                      <span>Frais de déplacement</span>
                      <span class="tbd">À définir</span>
                    </div>
                  }
                  <div class="price-total">
                    <span>Total estimé</span>
                    <span class="total-amount">{{ getTotalEstimate() | number:'1.0-0' }} FCFA</span>
                  </div>
                  <p class="price-note">* Prix indicatif, un devis détaillé vous sera envoyé</p>
                </div>

                <!-- Photos -->
                @if (uploadedImages.length > 0) {
                  <div class="summary-section">
                    <h3>📷 Photos jointes</h3>
                    <div class="photos-preview">
                      @for (img of uploadedImages; track img.preview) {
                        <img [src]="img.preview" alt="Photo" />
                      }
                    </div>
                  </div>
                }

                <!-- Description Preview -->
                <div class="summary-section">
                  <h3>📝 Description</h3>
                  <p class="description-preview">{{ description }}</p>
                </div>
              </div>

              <!-- Terms -->
              <label class="terms-checkbox">
                <input type="checkbox" [(ngModel)]="acceptTerms" />
                <span>J'accepte les <a href="/cgu" target="_blank">conditions générales</a> et la politique de confidentialité</span>
              </label>
            </div>
          }

          <!-- Navigation Buttons -->
          <div class="step-navigation">
            @if (currentStep() > 0) {
              <ui-button variant="outline" (click)="previousStep()">
                ← Précédent
              </ui-button>
            } @else {
              <div></div>
            }

            @if (currentStep() < 2) {
              <ui-button variant="primary" (click)="nextStep()" [disabled]="!canProceed()">
                Suivant →
              </ui-button>
            } @else {
              <ui-button
                variant="primary"
                (click)="submit()"
                [disabled]="isSubmitting() || !acceptTerms"
                [loading]="isSubmitting()"
              >
                {{ isSubmitting() ? 'Envoi en cours...' : 'Envoyer la demande' }}
              </ui-button>
            }
          </div>
        </div>
      }

      <!-- Draft Resume Modal -->
      @if (showDraftDialog()) {
        <div class="modal-overlay" (click)="discardDraft()">
          <div class="modal-content draft-modal" (click)="$event.stopPropagation()">
            <div class="draft-icon">📝</div>
            <h2>Reprendre le brouillon ?</h2>
            <p>Vous avez un brouillon sauvegarde le {{ draftSavedAt() }}</p>
            <p class="draft-hint">Souhaitez-vous reprendre votre demande ou recommencer ?</p>
            <div class="modal-actions">
              <ui-button variant="outline" (click)="discardDraft()">
                Recommencer
              </ui-button>
              <ui-button variant="primary" (click)="loadDraft()">
                Reprendre le brouillon
              </ui-button>
            </div>
          </div>
        </div>
      }

      <!-- Success Modal -->
      @if (showSuccessModal()) {
        <div class="modal-overlay" (click)="closeSuccessModal()">
          <div class="modal-content success-modal" (click)="$event.stopPropagation()">
            <div class="success-icon">✅</div>
            <h2>Demande envoyee !</h2>
            <p>Pour suivre votre demande et securiser l'echange, entrez votre numero</p>
            <div class="success-info">
              <div class="info-item">
                <span class="info-icon">📱</span>
                <span>Notification par SMS</span>
              </div>
              <div class="info-item">
                <span class="info-icon">🔒</span>
                <span>Communication securisee</span>
              </div>
              <div class="info-item">
                <span class="info-icon">⏱️</span>
                <span>Reponse sous 24-48h</span>
              </div>
            </div>
            <div class="modal-actions">
              <ui-button variant="outline" (click)="goToRequests()">
                Voir mes demandes
              </ui-button>
              <ui-button variant="primary" (click)="goToTracking()">
                Suivre cette demande
              </ui-button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .new-request-container {
      min-height: 100vh;
      background: #FFF3E0;
    }

    .stepper-wrapper {
      background: white;
      padding: 1rem;
      padding-top: var(--header-height, 100px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #FFE5D9;
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-small {
      width: 18px;
      height: 18px;
      border: 3px solid #FFE5D9;
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .request-content {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      border-radius: 16px;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .alert-error {
      background: #FFF0F0;
      color: var(--color-terracotta, #C62828);
      border: 2px solid #FCA5A5;
    }

    .alert-icon {
      font-size: 1.25rem;
    }

    .step-content {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .step-header {
      margin-bottom: 1.5rem;
    }

    .step-header h2 {
      margin: 0 0 0.25rem;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .step-header p {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .required {
      color: var(--color-terracotta, #C62828);
    }

    .field-hint {
      color: #666;
      font-size: 0.875rem;
      margin: 0 0 0.5rem;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1.5px solid #e0e0e0;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.15);
    }

    .form-input.invalid,
    .form-textarea.invalid {
      border-color: var(--color-terracotta, #C62828);
      box-shadow: 0 0 0 4px rgba(198, 40, 40, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 120px;
    }

    .textarea-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.375rem;
    }

    .field-error {
      color: var(--color-terracotta, #C62828);
      font-size: 0.75rem;
    }

    .char-count {
      color: #999;
      font-size: 0.75rem;
      margin-left: auto;
    }

    .char-count.warning {
      color: var(--color-mustard, #FFC107);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .option-cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .option-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1.25rem;
      border: 2px solid #EEEEEE;
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
      position: relative;
    }

    .option-card:hover {
      border-color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.15);
    }

    .option-card.selected {
      border-color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.2);
    }

    .option-card input {
      position: absolute;
      opacity: 0;
    }

    .option-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .option-title {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .option-desc {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .option-fee {
      font-size: 0.75rem;
      color: var(--color-mustard, #FFC107);
      margin-top: 0.5rem;
      font-weight: 500;
    }

    .address-input-wrapper {
      display: flex;
      gap: 0.5rem;
    }

    .address-input-wrapper .form-input {
      flex: 1;
    }

    .location-btn {
      width: 48px;
      height: 48px;
      border: 1.5px solid #e0e0e0;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: all 0.2s;
    }

    .location-btn:hover:not(:disabled) {
      border-color: var(--color-primary-500, #FF9800);
      background: #E3F2FD;
    }

    .location-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .urgency-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .urgency-option {
      display: block;
      padding: 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .urgency-option:hover {
      border-color: var(--color-primary-500, #FF9800);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.1);
    }

    .urgency-option.selected {
      border-color: #4CAF50;
      background: #F1F8E9;
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
    }

    .urgency-option.express.selected {
      border-color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);
    }

    .urgency-option input {
      display: none;
    }

    .urgency-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .urgency-icon {
      font-size: 1.5rem;
    }

    .urgency-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .urgency-title {
      font-weight: 600;
      color: #1f2937;
    }

    .urgency-desc {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .urgency-price {
      font-weight: 600;
      color: #4CAF50;
      font-size: 0.875rem;
    }

    .urgency-price.express {
      color: var(--color-primary-500, #FF9800);
      font-weight: 700;
    }

    /* Summary Card */
    .summary-card {
      background: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid #FFE5D9;
    }

    .summary-section {
      padding: 1rem;
      border-bottom: 1px solid #EEEEEE;
    }

    .summary-section:last-child {
      border-bottom: none;
    }

    .summary-section h3 {
      margin: 0 0 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 0.375rem 0;
    }

    .summary-label {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .summary-value {
      font-weight: 500;
      color: #1f2937;
      font-size: 0.875rem;
      text-align: right;
    }

    .summary-value.address {
      max-width: 60%;
      word-break: break-word;
    }

    .summary-value.express {
      color: var(--color-terracotta, #C62828);
    }

    .repairer-summary {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .repairer-avatar {
      width: 48px;
      height: 48px;
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
      font-weight: 600;
    }

    .repairer-info {
      display: flex;
      flex-direction: column;
    }

    .repairer-name {
      font-weight: 600;
      color: #1f2937;
    }

    .repairer-rating {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .summary-section.pricing {
      background: linear-gradient(135deg, #FFF3E0 0%, #FFFFFF 100%);
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }

    .price-row.supplement {
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
    }

    .tbd {
      color: #F9A825;
      font-style: italic;
      font-weight: 500;
    }

    .price-total {
      display: flex;
      justify-content: space-between;
      padding-top: 0.75rem;
      margin-top: 0.5rem;
      border-top: 2px solid #FFE5D9;
      font-weight: 700;
    }

    .total-amount {
      color: var(--color-primary-500, #FF9800);
      font-size: 1.25rem;
    }

    .price-note {
      margin: 0.75rem 0 0;
      font-size: 0.75rem;
      color: #9ca3af;
      font-style: italic;
    }

    .photos-preview {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .photos-preview img {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      object-fit: cover;
    }

    .description-preview {
      margin: 0;
      font-size: 0.875rem;
      color: #4b5563;
      line-height: 1.5;
    }

    .terms-checkbox {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-top: 1rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .terms-checkbox input {
      margin-top: 2px;
    }

    .terms-checkbox a {
      color: var(--color-primary-500, #FF9800);
      font-weight: 500;
    }

    .step-navigation {
      display: flex;
      justify-content: space-between;
      padding-top: 1rem;
      gap: 1rem;
    }

    /* Success Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      padding: 2rem;
      max-width: 400px;
      width: 100%;
    }

    .success-modal {
      text-align: center;
    }

    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .success-modal h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
    }

    .success-modal p {
      margin: 0 0 1.5rem;
      color: #666;
    }

    .success-info {
      background: #FAFAFA;
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .success-info .info-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
    }

    .info-icon {
      font-size: 1.25rem;
    }

    .modal-actions {
      display: flex;
      gap: 0.75rem;
    }

    .modal-actions > * {
      flex: 1;
    }

    /* Draft Modal */
    .draft-modal {
      text-align: center;
    }

    .draft-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .draft-modal h2 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      color: #1f2937;
    }

    .draft-modal p {
      margin: 0 0 0.5rem;
      color: #666;
      font-size: 0.875rem;
    }

    .draft-hint {
      margin-bottom: 1.5rem !important;
      color: #9ca3af !important;
    }
  `],
})
export class NewRequestComponent implements OnInit {
  private readonly requestsService = inject(RequestsService);
  private readonly searchService = inject(SearchService);
  private readonly devicesService = inject(DevicesService);
  readonly store = inject(SearchStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly logger = inject(LoggerService);
  private readonly toast = inject(ToastService);

  // Draft auto-save
  private readonly DRAFT_KEY = 'repair_request_draft';
  private readonly DRAFT_MAX_AGE_HOURS = 24;
  private readonly saveSubject$ = new Subject<void>();
  readonly showDraftDialog = signal(false);
  readonly draftSavedAt = signal<string | null>(null);

  readonly device = signal<Device | null>(null);
  readonly serviceType = signal<ServiceType | null>(null);
  readonly repairer = signal<Repairer | null>(null);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  readonly isDetectingLocation = signal(false);
  readonly error = signal<string | null>(null);
  readonly currentStep = signal(0);
  readonly showSuccessModal = signal(false);
  private createdRequestId = '';

  readonly steps: RequestStep[] = [
    { id: 'description', title: 'Description', icon: '📝' },
    { id: 'preferences', title: 'Préférences', icon: '⚙️' },
    { id: 'confirm', title: 'Confirmation', icon: '✅' },
  ];

  readonly stepTitles: StepConfig[] = this.steps.map(s => ({ label: s.title, icon: s.icon }));

  readonly completedSteps = computed(() => {
    const completed: number[] = [];
    for (let i = 0; i < this.currentStep(); i++) {
      completed.push(i);
    }
    return completed;
  });

  // Form fields
  description = '';
  descriptionTouched = false;
  preferredDate = '';
  preferredTime = '';
  clientAddress = '';
  addressTouched = false;
  clientLatitude?: number;
  clientLongitude?: number;
  deliveryMode: 'in_shop' | 'at_home' = 'in_shop';
  urgency: UrgencyLevel = 'normal';
  uploadedImages: UploadedImage[] = [];
  acceptTerms = false;

  minDate = new Date().toISOString().split('T')[0];

  ngOnInit(): void {
    // Setup debounced auto-save (1 second delay)
    this.saveSubject$
      .pipe(
        debounceTime(1000),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => this.saveDraft());

    // Check for existing draft before loading data
    this.checkForDraft();
    this.loadData();
  }

  // ===== Draft Management Methods =====

  private checkForDraft(): void {
    const savedDraft = localStorage.getItem(this.DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft: DraftData = JSON.parse(savedDraft);
        const savedAt = new Date(draft.savedAt);
        const now = new Date();
        const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

        // Check if draft is less than 24 hours old
        if (hoursDiff < this.DRAFT_MAX_AGE_HOURS) {
          // Check if the draft matches current query params (same repairer/device/service)
          const params = this.route.snapshot.queryParams;
          const sameContext =
            draft.queryParams?.repairerId === params['repairerId'] &&
            draft.queryParams?.deviceId === params['deviceId'] &&
            draft.queryParams?.serviceId === params['serviceId'];

          if (sameContext && (draft.description || draft.clientAddress || draft.preferredDate)) {
            this.draftSavedAt.set(this.formatDraftDate(savedAt));
            this.showDraftDialog.set(true);
          }
        } else {
          // Draft is too old, clear it
          this.clearDraft();
        }
      } catch (e) {
        this.logger.error('NewRequestComponent', 'Error parsing draft', e);
        this.clearDraft();
      }
    }
  }

  private formatDraftDate(date: Date): string {
    return date.toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private saveDraft(): void {
    const params = this.route.snapshot.queryParams;
    const draft: DraftData = {
      step: this.currentStep(),
      description: this.description,
      preferredDate: this.preferredDate,
      preferredTime: this.preferredTime,
      clientAddress: this.clientAddress,
      deliveryMode: this.deliveryMode,
      urgency: this.urgency,
      savedAt: new Date().toISOString(),
      queryParams: {
        repairerId: params['repairerId'],
        deviceId: params['deviceId'],
        serviceId: params['serviceId']
      }
    };
    localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
  }

  loadDraft(): void {
    const savedDraft = localStorage.getItem(this.DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft: DraftData = JSON.parse(savedDraft);
        this.description = draft.description || '';
        this.preferredDate = draft.preferredDate || '';
        this.preferredTime = draft.preferredTime || '';
        this.clientAddress = draft.clientAddress || '';
        this.deliveryMode = draft.deliveryMode || 'in_shop';
        this.urgency = draft.urgency || 'normal';
        this.currentStep.set(draft.step || 0);
      } catch (e) {
        this.logger.error('NewRequestComponent', 'Error loading draft', e);
      }
    }
    this.showDraftDialog.set(false);
  }

  discardDraft(): void {
    this.clearDraft();
    this.showDraftDialog.set(false);
  }

  private clearDraft(): void {
    localStorage.removeItem(this.DRAFT_KEY);
  }

  // Trigger debounced save on form input changes
  onFormChange(): void {
    this.saveSubject$.next();
  }

  async loadData(): Promise<void> {
    const params = this.route.snapshot.queryParams;
    const repairerId = params['repairerId'];
    const serviceId = params['serviceId'];
    const deviceId = params['deviceId'];

    if (!repairerId) {
      this.toast.info(
        'Choisissez d\'abord un réparateur dans la liste pour créer votre demande.',
      );
      this.router.navigate(['/search']);
      return;
    }

    this.isLoading.set(true);

    try {
      const promises: Promise<any>[] = [
        this.searchService.getRepairer(repairerId),
      ];

      if (deviceId) {
        promises.push(this.devicesService.getDevice(deviceId));
      }

      const results = await Promise.all(promises);
      this.repairer.set(results[0]);

      if (deviceId && results[1]) {
        this.device.set(results[1]);
        // Load service types for this device
        const services = await this.devicesService.getServiceTypes(deviceId);
        if (serviceId) {
          const service = services.find((s) => s.id === serviceId);
          this.serviceType.set(service || services[0] || null);
        } else if (services.length > 0) {
          // Use the first service type if no specific one is selected
          this.serviceType.set(services[0]);
        }
      }

      // Use stored location and delivery mode
      const location = this.store.userLocation();
      if (location) {
        this.clientLatitude = location.latitude;
        this.clientLongitude = location.longitude;
      }

      const mode = this.store.serviceMode();
      this.deliveryMode = mode === 'home' ? 'at_home' : 'in_shop';
    } catch (err) {
      this.logger.error('NewRequestComponent', 'Error loading data', err);
      this.toast.error(
        'Impossible de charger les informations du réparateur. Réessayez depuis la liste.',
      );
      this.router.navigate(['/search']);
    } finally {
      this.isLoading.set(false);
    }
  }

  onImagesChange(images: UploadedImage[]): void {
    this.uploadedImages = images;
  }

  async useCurrentLocation(): Promise<void> {
    this.isDetectingLocation.set(true);
    try {
      const position = await this.searchService.getCurrentPosition();
      this.clientLatitude = position.coords.latitude;
      this.clientLongitude = position.coords.longitude;

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${this.clientLatitude}&lon=${this.clientLongitude}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'fr' } }
        );
        const data = await response.json();
        if (data.display_name) {
          this.clientAddress = data.display_name;
        } else {
          this.clientAddress = `${this.clientLatitude.toFixed(6)}, ${this.clientLongitude.toFixed(6)}`;
        }
      } catch {
        this.clientAddress = `${this.clientLatitude.toFixed(6)}, ${this.clientLongitude.toFixed(6)}`;
      }
    } catch (err) {
      this.logger.error('NewRequestComponent', 'Error getting location', err);
      this.error.set('Impossible de détecter votre position');
    } finally {
      this.isDetectingLocation.set(false);
    }
  }

  canProceed(): boolean {
    if (this.currentStep() === 0) {
      return this.description.length >= 20;
    }
    if (this.currentStep() === 1) {
      if (this.deliveryMode === 'at_home') {
        return !!this.clientAddress;
      }
      return true;
    }
    return true;
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep() < 2) {
      this.currentStep.update(s => s + 1);
      this.saveDraft(); // Save draft on step change
    }
  }

  previousStep(): void {
    if (this.currentStep() > 0) {
      this.currentStep.update(s => s - 1);
      this.saveDraft(); // Save draft on step change
    }
  }

  getRepairerName(): string {
    const r = this.repairer();
    if (!r) return '';
    if (r.repairerProfile?.businessName) return r.repairerProfile.businessName;
    return `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Réparateur';
  }

  getRepairerInitials(): string {
    const name = this.getRepairerName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getExpressSupplement(): number {
    const basePrice = this.serviceType()?.basePrice || 0;
    return Math.round(basePrice * 0.3);
  }

  getTotalEstimate(): number {
    const basePrice = this.serviceType()?.basePrice || 0;
    const supplement = this.urgency === 'express' ? this.getExpressSupplement() : 0;
    return basePrice + supplement;
  }

  async submit(): Promise<void> {
    if (!this.repairer() || !this.acceptTerms) {
      return;
    }

    if (this.deliveryMode === 'at_home' && !this.clientAddress) {
      this.error.set('L\'adresse est requise pour une intervention à domicile');
      return;
    }

    this.error.set(null);
    this.isSubmitting.set(true);

    try {
      const imageUrls: string[] = [];
      if (this.uploadedImages.length > 0) {
        for (const img of this.uploadedImages) {
          imageUrls.push(img.preview);
        }
      }

      const dto: CreateRequestDto = {
        repairerId: this.repairer()!.repairerProfile?.id || this.repairer()!.id,
        description: this.description,
        deliveryMode: this.deliveryMode,
        urgency: this.urgency,
      };

      // Ajouter deviceId et serviceTypeId seulement s'ils existent
      if (this.device()?.id) {
        dto.deviceId = this.device()!.id;
      }
      if (this.serviceType()?.id) {
        dto.serviceTypeId = this.serviceType()!.id;
      }

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (this.preferredDate && this.preferredDate.trim()) {
        // Convertir au format ISO 8601 complet (YYYY-MM-DDTHH:mm:ss.sssZ)
        dto.preferredDate = new Date(this.preferredDate).toISOString();
      }
      if (this.preferredTime && this.preferredTime.trim()) {
        dto.preferredTime = this.preferredTime;
      }
      if (this.deliveryMode === 'at_home') {
        if (this.clientAddress) dto.clientAddress = this.clientAddress;
        if (this.clientLatitude) dto.clientLatitude = this.clientLatitude;
        if (this.clientLongitude) dto.clientLongitude = this.clientLongitude;
      }
      if (imageUrls.length > 0) {
        dto.images = imageUrls;
      }

      const request = await this.requestsService.createRequest(dto);
      this.createdRequestId = request.id;
      this.clearDraft(); // Clear draft on successful submission
      this.showSuccessModal.set(true);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de l\'envoi de la demande');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
    this.goToRequests();
  }

  goToRequests(): void {
    this.router.navigate(['/requests']);
  }

  goToTracking(): void {
    this.router.navigate(['/tracking', this.createdRequestId]);
  }

  goBack(): void {
    if (this.currentStep() > 0) {
      this.previousStep();
    } else {
      window.history.back();
    }
  }
}

import { Component, inject, signal, computed, ViewChild, ElementRef, OnInit, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators, getErrorMessage } from '../../../../shared/validators/custom-validators';
import { LocationService, City, Commune, Quarter } from '../../../../core/services/location.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { GeolocationService } from '../../../../core/services/geolocation.service';
import { AppLogoComponent } from '../../../../shared/components/app-logo/app-logo.component';

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppLogoComponent],
  template: `
    <div class="auth-container">
      <div class="auth-card" [class.wide]="isRepairer() && currentStep() > 3">
        <div class="auth-logo">
          <app-logo size="md" variant="gradient" />
        </div>
        <h1 class="auth-title">Inscription</h1>
        <p class="auth-subtitle">
          @if (isRepairer() && currentStep() > 3) {
            Complétez votre profil réparateur
          } @else {
            Créez votre compte RepairFone
          }
        </p>

        @if (error()) {
          <div class="alert alert-error">
            <span class="alert-icon">!</span>
            {{ error() }}
          </div>
        }

        <!-- Progress Steps -->
        <div class="progress-steps" [class.extended]="isRepairer()">
          @for (step of visibleSteps(); track step.number) {
            <div class="step" [class.active]="currentStep() >= step.number" [class.completed]="currentStep() > step.number">
              <span class="step-number">{{ step.number }}</span>
              <span class="step-label">{{ step.label }}</span>
            </div>
            @if (!$last) {
              <div class="step-line" [class.active]="currentStep() > step.number"></div>
            }
          }
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <!-- Step 1: Identity -->
          @if (currentStep() === 1) {
            <div class="step-content">
              <div class="form-row">
                <div class="form-group">
                  <label for="firstName">Prénom <span class="required">*</span></label>
                  <input
                    type="text"
                    id="firstName"
                    formControlName="firstName"
                    placeholder="Votre prénom"
                    class="form-input"
                    [class.input-error]="isFieldInvalid('firstName')"
                  />
                  @if (isFieldInvalid('firstName')) {
                    <span class="field-error">{{ getFieldError('firstName') }}</span>
                  }
                </div>
                <div class="form-group">
                  <label for="lastName">Nom <span class="required">*</span></label>
                  <input
                    type="text"
                    id="lastName"
                    formControlName="lastName"
                    placeholder="Votre nom"
                    class="form-input"
                    [class.input-error]="isFieldInvalid('lastName')"
                  />
                  @if (isFieldInvalid('lastName')) {
                    <span class="field-error">{{ getFieldError('lastName') }}</span>
                  }
                </div>
              </div>

              <div class="form-group">
                <label for="phone">Numéro de téléphone <span class="required">*</span></label>
                <div class="input-wrapper">
                  <span class="country-code">+225</span>
                  <input
                    type="tel"
                    id="phone"
                    formControlName="phone"
                    placeholder="07 XX XX XX XX"
                    class="form-input with-prefix"
                    [class.input-error]="isFieldInvalid('phone')"
                    (input)="formatPhoneInput($event)"
                  />
                </div>
                @if (isFieldInvalid('phone')) {
                  <span class="field-error">{{ getFieldError('phone') }}</span>
                }
              </div>

              <button type="button" class="btn btn-primary btn-block" (click)="nextStep()">
                Continuer
              </button>
            </div>
          }

          <!-- Step 2: Security -->
          @if (currentStep() === 2) {
            <div class="step-content">
              <div class="form-group">
                <label for="password">Mot de passe <span class="required">*</span></label>
                <div class="input-wrapper">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    id="password"
                    formControlName="password"
                    placeholder="Min. 8 caractères"
                    class="form-input"
                    [class.input-error]="isFieldInvalid('password')"
                  />
                  <button type="button" class="toggle-password" (click)="togglePassword()" tabindex="-1">
                    {{ showPassword() ? 'Cacher' : 'Voir' }}
                  </button>
                </div>
                @if (isFieldInvalid('password')) {
                  <span class="field-error">{{ getFieldError('password') }}</span>
                }

                <div class="password-strength">
                  <div class="strength-bars">
                    @for (i of [1, 2, 3, 4]; track i) {
                      <div class="bar" [class.active]="passwordStrength() >= i" [class.weak]="passwordStrength() === 1" [class.medium]="passwordStrength() === 2" [class.strong]="passwordStrength() >= 3"></div>
                    }
                  </div>
                  <span class="strength-label">{{ getPasswordStrengthLabel() }}</span>
                </div>

                <div class="password-requirements">
                  <div class="requirement" [class.met]="hasMinLength()">
                    <span class="check">{{ hasMinLength() ? '✓' : '-' }}</span>
                    Minimum 8 caractères
                  </div>
                  <div class="requirement" [class.met]="hasUppercase()">
                    <span class="check">{{ hasUppercase() ? '✓' : '-' }}</span>
                    Une majuscule
                  </div>
                  <div class="requirement" [class.met]="hasLowercase()">
                    <span class="check">{{ hasLowercase() ? '✓' : '-' }}</span>
                    Une minuscule
                  </div>
                  <div class="requirement" [class.met]="hasNumber()">
                    <span class="check">{{ hasNumber() ? '✓' : '-' }}</span>
                    Un chiffre
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirmer le mot de passe <span class="required">*</span></label>
                <input
                  type="password"
                  id="confirmPassword"
                  formControlName="confirmPassword"
                  placeholder="Confirmez votre mot de passe"
                  class="form-input"
                  [class.input-error]="isFieldInvalid('confirmPassword') || passwordMismatch()"
                />
                @if (passwordMismatch()) {
                  <span class="field-error">Les mots de passe ne correspondent pas</span>
                }
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-outline" (click)="prevStep()">Retour</button>
                <button type="button" class="btn btn-primary" (click)="nextStep()">Continuer</button>
              </div>
            </div>
          }

          <!-- Step 3: Profile Type -->
          @if (currentStep() === 3) {
            <div class="step-content">
              <p class="step-description">Quel type de compte souhaitez-vous créer ?</p>

              <div class="profile-options">
                <label class="profile-option" [class.selected]="registerForm.get('role')?.value === 'client'">
                  <input type="radio" formControlName="role" value="client" />
                  <div class="option-content">
                    <div class="option-icon client-icon">C</div>
                    <div class="option-info">
                      <span class="option-title">Client</span>
                      <span class="option-desc">Je cherche un réparateur</span>
                    </div>
                    <span class="option-check">✓</span>
                  </div>
                </label>

                <label class="profile-option" [class.selected]="registerForm.get('role')?.value === 'repairer'">
                  <input type="radio" formControlName="role" value="repairer" />
                  <div class="option-content">
                    <div class="option-icon repairer-icon">R</div>
                    <div class="option-info">
                      <span class="option-title">Réparateur</span>
                      <span class="option-desc">Je propose mes services de réparation</span>
                    </div>
                    <span class="option-check">✓</span>
                  </div>
                </label>
              </div>

              @if (!isRepairer()) {
                <div class="form-group">
                  <label class="checkbox-label">
                    <input type="checkbox" formControlName="acceptTerms" />
                    <span class="checkbox-custom"></span>
                    J'accepte les <a routerLink="/terms" target="_blank">conditions d'utilisation</a>
                    et la <a routerLink="/privacy" target="_blank">politique de confidentialité</a>
                  </label>
                  @if (isFieldInvalid('acceptTerms')) {
                    <span class="field-error">Vous devez accepter les conditions</span>
                  }
                </div>
              }

              <div class="form-actions">
                <button type="button" class="btn btn-outline" (click)="prevStep()">Retour</button>
                @if (isRepairer()) {
                  <button type="button" class="btn btn-primary" (click)="nextStep()">
                    Continuer vers le profil
                  </button>
                } @else {
                  <button
                    type="submit"
                    class="btn btn-primary"
                    [disabled]="isLoading() || !registerForm.get('acceptTerms')?.value"
                  >
                    @if (isLoading()) {
                      <span class="spinner"></span>
                      Inscription...
                    } @else {
                      S'inscrire
                    }
                  </button>
                }
              </div>
            </div>
          }

          <!-- Step 4: Personal Identification (Repairer only) -->
          @if (currentStep() === 4 && isRepairer()) {
            <div class="step-content">
              <div class="step-header">
                <h2>Identification personnelle</h2>
                <p class="step-info">Ces informations sont requises pour vérifier votre identité et garantir la sécurité de la plateforme.</p>
              </div>

              <!-- Profile Photo Upload -->
              <div class="form-group">
                <label>Photo de profil <span class="required">*</span></label>
                <div class="photo-upload-section">
                  <div class="profile-photo-upload" [class.has-photo]="profilePhotoPreview()">
                    @if (profilePhotoPreview()) {
                      <img [src]="profilePhotoPreview()" alt="Photo de profil" class="profile-preview" />
                      <button type="button" class="photo-remove-btn" (click)="removeProfilePhoto()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                    } @else {
                      <div class="photo-placeholder" (click)="profilePhotoInput.click()">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                          <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          <circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <span>Ajouter une photo</span>
                      </div>
                    }
                    <input
                      #profilePhotoInput
                      type="file"
                      accept="image/*"
                      (change)="onProfilePhotoSelected($event)"
                      hidden
                    />
                  </div>
                  @if (!profilePhotoPreview()) {
                    <button type="button" class="btn btn-upload" (click)="profilePhotoInput.click()">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        <path d="M17 8L12 3L7 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M12 3V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                      Choisir une photo
                    </button>
                  }
                </div>
                <span class="field-hint">Photo claire de votre visage (format JPG, PNG - max 5MB)</span>
                @if (!profilePhotoPreview() && formSubmitted()) {
                  <span class="field-error">La photo de profil est requise</span>
                }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="dateOfBirth">Date de naissance <span class="required">*</span></label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    formControlName="dateOfBirth"
                    class="form-input"
                    [class.input-error]="isFieldInvalid('dateOfBirth')"
                    [max]="maxBirthDate"
                  />
                  @if (isFieldInvalid('dateOfBirth')) {
                    <span class="field-error">Date de naissance requise (18 ans minimum)</span>
                  }
                </div>
                <div class="form-group">
                  <label for="personalAddress">Adresse personnelle <span class="required">*</span></label>
                  <input
                    type="text"
                    id="personalAddress"
                    formControlName="personalAddress"
                    placeholder="Votre adresse de résidence"
                    class="form-input"
                    [class.input-error]="isFieldInvalid('personalAddress')"
                  />
                  @if (isFieldInvalid('personalAddress')) {
                    <span class="field-error">Adresse personnelle requise</span>
                  }
                </div>
              </div>

              <!-- ID Document Section -->
              <div class="form-group">
                <label>Type de pièce d'identité <span class="required">*</span></label>
                <div class="id-type-options">
                  <label class="id-type-option" [class.selected]="registerForm.get('idDocumentType')?.value === 'cni'">
                    <input type="radio" formControlName="idDocumentType" value="cni" />
                    <span class="id-type-icon">🪪</span>
                    <span>CNI</span>
                  </label>
                  <label class="id-type-option" [class.selected]="registerForm.get('idDocumentType')?.value === 'passport'">
                    <input type="radio" formControlName="idDocumentType" value="passport" />
                    <span class="id-type-icon">📘</span>
                    <span>Passeport</span>
                  </label>
                  <label class="id-type-option" [class.selected]="registerForm.get('idDocumentType')?.value === 'permit'">
                    <input type="radio" formControlName="idDocumentType" value="permit" />
                    <span class="id-type-icon">🚗</span>
                    <span>Permis</span>
                  </label>
                  <label class="id-type-option" [class.selected]="registerForm.get('idDocumentType')?.value === 'residence'">
                    <input type="radio" formControlName="idDocumentType" value="residence" />
                    <span class="id-type-icon">📄</span>
                    <span>Carte de séjour</span>
                  </label>
                </div>
              </div>

              <div class="form-group">
                <label for="nationalIdNumber">Numéro de la pièce <span class="required">*</span></label>
                <input
                  type="text"
                  id="nationalIdNumber"
                  formControlName="nationalIdNumber"
                  [placeholder]="getIdPlaceholder()"
                  class="form-input"
                  [class.input-error]="isFieldInvalid('nationalIdNumber')"
                />
                @if (isFieldInvalid('nationalIdNumber')) {
                  <span class="field-error">Numéro de pièce d'identité requis</span>
                }
              </div>

              <!-- ID Document Upload -->
              <div class="form-group">
                <label>Photo de la pièce d'identité <span class="required">*</span></label>
                <div class="document-upload-grid">
                  <!-- Front side -->
                  <div class="document-upload" [class.has-image]="idDocumentFrontPreview()">
                    @if (idDocumentFrontPreview()) {
                      <img [src]="idDocumentFrontPreview()" alt="Recto" class="document-preview" />
                      <button type="button" class="document-remove-btn" (click)="removeIdDocument('front')">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                      <span class="document-label">Recto</span>
                    } @else {
                      <div class="document-placeholder" (click)="idFrontInput.click()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                          <path d="M7 15L10 12L13 15L17 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                        </svg>
                        <span>Recto</span>
                      </div>
                    }
                    <input
                      #idFrontInput
                      type="file"
                      accept="image/*"
                      (change)="onIdDocumentSelected($event, 'front')"
                      hidden
                    />
                  </div>

                  <!-- Back side (optional for passport) -->
                  @if (registerForm.get('idDocumentType')?.value !== 'passport') {
                    <div class="document-upload" [class.has-image]="idDocumentBackPreview()">
                      @if (idDocumentBackPreview()) {
                        <img [src]="idDocumentBackPreview()" alt="Verso" class="document-preview" />
                        <button type="button" class="document-remove-btn" (click)="removeIdDocument('back')">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </button>
                        <span class="document-label">Verso</span>
                      } @else {
                        <div class="document-placeholder" (click)="idBackInput.click()">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M7 15L10 12L13 15L17 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                          </svg>
                          <span>Verso</span>
                        </div>
                      }
                      <input
                        #idBackInput
                        type="file"
                        accept="image/*"
                        (change)="onIdDocumentSelected($event, 'back')"
                        hidden
                      />
                    </div>
                  }
                </div>
                <span class="field-hint">Photos claires et lisibles de votre pièce d'identité (format JPG, PNG - max 5MB)</span>
                @if (!idDocumentFrontPreview() && formSubmitted()) {
                  <span class="field-error">La photo de votre pièce d'identité est requise</span>
                }
              </div>

              <div class="info-box">
                <span class="info-icon">🔒</span>
                <p>Vos documents sont protégés et ne seront utilisés que pour la vérification de votre identité. Ils seront supprimés après validation.</p>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-outline" (click)="prevStep()">Retour</button>
                <button type="button" class="btn btn-primary" (click)="nextStep()">Continuer</button>
              </div>
            </div>
          }

          <!-- Step 5: Business Information (Repairer only) -->
          @if (currentStep() === 5 && isRepairer()) {
            <div class="step-content">
              <div class="step-header">
                <h2>Informations commerciales</h2>
                <p class="step-info">Renseignez les informations de votre activité de réparation.</p>
              </div>

              <div class="form-group">
                <label for="businessName">Nom de la boutique/entreprise <span class="required">*</span></label>
                <input
                  type="text"
                  id="businessName"
                  formControlName="businessName"
                  placeholder="Ex: TechRepair Pro, Mobile Expert..."
                  class="form-input"
                  [class.input-error]="isFieldInvalid('businessName')"
                />
                @if (isFieldInvalid('businessName')) {
                  <span class="field-error">Nom de boutique requis</span>
                }
              </div>

              <div class="form-group">
                <label>Type d'activité <span class="required">*</span></label>
                <div class="radio-options">
                  <label class="radio-option" [class.selected]="registerForm.get('businessType')?.value === 'individual'">
                    <input type="radio" formControlName="businessType" value="individual" />
                    <span class="radio-box"></span>
                    <span>Artisan individuel</span>
                  </label>
                  <label class="radio-option" [class.selected]="registerForm.get('businessType')?.value === 'auto_entrepreneur'">
                    <input type="radio" formControlName="businessType" value="auto_entrepreneur" />
                    <span class="radio-box"></span>
                    <span>Auto-entrepreneur</span>
                  </label>
                  <label class="radio-option" [class.selected]="registerForm.get('businessType')?.value === 'company'">
                    <input type="radio" formControlName="businessType" value="company" />
                    <span class="radio-box"></span>
                    <span>Entreprise (SARL, SA...)</span>
                  </label>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="rccmNumber">N° RCCM <span class="optional">(optionnel)</span></label>
                  <input
                    type="text"
                    id="rccmNumber"
                    formControlName="rccmNumber"
                    placeholder="CI-ABJ-XXXX-X-XXXXX"
                    class="form-input"
                  />
                  <span class="field-hint">Registre du Commerce et du Crédit Mobilier</span>
                </div>
                <div class="form-group">
                  <label for="taxId">N° Compte contribuable <span class="optional">(optionnel)</span></label>
                  <input
                    type="text"
                    id="taxId"
                    formControlName="taxId"
                    placeholder="XXXXXXXXXX"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="businessPhone">Téléphone boutique</label>
                  <div class="input-wrapper">
                    <span class="country-code">+225</span>
                    <input
                      type="tel"
                      id="businessPhone"
                      formControlName="businessPhone"
                      placeholder="07 XX XX XX XX"
                      class="form-input with-prefix"
                    />
                  </div>
                </div>
                <div class="form-group">
                  <label for="businessEmail">Email professionnel</label>
                  <input
                    type="email"
                    id="businessEmail"
                    formControlName="businessEmail"
                    placeholder="contact@maboutique.ci"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="yearsOfExperience">Années d'expérience <span class="required">*</span></label>
                <select id="yearsOfExperience" formControlName="yearsOfExperience" class="form-input">
                  <option value="">Sélectionnez</option>
                  <option value="1">Moins d'1 an</option>
                  <option value="2">1-2 ans</option>
                  <option value="3">3-5 ans</option>
                  <option value="7">5-10 ans</option>
                  <option value="10">Plus de 10 ans</option>
                </select>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-outline" (click)="prevStep()">Retour</button>
                <button type="button" class="btn btn-primary" (click)="nextStep()">Continuer</button>
              </div>
            </div>
          }

          <!-- Step 6: Shop Location (Repairer only) -->
          @if (currentStep() === 6 && isRepairer()) {
            <div class="step-content">
              <div class="step-header">
                <h2>Localisation de votre boutique</h2>
                <p class="step-info">Permettez aux clients de vous trouver facilement.</p>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="city">Ville <span class="required">*</span></label>
                  <select id="city" formControlName="city" class="form-input" [class.loading]="locationDataLoading()">
                    @if (locationDataLoading()) {
                      <option value="">Chargement...</option>
                    } @else if (cities().length === 0) {
                      <option value="">Aucune ville disponible</option>
                    } @else {
                      @for (city of cities(); track city.id) {
                        <option [value]="city.name">{{ city.name }}</option>
                      }
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label for="commune">Commune <span class="required">*</span></label>
                  <select id="commune" formControlName="commune" class="form-input" [class.input-error]="isFieldInvalid('commune')">
                    <option value="">Sélectionnez une commune</option>
                    @for (commune of communes(); track commune.id) {
                      <option [value]="commune.name">{{ commune.name }}</option>
                    }
                  </select>
                  @if (isFieldInvalid('commune')) {
                    <span class="field-error">Commune requise</span>
                  }
                </div>
              </div>

              <div class="form-group">
                <label for="quarter">Quartier <span class="required">*</span></label>
                <select id="quarter" formControlName="quarter" class="form-input" [class.input-error]="isFieldInvalid('quarter')">
                  @if (quarters().length === 0) {
                    <option value="">Sélectionnez d'abord une commune</option>
                  } @else {
                    <option value="">Sélectionnez un quartier</option>
                    @for (quarter of quarters(); track quarter.id) {
                      <option [value]="quarter.name">{{ quarter.name }}</option>
                    }
                  }
                </select>
                @if (isFieldInvalid('quarter')) {
                  <span class="field-error">Quartier requis</span>
                }
              </div>

              <div class="form-group">
                <label for="address">Adresse précise <span class="required">*</span></label>
                <textarea
                  id="address"
                  formControlName="address"
                  placeholder="Rue, numéro, bâtiment..."
                  class="form-input form-textarea"
                  rows="2"
                  [class.input-error]="isFieldInvalid('address')"
                ></textarea>
                @if (isFieldInvalid('address')) {
                  <span class="field-error">Adresse requise</span>
                }
              </div>

              <div class="form-group">
                <label for="landmark">Point de repère</label>
                <input
                  type="text"
                  id="landmark"
                  formControlName="landmark"
                  placeholder="Ex: À côté de la pharmacie, en face du marché..."
                  class="form-input"
                />
                <span class="field-hint">Aide les clients à vous trouver plus facilement</span>
              </div>

              <!-- GPS Location -->
              <div class="location-section">
                <label>Position GPS <span class="required">*</span></label>
                <div class="location-box" [class.has-location]="hasLocation()">
                  @if (hasLocation()) {
                    <div class="location-info">
                      <span class="location-icon">📍</span>
                      <div class="location-coords">
                        <span>Lat: {{ registerForm.get('latitude')?.value | number:'1.6-6' }}</span>
                        <span>Lng: {{ registerForm.get('longitude')?.value | number:'1.6-6' }}</span>
                      </div>
                      <button type="button" class="btn btn-text" (click)="clearLocation()">Modifier</button>
                    </div>
                  } @else {
                    <button type="button" class="btn btn-location" (click)="getCurrentLocation()" [disabled]="isGettingLocation()">
                      @if (isGettingLocation()) {
                        <span class="spinner-small"></span>
                        Localisation en cours...
                      } @else {
                        <span class="location-icon">📍</span>
                        Utiliser ma position actuelle
                      }
                    </button>
                    <p class="location-hint">Placez-vous à l'emplacement de votre boutique</p>
                  }
                </div>
                @if (locationError()) {
                  <span class="field-error">{{ locationError() }}</span>
                }
              </div>

              <!-- Shop Photos Upload -->
              <div class="form-group">
                <label>Photos de votre boutique <span class="required">*</span></label>
                <p class="field-hint">Ajoutez jusqu'à 3 photos de votre boutique (extérieur, intérieur, espace de travail)</p>
                <div class="shop-photos-grid">
                  @for (i of [0, 1, 2]; track i) {
                    <div class="shop-photo-upload" [class.has-image]="shopPhotoPreviews()[i]">
                      @if (shopPhotoPreviews()[i]) {
                        <img [src]="shopPhotoPreviews()[i]" alt="Photo boutique {{ i + 1 }}" class="shop-photo-preview" />
                        <button type="button" class="shop-photo-remove-btn" (click)="removeShopPhoto(i)">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </button>
                        <span class="shop-photo-label">Photo {{ i + 1 }}</span>
                      } @else {
                        <div class="shop-photo-placeholder" (click)="triggerShopPhotoInput(i)">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            <path d="M12 8V16M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                          <span>
                            @switch (i) {
                              @case (0) { Extérieur }
                              @case (1) { Intérieur }
                              @case (2) { Atelier }
                            }
                          </span>
                        </div>
                      }
                    </div>
                  }
                  <input
                    #shopPhotoInput
                    type="file"
                    accept="image/*"
                    (change)="onShopPhotoSelected($event)"
                    hidden
                  />
                </div>
                @if (hasNoShopPhotos() && formSubmitted()) {
                  <span class="field-error">Au moins une photo de votre boutique est requise</span>
                }
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-outline" (click)="prevStep()">Retour</button>
                <button type="button" class="btn btn-primary" (click)="nextStep()">Continuer</button>
              </div>
            </div>
          }

          <!-- Step 7: Shop Details & Services (Repairer only) -->
          @if (currentStep() === 7 && isRepairer()) {
            <div class="step-content">
              <div class="step-header">
                <h2>Spécialités et services</h2>
                <p class="step-info">Définissez vos compétences et vos modes de service.</p>
              </div>

              <div class="form-group">
                <label>Spécialités <span class="required">*</span></label>
                <p class="field-hint">Sélectionnez les appareils et types de réparation que vous proposez</p>
                <div class="specialty-grid">
                  @for (specialty of deviceSpecialties(); track specialty) {
                    <label class="specialty-chip" [class.selected]="isSpecialtySelected(specialty)">
                      <input
                        type="checkbox"
                        [checked]="isSpecialtySelected(specialty)"
                        (change)="toggleSpecialty(specialty)"
                      />
                      <span>{{ specialty }}</span>
                    </label>
                  }
                </div>
                @if (selectedSpecialties().length === 0 && formSubmitted()) {
                  <span class="field-error">Sélectionnez au moins une spécialité</span>
                }
              </div>

              <div class="form-group">
                <label for="description">Description de vos services</label>
                <textarea
                  id="description"
                  formControlName="description"
                  placeholder="Décrivez votre expertise, vos services, ce qui vous distingue des autres réparateurs..."
                  class="form-input form-textarea"
                  rows="3"
                ></textarea>
                <span class="field-hint">Une bonne description augmente vos chances d'être contacté</span>
              </div>

              <div class="form-group">
                <label class="toggle-label">
                  <span class="toggle-text">
                    <strong>Service à domicile</strong>
                    <span>Proposez des réparations chez le client</span>
                  </span>
                  <div class="toggle-switch">
                    <input type="checkbox" formControlName="acceptsHomeService" />
                    <span class="toggle-slider"></span>
                  </div>
                </label>
              </div>

              @if (registerForm.get('acceptsHomeService')?.value) {
                <div class="form-group indented">
                  <label for="homeServiceRadiusKm">Rayon d'intervention</label>
                  <div class="radius-input">
                    <input
                      type="range"
                      id="homeServiceRadiusKm"
                      formControlName="homeServiceRadiusKm"
                      min="1"
                      max="30"
                      class="range-input"
                    />
                    <span class="radius-value">{{ registerForm.get('homeServiceRadiusKm')?.value || 10 }} km</span>
                  </div>
                </div>
              }

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" formControlName="acceptTerms" />
                  <span class="checkbox-custom"></span>
                  J'accepte les <a routerLink="/terms" target="_blank">conditions d'utilisation</a>,
                  la <a routerLink="/privacy" target="_blank">politique de confidentialité</a>
                  et la <a routerLink="/repairer-terms" target="_blank">charte des réparateurs</a>
                </label>
                @if (isFieldInvalid('acceptTerms')) {
                  <span class="field-error">Vous devez accepter les conditions</span>
                }
              </div>

              <div class="info-box success">
                <span class="info-icon">✓</span>
                <p>Après inscription, votre profil sera examiné par notre équipe (24-48h) avant activation.</p>
              </div>

              <div class="form-actions">
                <button type="button" class="btn btn-outline" (click)="prevStep()">Retour</button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="isLoading() || !registerForm.get('acceptTerms')?.value"
                >
                  @if (isLoading()) {
                    <span class="spinner"></span>
                    Inscription...
                  } @else {
                    Créer mon compte réparateur
                  }
                </button>
              </div>
            </div>
          }
        </form>

        <p class="auth-footer">
          Déjà un compte ?
          <a routerLink="/auth/login">Connectez-vous</a>
        </p>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      padding-bottom: calc(1rem + var(--bottom-nav-height, 80px) + var(--safe-area-bottom, 0px));
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-gold-800, #F9A825) 100%);
    }

    .auth-card {
      background: white;
      border-radius: 20px;
      padding: 2rem 1.5rem;
      width: 100%;
      max-width: 500px;
      box-shadow: 0 20px 60px rgba(255, 152, 0, 0.2);
      transition: max-width 0.3s ease;
    }

    .auth-card.wide {
      max-width: 600px;
    }

    .auth-logo {
      text-align: center;
      margin-bottom: 1rem;
    }

    .logo-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      border-radius: 12px;
      font-size: 1.5rem;
      color: white;
      box-shadow: 0 6px 16px rgba(255, 152, 0, 0.3);
    }

    .auth-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.25rem;
      text-align: center;
    }

    .auth-subtitle {
      color: #6b7280;
      text-align: center;
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }

    /* Progress Steps */
    .progress-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 0.25rem;
    }

    .progress-steps.extended {
      gap: 0.125rem;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
    }

    .step-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #EEEEEE;
      color: #6b7280;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.75rem;
      transition: all 0.3s;
    }

    .step.active .step-number {
      background: var(--color-primary-500, #FF9800);
      color: white;
    }

    .step.completed .step-number {
      background: #4CAF50;
      color: white;
    }

    .step-label {
      font-size: 0.625rem;
      color: #9ca3af;
      white-space: nowrap;
    }

    .step.active .step-label {
      color: var(--color-primary-500, #FF9800);
      font-weight: 500;
    }

    .step-line {
      width: 30px;
      height: 2px;
      background: #EEEEEE;
      margin: 0 0.25rem;
      margin-bottom: 1rem;
      transition: background 0.3s;
    }

    .step-line.active {
      background: #4CAF50;
    }

    /* Step Header */
    .step-header {
      margin-bottom: 1.5rem;
    }

    .step-header h2 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .step-info {
      font-size: 0.875rem;
      color: #6b7280;
    }

    /* Form Styles */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group.indented {
      margin-left: 1rem;
      padding-left: 1rem;
      border-left: 3px solid var(--color-primary-500, #FF9800);
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .required {
      color: var(--color-terracotta, #C62828);
    }

    .optional {
      color: #9ca3af;
      font-weight: 400;
      font-size: 0.75rem;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .country-code {
      position: absolute;
      left: 1rem;
      color: #6b7280;
      font-weight: 500;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.2s;
      background: #FAFAFA;
    }

    .form-input.with-prefix {
      padding-left: 3.5rem;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      background: white;
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
    }

    .form-input.input-error {
      border-color: var(--color-terracotta, #C62828);
      background: #FFEBEE;
    }

    .form-textarea {
      resize: vertical;
      min-height: 60px;
    }

    select.form-input {
      cursor: pointer;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1.25rem;
      padding-right: 2.5rem;
    }

    .toggle-password {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      color: #6b7280;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .field-error {
      display: block;
      color: var(--color-terracotta, #C62828);
      font-size: 0.75rem;
      margin-top: 0.375rem;
    }

    .field-hint {
      display: block;
      color: #9ca3af;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    /* Password Strength */
    .password-strength {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .strength-bars {
      display: flex;
      gap: 4px;
      flex: 1;
    }

    .bar {
      height: 4px;
      flex: 1;
      background: #EEEEEE;
      border-radius: 2px;
      transition: all 0.3s;
    }

    .bar.active.weak { background: var(--color-terracotta, #C62828); }
    .bar.active.medium { background: #FF9800; }
    .bar.active.strong { background: #4CAF50; }

    .strength-label {
      font-size: 0.75rem;
      color: #6b7280;
      min-width: 50px;
    }

    .password-requirements {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }

    .requirement {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .requirement.met {
      color: #4CAF50;
    }

    .requirement .check {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #EEEEEE;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.6rem;
    }

    .requirement.met .check {
      background: #4CAF50;
      color: white;
    }

    /* Profile Options */
    .step-description {
      text-align: center;
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .profile-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .profile-option {
      cursor: pointer;
    }

    .profile-option input {
      position: absolute;
      opacity: 0;
    }

    .option-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      transition: all 0.2s;
    }

    .profile-option.selected .option-content {
      border-color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
    }

    .option-icon {
      width: 48px;
      height: 48px;
      background: #F5F5F5;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .option-icon.client-icon {
      color: var(--color-primary-500, #FF9800);
    }

    .option-icon.repairer-icon {
      color: var(--color-primary-500, #FF9800);
    }

    .profile-option.selected .option-icon {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      color: white;
    }

    .option-info {
      flex: 1;
    }

    .option-title {
      display: block;
      font-weight: 600;
      color: #1f2937;
    }

    .option-desc {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .option-check {
      width: 24px;
      height: 24px;
      border: 2px solid #EEEEEE;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      opacity: 0;
      transition: all 0.2s;
    }

    .profile-option.selected .option-check {
      opacity: 1;
      background: #4CAF50;
      border-color: #4CAF50;
      color: white;
    }

    /* Radio Options */
    .radio-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .radio-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .radio-option:hover {
      border-color: var(--color-primary-500, #FF9800);
    }

    .radio-option.selected {
      border-color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
    }

    .radio-option input {
      display: none;
    }

    .radio-box {
      width: 20px;
      height: 20px;
      border: 2px solid #D1D5DB;
      border-radius: 50%;
      position: relative;
      transition: all 0.2s;
    }

    .radio-option.selected .radio-box {
      border-color: var(--color-primary-500, #FF9800);
    }

    .radio-option.selected .radio-box::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      background: var(--color-primary-500, #FF9800);
      border-radius: 50%;
    }

    /* Specialty Grid */
    .specialty-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .specialty-chip {
      display: flex;
      align-items: center;
      padding: 0.5rem 0.875rem;
      background: #F5F5F5;
      border: 2px solid #EEEEEE;
      border-radius: 20px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .specialty-chip input {
      display: none;
    }

    .specialty-chip:hover {
      border-color: var(--color-primary-500, #FF9800);
    }

    .specialty-chip.selected {
      background: #FFF3E0;
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
      font-weight: 500;
    }

    /* Toggle Switch */
    .toggle-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: #FAFAFA;
      border-radius: 12px;
      cursor: pointer;
    }

    .toggle-text {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .toggle-text strong {
      color: #1f2937;
    }

    .toggle-text span {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .toggle-switch {
      position: relative;
      width: 48px;
      height: 26px;
    }

    .toggle-switch input {
      display: none;
    }

    .toggle-slider {
      position: absolute;
      inset: 0;
      background: #D1D5DB;
      border-radius: 13px;
      transition: all 0.3s;
    }

    .toggle-slider::before {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: all 0.3s;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .toggle-switch input:checked + .toggle-slider {
      background: #4CAF50;
    }

    .toggle-switch input:checked + .toggle-slider::before {
      transform: translateX(22px);
    }

    /* Radius Input */
    .radius-input {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .range-input {
      flex: 1;
      height: 6px;
      background: #EEEEEE;
      border-radius: 3px;
      appearance: none;
      outline: none;
    }

    .range-input::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      background: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      cursor: pointer;
    }

    .radius-value {
      min-width: 50px;
      font-weight: 600;
      color: var(--color-primary-500, #FF9800);
    }

    /* Location Section */
    .location-section {
      margin-bottom: 1.25rem;
    }

    .location-section > label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .location-box {
      border: 2px dashed #EEEEEE;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.2s;
    }

    .location-box.has-location {
      border-style: solid;
      border-color: #4CAF50;
      background: #E8F5E9;
    }

    .location-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }

    .location-icon {
      font-size: 1.5rem;
    }

    .location-coords {
      display: flex;
      flex-direction: column;
      text-align: left;
      font-size: 0.875rem;
      color: #374151;
    }

    .btn-location {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: #F5F5F5;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-location:hover:not(:disabled) {
      border-color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
    }

    .btn-location:disabled {
      opacity: 0.7;
      cursor: wait;
    }

    .location-hint {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #6b7280;
    }

    /* Checkbox */
    .checkbox-label {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      font-size: 0.875rem;
      color: #4b5563;
      position: relative;
      padding-left: 2rem;
    }

    .checkbox-label input {
      position: absolute;
      opacity: 0;
    }

    .checkbox-custom {
      position: absolute;
      left: 0;
      top: 2px;
      width: 18px;
      height: 18px;
      border: 2px solid #D1D5DB;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .checkbox-label input:checked ~ .checkbox-custom {
      background: #4CAF50;
      border-color: #4CAF50;
    }

    .checkbox-custom:after {
      content: '';
      position: absolute;
      display: none;
      left: 5px;
      top: 1px;
      width: 5px;
      height: 10px;
      border: solid white;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }

    .checkbox-label input:checked ~ .checkbox-custom:after {
      display: block;
    }

    .checkbox-label a {
      color: var(--color-primary-500, #FF9800);
      text-decoration: none;
      font-weight: 500;
    }

    .checkbox-label a:hover {
      text-decoration: underline;
    }

    /* Info Box */
    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 12px;
      margin-bottom: 1.25rem;
    }

    .info-box.success {
      background: #E8F5E9;
      border-color: #bbf7d0;
    }

    .info-box .info-icon {
      font-size: 1.25rem;
    }

    .info-box p {
      font-size: 0.875rem;
      color: #374151;
      margin: 0;
    }

    /* Form Actions */
    .form-actions {
      display: flex;
      gap: 1rem;
    }

    .form-actions .btn {
      flex: 1;
    }

    /* Buttons */
    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(255, 152, 0, 0.4);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 152, 0, 0.5);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-outline {
      background: white;
      border: 2px solid #EEEEEE;
      color: #374151;
    }

    .btn-outline:hover {
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
    }

    .btn-text {
      background: none;
      border: none;
      color: var(--color-primary-500, #FF9800);
      padding: 0.5rem;
      font-size: 0.875rem;
    }

    .btn-block {
      width: 100%;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid #D1D5DB;
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Alert */
    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border-radius: 12px;
      margin-bottom: 1.25rem;
    }

    .alert-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .alert-error {
      background: #FFEBEE;
      color: #991b1b;
      border: 1px solid #FFCDD2;
    }

    .alert-error .alert-icon {
      background: var(--color-terracotta, #C62828);
      color: white;
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      color: #6b7280;
    }

    .auth-footer a {
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
      text-decoration: none;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }

    /* Photo Upload Styles */
    .photo-upload-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .profile-photo-upload {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
    }

    .profile-photo-upload.has-photo {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .profile-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      background: #F5F5F5;
      border: 2px dashed #D1D5DB;
      border-radius: 50%;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.2s;
    }

    .photo-placeholder:hover {
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
    }

    .photo-placeholder span {
      font-size: 0.625rem;
      text-align: center;
    }

    .photo-remove-btn {
      position: absolute;
      top: 0;
      right: 0;
      width: 28px;
      height: 28px;
      background: var(--color-terracotta, #C62828);
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      transition: all 0.2s;
    }

    .photo-remove-btn:hover {
      background: var(--color-terracotta, #C62828);
      transform: scale(1.1);
    }

    .btn-upload {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: #F5F5F5;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-upload:hover {
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
    }

    /* ID Type Options */
    .id-type-options {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }

    .id-type-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 0.5rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: center;
    }

    .id-type-option input {
      display: none;
    }

    .id-type-option:hover {
      border-color: var(--color-primary-500, #FF9800);
    }

    .id-type-option.selected {
      border-color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
    }

    .id-type-icon {
      font-size: 1.5rem;
    }

    .id-type-option span:last-child {
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
    }

    /* Document Upload Grid */
    .document-upload-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .document-upload {
      position: relative;
      aspect-ratio: 16/10;
      border-radius: 12px;
      overflow: hidden;
    }

    .document-upload.has-image {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .document-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .document-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #FAFAFA;
      border: 2px dashed #D1D5DB;
      border-radius: 12px;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.2s;
    }

    .document-placeholder:hover {
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
    }

    .document-placeholder span {
      font-size: 0.875rem;
      font-weight: 500;
    }

    .document-remove-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 24px;
      height: 24px;
      background: var(--color-terracotta, #C62828);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      transition: all 0.2s;
    }

    .document-remove-btn:hover {
      background: var(--color-terracotta, #C62828);
      transform: scale(1.1);
    }

    .document-label {
      position: absolute;
      bottom: 0.5rem;
      left: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      font-size: 0.75rem;
      font-weight: 500;
      border-radius: 4px;
    }

    /* Shop Photos Grid */
    .shop-photos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
      margin-top: 0.5rem;
    }

    .shop-photo-upload {
      position: relative;
      aspect-ratio: 1;
      border-radius: 12px;
      overflow: hidden;
    }

    .shop-photo-upload.has-image {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .shop-photo-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .shop-photo-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #FAFAFA;
      border: 2px dashed #D1D5DB;
      border-radius: 12px;
      cursor: pointer;
      color: #9ca3af;
      transition: all 0.2s;
    }

    .shop-photo-placeholder:hover {
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
      background: #FFF3E0;
    }

    .shop-photo-placeholder span {
      font-size: 0.75rem;
      font-weight: 500;
    }

    .shop-photo-remove-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 24px;
      height: 24px;
      background: var(--color-terracotta, #C62828);
      border: none;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: white;
      transition: all 0.2s;
    }

    .shop-photo-remove-btn:hover {
      background: var(--color-terracotta, #C62828);
      transform: scale(1.1);
    }

    .shop-photo-label {
      position: absolute;
      bottom: 0.5rem;
      left: 50%;
      transform: translateX(-50%);
      padding: 0.25rem 0.5rem;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      font-size: 0.625rem;
      font-weight: 500;
      border-radius: 4px;
      white-space: nowrap;
    }

    @media (max-width: 480px) {
      .id-type-options {
        grid-template-columns: repeat(2, 1fr);
      }

      .shop-photos-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .auth-card {
        padding: 1.5rem 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .progress-steps.extended .step-label {
        display: none;
      }

      .specialty-grid {
        justify-content: center;
      }
    }
  `],
})
export class RegisterComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly locationService = inject(LocationService);
  private readonly settingsService = inject(SettingsService);
  private readonly logger = inject(LoggerService);
  private readonly geolocation = inject(GeolocationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly currentStep = signal(1);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly passwordStrength = signal(0);
  readonly isGettingLocation = signal(false);
  readonly locationError = signal<string | null>(null);
  readonly selectedSpecialties = signal<string[]>([]);
  private readonly _formSubmitted = signal(false);

  // File upload signals
  readonly profilePhotoPreview = signal<string | null>(null);
  readonly idDocumentFrontPreview = signal<string | null>(null);
  readonly idDocumentBackPreview = signal<string | null>(null);
  readonly shopPhotoPreviews = signal<(string | null)[]>([null, null, null]);

  // File data (base64)
  private profilePhotoFile: File | null = null;
  private idDocumentFrontFile: File | null = null;
  private idDocumentBackFile: File | null = null;
  private shopPhotoFiles: (File | null)[] = [null, null, null];
  private currentShopPhotoIndex = 0;

  // Location signals from backend
  readonly cities = signal<City[]>([]);
  readonly communes = signal<Commune[]>([]);
  readonly quarters = signal<Quarter[]>([]);
  readonly locationDataLoading = signal(false);

  readonly deviceSpecialties = computed(() => this.settingsService.getDeviceSpecialties());

  @ViewChild('shopPhotoInput') shopPhotoInput!: ElementRef<HTMLInputElement>;

  // Calculate max birth date (18 years ago)
  readonly maxBirthDate = new Date(
    new Date().getFullYear() - 18,
    new Date().getMonth(),
    new Date().getDate()
  ).toISOString().split('T')[0];

  registerForm: FormGroup = this.fb.group({
    // Step 1: Identity
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, CustomValidators.phoneNumber()]],

    // Step 2: Security
    password: ['', [Validators.required, CustomValidators.strongPassword()]],
    confirmPassword: ['', [Validators.required]],

    // Step 3: Role
    role: ['client', Validators.required],
    acceptTerms: [false, Validators.requiredTrue],

    // Step 4: Personal Identification (Repairer only)
    dateOfBirth: [''],
    idDocumentType: ['cni'],
    nationalIdNumber: [''],
    personalAddress: [''],

    // Step 5: Business Information (Repairer only)
    businessName: [''],
    businessType: ['individual'],
    rccmNumber: [''],
    taxId: [''],
    businessPhone: [''],
    businessEmail: [''],
    yearsOfExperience: [''],

    // Step 6: Shop Location (Repairer only)
    city: ['Abidjan'],
    commune: [''],
    quarter: [''],
    address: [''],
    landmark: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],

    // Step 7: Services (Repairer only)
    description: [''],
    acceptsHomeService: [false],
    homeServiceRadiusKm: [10],
  });

  // Signal for role - updated via form valueChanges
  readonly isRepairer = signal(false);

  readonly visibleSteps = computed(() => {
    if (this.isRepairer()) {
      return [
        { number: 1, label: 'Identité' },
        { number: 2, label: 'Sécurité' },
        { number: 3, label: 'Profil' },
        { number: 4, label: 'CNI' },
        { number: 5, label: 'Commerce' },
        { number: 6, label: 'Boutique' },
        { number: 7, label: 'Services' },
      ];
    }
    return [
      { number: 1, label: 'Identité' },
      { number: 2, label: 'Sécurité' },
      { number: 3, label: 'Profil' },
    ];
  });

  readonly selectedCommuneQuarters = computed(() => {
    return this.quarters();
  });

  // Signal for location status - updated manually when lat/lng change
  readonly hasLocation = signal(false);

  readonly hasNoShopPhotos = computed(() => !this.shopPhotoPreviews().some(p => p !== null));

  formSubmitted(): boolean {
    return this._formSubmitted();
  }

  constructor() {
    // Update isRepairer signal when role changes
    this.registerForm.get('role')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.isRepairer.set(value === 'repairer');
    });

    this.registerForm.get('password')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(value => {
      this.updatePasswordStrength(value);
    });

    // Update communes when city changes - only if actually different
    let lastCity = this.registerForm.get('city')?.value || '';
    this.registerForm.get('city')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(cityName => {
      if (cityName !== lastCity) {
        lastCity = cityName;
        this.updateCommunesForCity(cityName);
        this.registerForm.patchValue({ commune: '', quarter: '' }, { emitEvent: false });
      }
    });

    // Update quarters when commune changes - only if actually different
    let lastCommune = '';
    this.registerForm.get('commune')?.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(communeName => {
      if (communeName !== lastCommune) {
        lastCommune = communeName;
        this.updateQuartersForCommune(communeName);
        this.registerForm.patchValue({ quarter: '' }, { emitEvent: false });
      }
    });
  }

  private returnUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.settingsService.loadAllSettings().catch(() => {});
    this.loadLocationData();

    // Handle query parameters (role and returnUrl)
    this.route.queryParams.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      if (params['role'] === 'repairer') {
        this.registerForm.patchValue({ role: 'repairer' });
        this.isRepairer.set(true);
      }
      if (params['returnUrl']) {
        this.returnUrl.set(params['returnUrl']);
      }
    });
  }

  private loadLocationData(): void {
    this.locationDataLoading.set(true);
    this.locationService
      .loadLocationData()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.cities.set(data.cities);
          // Set initial communes for default city (Abidjan)
          const defaultCity = this.registerForm.get('city')?.value || 'Abidjan';
          this.updateCommunesForCity(defaultCity);
          this.locationDataLoading.set(false);
        },
        error: () => {
          this.locationDataLoading.set(false);
        },
      });
  }

  private updateCommunesForCity(cityName: string): void {
    const communes = this.locationService.getCommunesByCityName(cityName);
    this.communes.set(communes);
    this.quarters.set([]);
  }

  private updateQuartersForCommune(communeName: string): void {
    if (!communeName) {
      this.quarters.set([]);
      return;
    }
    const cityName = this.registerForm.get('city')?.value;
    const quarters = this.locationService.getQuartersByCommuneName(communeName, cityName);
    this.quarters.set(quarters);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field) return '';
    return getErrorMessage(field) || '';
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  formatPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');

    if (value.startsWith('225')) {
      value = value.slice(3);
    }

    if (value.length > 2) value = value.slice(0, 2) + ' ' + value.slice(2);
    if (value.length > 5) value = value.slice(0, 5) + ' ' + value.slice(5);
    if (value.length > 8) value = value.slice(0, 8) + ' ' + value.slice(8);
    if (value.length > 11) value = value.slice(0, 11) + ' ' + value.slice(11);
    if (value.length > 14) value = value.slice(0, 14);

    input.value = value;
    this.registerForm.patchValue({ phone: value }, { emitEvent: false });
  }

  updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength.set(0);
      return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    this.passwordStrength.set(Math.min(strength, 4));
  }

  getPasswordStrengthLabel(): string {
    const strength = this.passwordStrength();
    if (strength === 0) return '';
    if (strength === 1) return 'Faible';
    if (strength === 2) return 'Moyen';
    if (strength === 3) return 'Bon';
    return 'Fort';
  }

  hasMinLength(): boolean {
    return (this.registerForm.get('password')?.value?.length || 0) >= 8;
  }

  hasUppercase(): boolean {
    return /[A-Z]/.test(this.registerForm.get('password')?.value || '');
  }

  hasLowercase(): boolean {
    return /[a-z]/.test(this.registerForm.get('password')?.value || '');
  }

  hasNumber(): boolean {
    return /\d/.test(this.registerForm.get('password')?.value || '');
  }

  passwordMismatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const confirm = this.registerForm.get('confirmPassword')?.value;
    return confirm && password !== confirm;
  }

  isSpecialtySelected(specialty: string): boolean {
    return this.selectedSpecialties().includes(specialty);
  }

  toggleSpecialty(specialty: string): void {
    this.selectedSpecialties.update(list => {
      if (list.includes(specialty)) {
        return list.filter(s => s !== specialty);
      }
      return [...list, specialty];
    });
  }

  async getCurrentLocation(): Promise<void> {
    this.isGettingLocation.set(true);
    this.locationError.set(null);
    try {
      const coords = await this.geolocation.getCurrentPosition({
        timeout: 15_000,
        maximumAge: 0,
      });
      this.registerForm.patchValue({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });
      this.hasLocation.set(true);
    } catch (err: any) {
      this.logger.error('RegisterComponent', 'Geolocation error', err);
      this.locationError.set(err?.message || 'Erreur lors de la récupération de votre position');
    } finally {
      this.isGettingLocation.set(false);
    }
  }

  clearLocation(): void {
    this.registerForm.patchValue({
      latitude: null,
      longitude: null,
    });
    this.hasLocation.set(false);
  }

  nextStep(): void {
    const step = this.currentStep();

    if (step === 1) {
      const fields = ['firstName', 'lastName', 'phone'];
      fields.forEach(f => this.registerForm.get(f)?.markAsTouched());

      if (fields.every(f => this.registerForm.get(f)?.valid)) {
        this.currentStep.set(2);
      }
    } else if (step === 2) {
      const fields = ['password', 'confirmPassword'];
      fields.forEach(f => this.registerForm.get(f)?.markAsTouched());

      if (fields.every(f => this.registerForm.get(f)?.valid) && !this.passwordMismatch()) {
        this.currentStep.set(3);
      }
    } else if (step === 3) {
      if (this.isRepairer()) {
        this.currentStep.set(4);
      }
    } else if (step === 4 && this.isRepairer()) {
      const fields = ['dateOfBirth', 'nationalIdNumber', 'personalAddress'];
      fields.forEach(f => this.registerForm.get(f)?.markAsTouched());

      // Add validators dynamically for repairer
      this.registerForm.get('dateOfBirth')?.setValidators([Validators.required]);
      this.registerForm.get('nationalIdNumber')?.setValidators([Validators.required, Validators.minLength(5)]);
      this.registerForm.get('personalAddress')?.setValidators([Validators.required]);
      fields.forEach(f => this.registerForm.get(f)?.updateValueAndValidity());

      // Check for required uploads
      const hasProfilePhoto = !!this.profilePhotoPreview();
      const hasIdDocument = !!this.idDocumentFrontPreview();

      if (fields.every(f => this.registerForm.get(f)?.valid) && hasProfilePhoto && hasIdDocument) {
        this.currentStep.set(5);
      } else {
        this._formSubmitted.set(true);
      }
    } else if (step === 5 && this.isRepairer()) {
      const fields = ['businessName', 'businessType', 'yearsOfExperience'];
      fields.forEach(f => this.registerForm.get(f)?.markAsTouched());

      this.registerForm.get('businessName')?.setValidators([Validators.required, Validators.minLength(2)]);
      this.registerForm.get('yearsOfExperience')?.setValidators([Validators.required]);
      fields.forEach(f => this.registerForm.get(f)?.updateValueAndValidity());

      if (fields.every(f => this.registerForm.get(f)?.valid)) {
        this.currentStep.set(6);
      }
    } else if (step === 6 && this.isRepairer()) {
      const fields = ['commune', 'quarter', 'address'];
      fields.forEach(f => this.registerForm.get(f)?.markAsTouched());

      this.registerForm.get('commune')?.setValidators([Validators.required]);
      this.registerForm.get('quarter')?.setValidators([Validators.required]);
      this.registerForm.get('address')?.setValidators([Validators.required]);
      fields.forEach(f => this.registerForm.get(f)?.updateValueAndValidity());

      // Check for at least one shop photo
      const hasShopPhoto = this.shopPhotoPreviews().some(p => p !== null);

      if (fields.every(f => this.registerForm.get(f)?.valid) && this.hasLocation() && hasShopPhoto) {
        this.currentStep.set(7);
      } else {
        this._formSubmitted.set(true);
        if (!this.hasLocation()) {
          this.locationError.set('Veuillez renseigner la position GPS de votre boutique');
        }
      }
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(s => s - 1);
    }
  }

  async onSubmit(): Promise<void> {
    this._formSubmitted.set(true);

    // Validation for repairer
    if (this.isRepairer() && this.selectedSpecialties().length === 0) {
      return;
    }

    if (!this.registerForm.get('acceptTerms')?.value) {
      return;
    }

    this.error.set(null);
    this.isLoading.set(true);

    try {
      const formValue = this.registerForm.value;
      const cleanPhone = formValue.phone.replace(/\s/g, '');

      const registerData: any = {
        phone: cleanPhone,
        password: formValue.password,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        role: formValue.role,
      };

      // Add repairer profile data if role is repairer
      if (formValue.role === 'repairer') {
        registerData.repairerProfile = {
          // Personal identification
          dateOfBirth: formValue.dateOfBirth,
          nationalIdNumber: formValue.nationalIdNumber,
          personalAddress: formValue.personalAddress,

          // Business information
          businessName: formValue.businessName,
          businessType: formValue.businessType,
          rccmNumber: formValue.rccmNumber || undefined,
          taxId: formValue.taxId || undefined,
          businessPhone: formValue.businessPhone?.replace(/\s/g, '') || undefined,
          businessEmail: formValue.businessEmail || undefined,
          yearsOfExperience: parseInt(formValue.yearsOfExperience, 10),

          // Shop location
          address: formValue.address,
          city: formValue.city,
          commune: formValue.commune,
          quarter: formValue.quarter,
          landmark: formValue.landmark || undefined,
          latitude: formValue.latitude,
          longitude: formValue.longitude,

          // Services
          description: formValue.description || undefined,
          specialties: this.selectedSpecialties(),
          acceptsHomeService: formValue.acceptsHomeService,
          homeServiceRadiusKm: formValue.homeServiceRadiusKm,
        };
      }

      const result = await this.authService.register(registerData);

      this.router.navigate(['/auth/verify-otp'], {
        queryParams: {
          phone: cleanPhone,
          ...(result.devCode && { devCode: result.devCode }),
          ...(this.returnUrl() && { returnUrl: this.returnUrl() }),
          ...(this.isRepairer() && { role: 'repairer' }),
        },
      });
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de l\'inscription');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ===== FILE UPLOAD METHODS =====

  getIdPlaceholder(): string {
    const type = this.registerForm.get('idDocumentType')?.value;
    switch (type) {
      case 'cni': return 'CI-XXXXXXXXX';
      case 'passport': return 'XXXXXXXXXX';
      case 'permit': return 'XXXXXXXXXX';
      case 'residence': return 'XXXXXXXXXX';
      default: return 'Numéro du document';
    }
  }

  onProfilePhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.validateImageFile(file)) {
        this.profilePhotoFile = file;
        this.createImagePreview(file, (preview) => {
          this.profilePhotoPreview.set(preview);
        });
      }
    }
    input.value = '';
  }

  removeProfilePhoto(): void {
    this.profilePhotoFile = null;
    this.profilePhotoPreview.set(null);
  }

  onIdDocumentSelected(event: Event, side: 'front' | 'back'): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.validateImageFile(file)) {
        if (side === 'front') {
          this.idDocumentFrontFile = file;
          this.createImagePreview(file, (preview) => {
            this.idDocumentFrontPreview.set(preview);
          });
        } else {
          this.idDocumentBackFile = file;
          this.createImagePreview(file, (preview) => {
            this.idDocumentBackPreview.set(preview);
          });
        }
      }
    }
    input.value = '';
  }

  removeIdDocument(side: 'front' | 'back'): void {
    if (side === 'front') {
      this.idDocumentFrontFile = null;
      this.idDocumentFrontPreview.set(null);
    } else {
      this.idDocumentBackFile = null;
      this.idDocumentBackPreview.set(null);
    }
  }

  triggerShopPhotoInput(index: number): void {
    this.currentShopPhotoIndex = index;
    if (this.shopPhotoInput?.nativeElement) {
      this.shopPhotoInput.nativeElement.click();
    }
  }

  onShopPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (this.validateImageFile(file)) {
        const index = this.currentShopPhotoIndex;
        this.shopPhotoFiles[index] = file;
        this.createImagePreview(file, (preview) => {
          this.shopPhotoPreviews.update(previews => {
            const newPreviews = [...previews];
            newPreviews[index] = preview;
            return newPreviews;
          });
        });
      }
    }
    input.value = '';
  }

  removeShopPhoto(index: number): void {
    this.shopPhotoFiles[index] = null;
    this.shopPhotoPreviews.update(previews => {
      const newPreviews = [...previews];
      newPreviews[index] = null;
      return newPreviews;
    });
  }

  private validateImageFile(file: File): boolean {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      this.error.set('Format de fichier non supporté. Utilisez JPG, PNG ou WebP.');
      return false;
    }

    if (file.size > maxSize) {
      this.error.set('Le fichier est trop volumineux. Taille maximum: 5MB.');
      return false;
    }

    this.error.set(null);
    return true;
  }

  private createImagePreview(file: File, callback: (preview: string) => void): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

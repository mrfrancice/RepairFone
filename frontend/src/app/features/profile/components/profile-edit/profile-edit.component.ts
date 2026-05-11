import { Component, inject, signal, computed, OnInit, ViewChild, ElementRef, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthStore } from '../../../../core/stores/auth.store';
import { ProfileService, UpdateProfileDto, UpdateRepairerProfileDto } from '../../services/profile.service';
import { LocationService, City, Commune, Quarter } from '../../../../core/services/location.service';
import { SettingsService } from '../../../../core/services/settings.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { PhoneFormatPipe } from '../../../../shared/pipes/phone-format.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-profile-edit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, UiHeaderComponent, FormatDatePipe, PhoneFormatPipe],
  template: `
    <div class="edit-container">
      <!-- Header avec gradient orange -->
      <ui-header
        title="Modifier mon profil"
        subtitle="Mettez à jour vos informations"
        [showBack]="true"
        [showProfile]="true"
        backRoute="/profile"
      />

      <div class="edit-content">
        @if (error()) {
          <div class="alert alert-error">
            <div class="alert-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            {{ error() }}
          </div>
        }

        @if (success()) {
          <div class="alert alert-success">
            <div class="alert-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            {{ success() }}
          </div>
        }

        <form [formGroup]="profileForm" (ngSubmit)="saveProfile()">
          <!-- Photo de profil -->
          <section class="section">
            <h2>
              <div class="section-icon-wrapper">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              Photo de profil
            </h2>
            <div class="avatar-upload-section">
              <div class="avatar-preview" (click)="triggerAvatarInput()">
                @if (avatarPreview()) {
                  <img [src]="avatarPreview()" alt="Avatar" />
                } @else if (user()?.avatarUrl) {
                  <img [src]="user()?.avatarUrl" alt="Avatar" />
                } @else {
                  <div class="avatar-placeholder">
                    {{ getUserInitials() }}
                  </div>
                }
                <div class="avatar-overlay">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
              <input
                #avatarInput
                type="file"
                accept="image/*"
                (change)="onAvatarSelect($event)"
                hidden
              />
              <p class="upload-hint">Cliquez pour changer la photo</p>
            </div>
          </section>

          <!-- Informations personnelles -->
          <section class="section">
            <h2>
              <div class="section-icon-wrapper icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              Informations personnelles
            </h2>

            <div class="form-row">
              <div class="form-group">
                <label for="firstName">Prénom <span class="required">*</span></label>
                <input
                  type="text"
                  id="firstName"
                  formControlName="firstName"
                  class="form-input"
                  [class.input-error]="isFieldInvalid('firstName')"
                />
                @if (isFieldInvalid('firstName')) {
                  <span class="field-error">Prénom requis (min. 2 caractères)</span>
                }
              </div>

              <div class="form-group">
                <label for="lastName">Nom <span class="required">*</span></label>
                <input
                  type="text"
                  id="lastName"
                  formControlName="lastName"
                  class="form-input"
                  [class.input-error]="isFieldInvalid('lastName')"
                />
                @if (isFieldInvalid('lastName')) {
                  <span class="field-error">Nom requis (min. 2 caractères)</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="form-input"
                placeholder="votre@email.com"
              />
            </div>

            <div class="form-group">
              <label>Téléphone</label>
              <div class="readonly-field">
                <div class="readonly-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                  </svg>
                </div>
                <span>{{ user()?.phone | phoneFormat }}</span>
                <span class="readonly-badge">Non modifiable</span>
              </div>
            </div>
          </section>

          <!-- Informations d'identité (Réparateur - Lecture seule) -->
          @if (isRepairer() && hasIdentityInfo()) {
            <section class="section readonly-section">
              <h2>
                <div class="section-icon-wrapper icon-amber">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                Informations d'identité
              </h2>
              <p class="section-notice">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Ces informations ne peuvent pas être modifiées après vérification.
              </p>

              <div class="form-row">
                <div class="form-group">
                  <label>Date de naissance</label>
                  <div class="readonly-field">
                    {{ (user()?.repairerProfile?.dateOfBirth | formatDate:'long') || 'Non renseignée' }}
                  </div>
                </div>

                <div class="form-group">
                  <label>Type de pièce d'identité</label>
                  <div class="readonly-field">
                    {{ getIdDocumentTypeLabel(user()?.repairerProfile?.idDocumentType) }}
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Numéro de pièce d'identité</label>
                <div class="readonly-field">
                  {{ maskIdNumber(user()?.repairerProfile?.nationalIdNumber) || 'Non renseigné' }}
                </div>
              </div>
            </section>
          }

          <!-- Informations commerciales (Réparateur) -->
          @if (isRepairer()) {
            <section class="section">
              <h2>
                <div class="section-icon-wrapper icon-green">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </div>
                Informations commerciales
              </h2>

              <div class="form-group">
                <label for="businessName">Nom commercial <span class="required">*</span></label>
                <input
                  type="text"
                  id="businessName"
                  formControlName="businessName"
                  class="form-input"
                  placeholder="Ex: Tech Repair Pro"
                  [class.input-error]="isFieldInvalid('businessName')"
                />
                @if (isFieldInvalid('businessName')) {
                  <span class="field-error">Nom commercial requis (min. 2 caractères)</span>
                }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="businessType">Type d'activité</label>
                  <select id="businessType" formControlName="businessType" class="form-input">
                    <option value="individual">Particulier / Artisan</option>
                    <option value="auto_entrepreneur">Auto-entrepreneur</option>
                    <option value="company">Entreprise (SARL, SA...)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="yearsOfExperience">Années d'expérience</label>
                  <select id="yearsOfExperience" formControlName="yearsOfExperience" class="form-input">
                    <option value="">Sélectionnez</option>
                    <option value="0-1">Moins d'1 an</option>
                    <option value="1-3">1 à 3 ans</option>
                    <option value="3-5">3 à 5 ans</option>
                    <option value="5-10">5 à 10 ans</option>
                    <option value="10+">Plus de 10 ans</option>
                  </select>
                </div>
              </div>

              @if (profileForm.get('businessType')?.value !== 'individual') {
                <div class="form-row">
                  <div class="form-group">
                    <label for="rccmNumber">N° RCCM</label>
                    <input
                      type="text"
                      id="rccmNumber"
                      formControlName="rccmNumber"
                      class="form-input"
                      placeholder="CI-ABJ-2024-B-12345"
                    />
                  </div>

                  <div class="form-group">
                    <label for="taxId">N° Compte contribuable</label>
                    <input
                      type="text"
                      id="taxId"
                      formControlName="taxId"
                      class="form-input"
                      placeholder="1234567 A"
                    />
                  </div>
                </div>
              }

              <div class="form-row">
                <div class="form-group">
                  <label for="businessPhone">Téléphone professionnel</label>
                  <input
                    type="tel"
                    id="businessPhone"
                    formControlName="businessPhone"
                    class="form-input"
                    placeholder="07 XX XX XX XX"
                  />
                </div>

                <div class="form-group">
                  <label for="businessEmail">Email professionnel</label>
                  <input
                    type="email"
                    id="businessEmail"
                    formControlName="businessEmail"
                    class="form-input"
                    placeholder="contact@monentreprise.ci"
                  />
                </div>
              </div>

              <div class="form-group">
                <label for="description">Description de vos services</label>
                <textarea
                  id="description"
                  formControlName="description"
                  class="form-input form-textarea"
                  rows="4"
                  maxlength="500"
                  placeholder="Présentez vos services, votre expertise, ce qui vous différencie..."
                ></textarea>
                <small class="char-count">{{ profileForm.get('description')?.value?.length || 0 }}/500</small>
              </div>
            </section>

            <!-- Localisation de la boutique -->
            <section class="section">
              <h2>
                <div class="section-icon-wrapper icon-red">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                Localisation de la boutique
              </h2>

              <div class="form-row">
                <div class="form-group">
                  <label for="city">Ville <span class="required">*</span></label>
                  <select id="city" formControlName="city" class="form-input">
                    @if (locationDataLoading()) {
                      <option value="">Chargement...</option>
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
                  class="form-input form-textarea"
                  rows="2"
                  placeholder="Rue, numéro, bâtiment..."
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
                  class="form-input"
                  placeholder="Ex: À côté de la pharmacie, en face du marché..."
                />
              </div>

              <!-- GPS Location -->
              <div class="location-section">
                <label>Position GPS</label>
                <div class="location-box" [class.has-location]="hasLocation()">
                  @if (hasLocation()) {
                    <div class="location-info">
                      <div class="location-icon-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                      </div>
                      <div class="location-coords">
                        <span>Lat: {{ profileForm.get('latitude')?.value | number:'1.6-6' }}</span>
                        <span>Lng: {{ profileForm.get('longitude')?.value | number:'1.6-6' }}</span>
                      </div>
                      <button type="button" class="btn btn-text" (click)="clearLocation()">Modifier</button>
                    </div>
                  } @else {
                    <button type="button" class="btn btn-location" (click)="getCurrentLocation()" [disabled]="isGettingLocation()">
                      @if (isGettingLocation()) {
                        <span class="spinner-small"></span>
                        Localisation en cours...
                      } @else {
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        Utiliser ma position actuelle
                      }
                    </button>
                  }
                </div>
                @if (locationError()) {
                  <span class="field-error">{{ locationError() }}</span>
                }
              </div>
            </section>

            <!-- Photos de la boutique -->
            <section class="section">
              <h2>
                <div class="section-icon-wrapper icon-purple">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                Photos de la boutique
              </h2>
              <p class="section-hint">Ajoutez jusqu'à 3 photos pour montrer votre espace de travail</p>

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
              </div>
              <input
                #shopPhotoInput
                type="file"
                accept="image/*"
                (change)="onShopPhotoSelect($event)"
                hidden
              />
            </section>

            <!-- Spécialités -->
            <section class="section">
              <h2>
                <div class="section-icon-wrapper icon-teal">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                Spécialités
              </h2>
              <p class="section-hint">Sélectionnez vos domaines d'expertise</p>

              <div class="specialties-grid">
                @for (specialty of deviceSpecialties(); track specialty) {
                  <button
                    type="button"
                    class="specialty-chip"
                    [class.selected]="isSpecialtySelected(specialty)"
                    (click)="toggleSpecialty(specialty)"
                  >
                    {{ specialty }}
                    @if (isSpecialtySelected(specialty)) {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    }
                  </button>
                }
              </div>

              @if (selectedSpecialties().length > 0) {
                <div class="selected-count">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {{ selectedSpecialties().length }} spécialité(s) sélectionnée(s)
                </div>
              }
            </section>

            <!-- Options de service -->
            <section class="section">
              <h2>
                <div class="section-icon-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </div>
                Options de service
              </h2>

              <div class="form-group">
                <label class="toggle-label">
                  <span class="toggle-text">
                    <strong>Disponible pour les réparations</strong>
                    <small>Apparaissez dans les résultats de recherche</small>
                  </span>
                  <div class="toggle-switch" [class.active]="profileForm.get('isAvailable')?.value" (click)="toggleAvailability()">
                    <div class="toggle-slider"></div>
                  </div>
                </label>
              </div>

              <div class="form-group">
                <label class="toggle-label">
                  <span class="toggle-text">
                    <strong>Service à domicile</strong>
                    <small>Proposez des interventions chez le client</small>
                  </span>
                  <div class="toggle-switch" [class.active]="profileForm.get('acceptsHomeService')?.value" (click)="toggleHomeService()">
                    <div class="toggle-slider"></div>
                  </div>
                </label>
              </div>

              @if (profileForm.get('acceptsHomeService')?.value) {
                <div class="form-group">
                  <label for="homeServiceRadiusKm">Rayon d'intervention</label>
                  <div class="radius-input">
                    <input
                      type="range"
                      id="homeServiceRadiusKm"
                      formControlName="homeServiceRadiusKm"
                      min="1"
                      max="50"
                      class="range-input"
                    />
                    <span class="radius-value">{{ profileForm.get('homeServiceRadiusKm')?.value }} km</span>
                  </div>
                </div>
              }
            </section>
          }

          <!-- Bouton de sauvegarde -->
          <div class="form-actions">
            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="isSaving() || profileForm.invalid"
            >
              @if (isSaving()) {
                <span class="spinner-small"></span>
                Enregistrement...
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                Enregistrer les modifications
              }
            </button>
          </div>
        </form>

        <!-- Section Confidentialité & RGPD -->
        <section class="section privacy-section">
          <h2>
            <span class="section-icon-wrapper">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </span>
            Confidentialité et données
          </h2>

          <p class="privacy-intro">
            Vous disposez de droits sur vos données personnelles (accès, rectification, portabilité,
            effacement). Consultez notre
            <a (click)="goToPrivacy()" class="privacy-link">politique de confidentialité</a>.
          </p>

          <div class="privacy-actions">
            <button type="button" class="btn btn-outline-dark" (click)="onExportData()" [disabled]="isExporting()">
              @if (isExporting()) {
                <span class="spinner-small"></span>
                Préparation...
              } @else {
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Télécharger mes données (JSON)
              }
            </button>

            <button type="button" class="btn btn-danger" (click)="openDeleteModal()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
              Supprimer mon compte
            </button>
          </div>
        </section>
      </div>

      <!-- Modal de confirmation suppression compte -->
      @if (showDeleteModal()) {
        <div class="delete-modal-backdrop" (click)="closeDeleteModal()">
          <div class="delete-modal" (click)="$event.stopPropagation()">
            <h3>⚠️ Supprimer définitivement votre compte&nbsp;?</h3>
            <p class="delete-warning">
              Cette action est <strong>irréversible</strong>. Vos données personnelles seront
              anonymisées et vous serez déconnecté de tous vos appareils.
            </p>
            <ul class="delete-points">
              <li>Vos demandes et paiements seront conservés (obligation légale)</li>
              <li>Votre profil et messages seront anonymisés</li>
              <li>Vous ne pourrez plus vous reconnecter</li>
            </ul>
            <label class="delete-confirm-label">
              Tapez <strong>SUPPRIMER</strong> pour confirmer&nbsp;:
            </label>
            <input
              type="text"
              [(ngModel)]="deleteConfirmText"
              class="delete-confirm-input"
              autocomplete="off"
              autocapitalize="characters"
            />
            <div class="delete-modal-actions">
              <button type="button" class="btn btn-outline-dark" (click)="closeDeleteModal()" [disabled]="isDeleting()">
                Annuler
              </button>
              <button
                type="button"
                class="btn btn-danger"
                (click)="confirmDeleteAccount()"
                [disabled]="deleteConfirmText !== 'SUPPRIMER' || isDeleting()"
              >
                @if (isDeleting()) {
                  <span class="spinner-small"></span>
                  Suppression...
                } @else {
                  Supprimer définitivement
                }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .edit-container {
      min-height: 100vh;
      background: var(--color-neutral-50, #FAFAFA);
      padding-bottom: calc(2rem + var(--bottom-nav-height, 80px) + var(--safe-area-bottom, 0px));
    }

    .edit-content {
      padding: 1rem;
      padding-top: var(--header-height, 100px);
      max-width: 800px;
      margin: 0 auto;
    }

    /* Alerts */
    .alert {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 12px;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .alert-icon {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .alert-error {
      background: white;
      color: #991b1b;
      border-left: 4px solid var(--color-terracotta, #C62828);
    }

    .alert-error .alert-icon {
      background: linear-gradient(135deg, var(--color-terracotta, #C62828), var(--color-error, #F44336));
      color: white;
    }

    .alert-success {
      background: white;
      color: #166534;
      border-left: 4px solid var(--color-success-dark, #2E7D32);
    }

    .alert-success .alert-icon {
      background: linear-gradient(135deg, var(--color-success-dark, #2E7D32), var(--color-secondary, #4CAF50));
      color: white;
    }

    /* Sections */
    .section {
      background: white;
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .section h2 {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 1rem 0;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .section-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .section-icon-wrapper.icon-blue {
      background: linear-gradient(135deg, var(--color-ocean, #1565C0) 0%, #2196F3 100%);
    }

    .section-icon-wrapper.icon-green {
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50) 0%, #81C784 100%);
    }

    .section-icon-wrapper.icon-amber {
      background: linear-gradient(135deg, var(--color-mustard, #FFC107) 0%, var(--color-mustard, #FFC107) 100%);
    }

    .section-icon-wrapper.icon-red {
      background: linear-gradient(135deg, var(--color-error, #F44336) 0%, #EF5350 100%);
    }

    .section-icon-wrapper.icon-purple {
      background: linear-gradient(135deg, #FF9800 0%, #F9A825 100%);
    }

    .section-icon-wrapper.icon-teal {
      background: linear-gradient(135deg, #4CAF50 0%, #81C784 100%);
    }

    .section-notice {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #FFF8E1, #FFE082);
      color: #92400e;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 0.875rem;
      margin-bottom: 1rem;
    }

    .section-hint {
      color: #6B7280;
      font-size: 0.875rem;
      margin: -0.5rem 0 1rem 0;
    }

    .readonly-section {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
    }

    /* Form elements */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.2s;
      background: white;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.15);
    }

    .form-textarea {
      resize: vertical;
      min-height: 80px;
    }

    .input-error {
      border-color: var(--color-terracotta, #C62828) !important;
    }

    .field-error {
      display: block;
      color: var(--color-terracotta, #C62828);
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .required {
      color: var(--color-terracotta, #C62828);
    }

    .char-count {
      display: block;
      text-align: right;
      color: #6B7280;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .readonly-field {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #f1f5f9;
      border-radius: 12px;
      color: #4B5563;
      font-size: 0.9375rem;
    }

    .readonly-icon {
      width: 32px;
      height: 32px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), #FF9800);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .readonly-badge {
      margin-left: auto;
      background: #e2e8f0;
      color: #6B7280;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }

    /* Avatar Section */
    .avatar-upload-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .avatar-preview {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      border: 4px solid transparent;
      background: linear-gradient(white, white) padding-box,
                  linear-gradient(135deg, var(--color-primary-500, #FF9800), #FF9800) border-box;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }

    .avatar-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 2.5rem;
      font-weight: 700;
    }

    .avatar-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
      color: white;
    }

    .avatar-preview:hover .avatar-overlay {
      opacity: 1;
    }

    .upload-hint {
      color: #6B7280;
      font-size: 0.875rem;
    }

    /* Location Section */
    .location-section {
      margin-top: 1rem;
    }

    .location-section label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
      font-size: 0.875rem;
    }

    .location-box {
      border: 2px dashed #e2e8f0;
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
      transition: all 0.2s;
    }

    .location-box.has-location {
      border-style: solid;
      border-color: var(--color-secondary, #4CAF50);
      background: linear-gradient(135deg, #E8F5E9, #E8F5E9);
    }

    .location-info {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .location-icon-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50), #81C784);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .location-coords {
      display: flex;
      flex-direction: column;
      font-size: 0.875rem;
      color: #374151;
      font-weight: 500;
    }

    .btn-location {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
    }

    .btn-location:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(255, 152, 0, 0.4);
    }

    .btn-location:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-text {
      background: none;
      border: none;
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
      cursor: pointer;
      padding: 0.25rem 0.5rem;
    }

    /* Shop Photos */
    .shop-photos-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.75rem;
    }

    .shop-photo-upload {
      aspect-ratio: 1;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      background: #f8fafc;
    }

    .shop-photo-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #9CA3AF;
      cursor: pointer;
      border: 2px dashed #e2e8f0;
      border-radius: 12px;
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

    .shop-photo-preview {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .shop-photo-remove-btn {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.6);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .shop-photo-remove-btn:hover {
      background: var(--color-terracotta, #C62828);
    }

    .shop-photo-label {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
      color: white;
      padding: 0.5rem 0.25rem 0.25rem;
      font-size: 0.75rem;
      text-align: center;
    }

    /* Specialties */
    .specialties-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .specialty-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.5rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 25px;
      background: white;
      color: #4B5563;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .specialty-chip:hover {
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
    }

    .specialty-chip.selected {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, #FF9800 100%);
      border-color: transparent;
      color: white;
    }

    .selected-count {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.75rem;
      color: var(--color-primary-500, #FF9800);
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Toggle Switch */
    .toggle-label {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      padding: 0.75rem 0;
    }

    .toggle-text {
      display: flex;
      flex-direction: column;
    }

    .toggle-text strong {
      color: #1f2937;
      font-size: 0.9375rem;
    }

    .toggle-text small {
      color: #6B7280;
      font-size: 0.8125rem;
    }

    .toggle-switch {
      width: 52px;
      height: 28px;
      background: #e2e8f0;
      border-radius: 14px;
      position: relative;
      transition: background 0.2s;
      flex-shrink: 0;
    }

    .toggle-switch.active {
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50), #81C784);
    }

    .toggle-slider {
      width: 24px;
      height: 24px;
      background: white;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .toggle-switch.active .toggle-slider {
      transform: translateX(24px);
    }

    /* Radius Input */
    .radius-input {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.5rem;
      background: #f8fafc;
      border-radius: 12px;
    }

    .range-input {
      flex: 1;
      height: 6px;
      -webkit-appearance: none;
      background: #e2e8f0;
      border-radius: 3px;
      outline: none;
    }

    .range-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 22px;
      height: 22px;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), #FF9800);
      border-radius: 50%;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.4);
    }

    .radius-value {
      min-width: 55px;
      text-align: center;
      font-weight: 700;
      color: var(--color-primary-500, #FF9800);
      background: white;
      padding: 0.375rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
    }

    /* Form Actions */
    .form-actions {
      margin-top: 1.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-primary-900, #E65100) 50%, #FF9800 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(255, 152, 0, 0.4);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 152, 0, 0.5);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-block {
      width: 100%;
    }

    .spinner-small {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Section Confidentialité / RGPD */
    .privacy-section {
      border: 1px solid #fde2e2;
    }

    .privacy-intro {
      color: #4B5563;
      line-height: 1.6;
      margin: 0 0 1rem 0;
    }

    .privacy-link {
      color: var(--color-primary-500, #FF9800);
      text-decoration: underline;
      cursor: pointer;
    }

    .privacy-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .btn-outline-dark {
      background: white;
      color: #1f2937;
      border: 1px solid #cbd5e1;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background 0.15s;
    }
    .btn-outline-dark:hover:not(:disabled) {
      background: #f8fafc;
    }
    .btn-outline-dark:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-danger {
      background: var(--color-terracotta, #C62828);
      color: white;
      border: none;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: background 0.15s, transform 0.1s;
    }
    .btn-danger:hover:not(:disabled) {
      background: #991b1b;
    }
    .btn-danger:active:not(:disabled) {
      transform: scale(0.98);
    }
    .btn-danger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Modal de suppression */
    .delete-modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
    }

    .delete-modal {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
    }

    .delete-modal h3 {
      margin: 0 0 0.75rem 0;
      color: #991b1b;
      font-size: 1.125rem;
    }

    .delete-warning {
      color: #4B5563;
      line-height: 1.5;
      margin: 0 0 1rem 0;
    }

    .delete-points {
      color: #6B7280;
      font-size: 0.875rem;
      line-height: 1.6;
      padding-left: 1.25rem;
      margin: 0 0 1rem 0;
    }

    .delete-confirm-label {
      display: block;
      color: #4B5563;
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }

    .delete-confirm-input {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 1rem;
      font-family: inherit;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
      box-sizing: border-box;
    }
    .delete-confirm-input:focus {
      outline: none;
      border-color: var(--color-terracotta, #C62828);
    }

    .delete-modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    @media (max-width: 640px) {
      .delete-modal-actions { flex-direction: column-reverse; }
      .delete-modal-actions .btn { width: 100%; }
    }
  `],
})
export class ProfileEditComponent implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly profileService = inject(ProfileService);
  private readonly locationService = inject(LocationService);
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('avatarInput') avatarInput!: ElementRef<HTMLInputElement>;
  @ViewChild('shopPhotoInput') shopPhotoInput!: ElementRef<HTMLInputElement>;

  readonly user = this.authStore.user;
  readonly isSaving = signal(false);
  readonly isGettingLocation = signal(false);
  readonly locationError = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  // Confidentialité / RGPD
  readonly showDeleteModal = signal(false);
  readonly isDeleting = signal(false);
  readonly isExporting = signal(false);
  deleteConfirmText = '';

  // Location data
  readonly cities = signal<City[]>([]);
  readonly communes = signal<Commune[]>([]);
  readonly quarters = signal<Quarter[]>([]);
  readonly locationDataLoading = signal(false);

  // Photos
  readonly avatarPreview = signal<string | null>(null);
  readonly shopPhotoPreviews = signal<(string | null)[]>([null, null, null]);
  private currentShopPhotoIndex = 0;

  // Specialties - now loaded from settings service
  readonly selectedSpecialties = signal<string[]>([]);
  readonly deviceSpecialties = computed(() => this.settingsService.getDeviceSpecialties());

  // Location state
  readonly hasLocation = signal(false);

  profileForm: FormGroup = this.fb.group({
    // Personal info
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: ['', [Validators.required, Validators.minLength(2)]],
    email: [''],

    // Business info (repairer)
    businessName: [''],
    businessType: ['individual'],
    rccmNumber: [''],
    taxId: [''],
    businessPhone: [''],
    businessEmail: [''],
    yearsOfExperience: [''],
    description: [''],

    // Location
    city: ['Abidjan'],
    commune: [''],
    quarter: [''],
    address: [''],
    landmark: [''],
    latitude: [null as number | null],
    longitude: [null as number | null],

    // Services
    isAvailable: [true],
    acceptsHomeService: [false],
    homeServiceRadiusKm: [10],
  });

  constructor() {
    // Update communes when city changes
    let lastCity = '';
    this.profileForm.get('city')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(cityName => {
        if (cityName && cityName !== lastCity) {
          lastCity = cityName;
          this.updateCommunesForCity(cityName);
          // Don't reset commune/quarter when loading initial data
          if (this.communes().length > 0) {
            this.profileForm.patchValue({ commune: '', quarter: '' }, { emitEvent: false });
          }
        }
      });

    // Update quarters when commune changes
    let lastCommune = '';
    this.profileForm.get('commune')?.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(communeName => {
        if (communeName !== lastCommune) {
          lastCommune = communeName;
          this.updateQuartersForCommune(communeName);
        }
      });
  }

  ngOnInit(): void {
    this.settingsService.loadAllSettings().catch(() => {});
    this.loadLocationData();
    this.loadCurrentData();
  }

  private loadLocationData(): void {
    this.locationDataLoading.set(true);
    this.locationService.loadLocationData().subscribe({
      next: (data) => {
        this.cities.set(data.cities);
        this.locationDataLoading.set(false);

        // After loading location data, set communes/quarters based on current values
        const city = this.profileForm.get('city')?.value;
        if (city) {
          this.updateCommunesForCity(city);
          const commune = this.profileForm.get('commune')?.value;
          if (commune) {
            this.updateQuartersForCommune(commune);
          }
        }
      },
      error: () => {
        this.locationDataLoading.set(false);
      }
    });
  }

  private updateCommunesForCity(cityName: string): void {
    if (!cityName) return;
    const communes = this.locationService.getCommunesByCityName(cityName);
    this.communes.set(communes);
    this.quarters.set([]);
  }

  private updateQuartersForCommune(communeName: string): void {
    if (!communeName) {
      this.quarters.set([]);
      return;
    }
    const cityName = this.profileForm.get('city')?.value;
    const quarters = this.locationService.getQuartersByCommuneName(communeName, cityName);
    this.quarters.set(quarters);
  }

  loadCurrentData(): void {
    const user = this.user();
    if (!user) return;

    this.profileForm.patchValue({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
    });

    if (user.repairerProfile) {
      const rp = user.repairerProfile;

      this.profileForm.patchValue({
        businessName: rp.businessName || '',
        businessType: rp.businessType || 'individual',
        rccmNumber: rp.rccmNumber || '',
        taxId: rp.taxId || '',
        businessPhone: rp.businessPhone || '',
        businessEmail: rp.businessEmail || '',
        yearsOfExperience: rp.yearsOfExperience || '',
        description: rp.description || '',
        city: rp.city || 'Abidjan',
        commune: rp.commune || '',
        quarter: rp.quarter || '',
        address: rp.address || '',
        landmark: rp.landmark || '',
        latitude: rp.latitude || null,
        longitude: rp.longitude || null,
        isAvailable: rp.isAvailable ?? true,
        acceptsHomeService: rp.acceptsHomeService ?? false,
        homeServiceRadiusKm: rp.homeServiceRadiusKm ?? 10,
      });

      // Set location state
      if (rp.latitude && rp.longitude) {
        this.hasLocation.set(true);
      }

      // Set specialties
      if (rp.specialties && rp.specialties.length > 0) {
        this.selectedSpecialties.set([...rp.specialties]);
      }

      // Set shop photos if available
      if (rp.shopPhotos && rp.shopPhotos.length > 0) {
        const photos = [...this.shopPhotoPreviews()];
        rp.shopPhotos.forEach((url: string, index: number) => {
          if (index < 3) photos[index] = url;
        });
        this.shopPhotoPreviews.set(photos);
      }
    }
  }

  isRepairer(): boolean {
    return this.user()?.role === 'repairer';
  }

  hasIdentityInfo(): boolean {
    const rp = this.user()?.repairerProfile;
    return !!(rp?.dateOfBirth || rp?.nationalIdNumber);
  }

  getUserInitials(): string {
    const user = this.user();
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return '?';
  }

  getIdDocumentTypeLabel(type: string | undefined): string {
    const labels: Record<string, string> = {
      'cni': 'Carte Nationale d\'Identité',
      'passport': 'Passeport',
      'driver_license': 'Permis de conduire',
    };
    return labels[type || ''] || 'Non renseigné';
  }

  maskIdNumber(number: string | undefined): string {
    if (!number || number.length < 4) return number || '';
    return number.slice(0, 2) + '****' + number.slice(-2);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Avatar methods
  triggerAvatarInput(): void {
    this.avatarInput?.nativeElement?.click();
  }

  async onAvatarSelect(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Garde-fou côté client (le backend impose 2MB et image/* aussi)
    if (!file.type.startsWith('image/')) {
      this.error.set('Le fichier doit être une image (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.error.set('L\'image doit faire moins de 2 Mo.');
      return;
    }

    // Preview instantané pendant que l'upload est en cours
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload réel vers /users/me/avatar
    this.isSaving.set(true);
    this.error.set(null);
    try {
      const { avatarUrl } = await this.profileService.uploadAvatar(file);
      // getProfile() refresh le user dans AuthStore (propage l'avatar partout)
      await this.profileService.getProfile();
      this.success.set('Photo de profil mise à jour.');
      // Remplace le preview base64 par l'URL serveur définitive
      this.avatarPreview.set(avatarUrl);
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'Échec de l\'envoi de la photo');
      // Annule le preview en cas d'erreur
      this.avatarPreview.set(null);
    } finally {
      this.isSaving.set(false);
      // Permet de re-sélectionner le même fichier
      input.value = '';
    }
  }

  // Shop photos methods
  triggerShopPhotoInput(index: number): void {
    this.currentShopPhotoIndex = index;
    this.shopPhotoInput?.nativeElement?.click();
  }

  onShopPhotoSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const previews = [...this.shopPhotoPreviews()];
      previews[this.currentShopPhotoIndex] = e.target?.result as string;
      this.shopPhotoPreviews.set(previews);
    };
    reader.readAsDataURL(file);

    input.value = '';
  }

  removeShopPhoto(index: number): void {
    const previews = [...this.shopPhotoPreviews()];
    previews[index] = null;
    this.shopPhotoPreviews.set(previews);
  }

  // Location methods
  getCurrentLocation(): void {
    if (!navigator.geolocation) {
      this.locationError.set('La géolocalisation n\'est pas supportée');
      return;
    }

    this.isGettingLocation.set(true);
    this.locationError.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.profileForm.patchValue({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        this.hasLocation.set(true);
        this.isGettingLocation.set(false);
      },
      (error) => {
        this.isGettingLocation.set(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError.set('Accès à la position refusé');
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError.set('Position non disponible');
            break;
          case error.TIMEOUT:
            this.locationError.set('Délai dépassé');
            break;
          default:
            this.locationError.set('Erreur de géolocalisation');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  clearLocation(): void {
    this.profileForm.patchValue({ latitude: null, longitude: null });
    this.hasLocation.set(false);
  }

  // Specialty methods
  isSpecialtySelected(specialty: string): boolean {
    return this.selectedSpecialties().includes(specialty);
  }

  toggleSpecialty(specialty: string): void {
    const current = this.selectedSpecialties();
    if (current.includes(specialty)) {
      this.selectedSpecialties.set(current.filter(s => s !== specialty));
    } else {
      this.selectedSpecialties.set([...current, specialty]);
    }
  }

  // Toggle methods
  toggleAvailability(): void {
    const current = this.profileForm.get('isAvailable')?.value;
    this.profileForm.patchValue({ isAvailable: !current });
  }

  toggleHomeService(): void {
    const current = this.profileForm.get('acceptsHomeService')?.value;
    this.profileForm.patchValue({ acceptsHomeService: !current });
  }

  // Save profile
  async saveProfile(): Promise<void> {
    this.error.set(null);
    this.success.set(null);

    // Mark all fields as touched for validation
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });

    if (this.profileForm.invalid) {
      this.error.set('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    this.isSaving.set(true);

    try {
      const formValue = this.profileForm.value;

      // Update basic profile
      const profileDto: UpdateProfileDto = {
        firstName: formValue.firstName || undefined,
        lastName: formValue.lastName || undefined,
      };

      await this.profileService.updateProfile(profileDto);

      // Update repairer profile if applicable
      if (this.isRepairer()) {
        const repairerDto: UpdateRepairerProfileDto = {
          businessName: formValue.businessName || undefined,
          businessType: formValue.businessType || undefined,
          rccmNumber: formValue.rccmNumber || undefined,
          taxId: formValue.taxId || undefined,
          businessPhone: formValue.businessPhone || undefined,
          businessEmail: formValue.businessEmail || undefined,
          yearsOfExperience: formValue.yearsOfExperience || undefined,
          description: formValue.description || undefined,
          city: formValue.city || undefined,
          commune: formValue.commune || undefined,
          quarter: formValue.quarter || undefined,
          address: formValue.address || undefined,
          landmark: formValue.landmark || undefined,
          latitude: formValue.latitude,
          longitude: formValue.longitude,
          specialties: this.selectedSpecialties().length > 0 ? this.selectedSpecialties() : undefined,
          isAvailable: formValue.isAvailable,
          acceptsHomeService: formValue.acceptsHomeService,
          homeServiceRadiusKm: formValue.homeServiceRadiusKm,
        };

        await this.profileService.updateRepairerProfile(repairerDto);
      }

      this.success.set('Profil mis à jour avec succès');

      setTimeout(() => {
        this.router.navigate(['/profile']);
      }, 1500);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors de la mise à jour');
    } finally {
      this.isSaving.set(false);
    }
  }

  // ============================================================
  // Confidentialité / RGPD
  // ============================================================

  goToPrivacy(): void {
    this.router.navigate(['/privacy']);
  }

  openDeleteModal(): void {
    this.deleteConfirmText = '';
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) return;
    this.deleteConfirmText = '';
    this.showDeleteModal.set(false);
  }

  async confirmDeleteAccount(): Promise<void> {
    if (this.deleteConfirmText !== 'SUPPRIMER' || this.isDeleting()) {
      return;
    }
    this.isDeleting.set(true);
    this.error.set(null);

    try {
      await this.profileService.deleteAccount();
      // Backend a anonymisé + révoqué les refresh tokens.
      // Côté client : purge la session locale et redirige vers la home publique.
      this.authStore.logout();
      this.router.navigate(['/onboarding']);
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || 'Erreur lors de la suppression du compte');
      this.isDeleting.set(false);
    }
  }

  async onExportData(): Promise<void> {
    if (this.isExporting()) return;
    this.isExporting.set(true);
    this.error.set(null);

    try {
      const blob = await this.profileService.exportMyData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const stamp = new Date().toISOString().slice(0, 10);
      a.download = `repairfone-mes-donnees-${stamp}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      this.success.set('Téléchargement de vos données démarré');
      setTimeout(() => this.success.set(null), 3000);
    } catch (err: any) {
      this.error.set(err?.error?.message || err?.message || "Erreur lors de l'export des données");
    } finally {
      this.isExporting.set(false);
    }
  }
}

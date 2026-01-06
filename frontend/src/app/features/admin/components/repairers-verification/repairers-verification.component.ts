import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, RepairerForVerification, VerificationStats } from '../../services/admin.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';

type StatusFilter = 'all' | 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';

@Component({
  selector: 'app-repairers-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, UiHeaderComponent],
  template: `
    <div class="admin-page">
      <!-- Header Banner -->
      <ui-header
        title="Vérification des réparateurs"
        [subtitle]="total() + ' réparateur(s) au total'"
        [showBack]="true"
        [showIcon]="true"
        [showProfile]="true"
        backRoute="/admin"
      >
        <svg header-icon width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </ui-header>

      <div class="admin-container">
        <!-- Search Bar -->
        <div class="search-section">
          <div class="search-bar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Rechercher un reparateur..."
              [(ngModel)]="searchQuery"
              (input)="onSearch()"
            />
            @if (searchQuery) {
              <button class="clear-search" (click)="clearSearch()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            }
          </div>
        </div>

        <!-- Status Tabs -->
        <div class="status-tabs-container">
          <div class="status-tabs">
            <button
              class="status-tab"
              [class.active]="statusFilter() === 'all'"
              (click)="setStatusFilter('all')"
            >
              <span class="tab-label">Tous</span>
              <span class="tab-count">{{ getTotalCount() }}</span>
            </button>
            <button
              class="status-tab pending"
              [class.active]="statusFilter() === 'pending'"
              (click)="setStatusFilter('pending')"
            >
              <span class="tab-dot"></span>
              <span class="tab-label">En attente</span>
              <span class="tab-count">{{ stats()?.pending || 0 }}</span>
            </button>
            <button
              class="status-tab review"
              [class.active]="statusFilter() === 'under_review'"
              (click)="setStatusFilter('under_review')"
            >
              <span class="tab-dot"></span>
              <span class="tab-label">En revision</span>
              <span class="tab-count">{{ stats()?.underReview || 0 }}</span>
            </button>
            <button
              class="status-tab verified"
              [class.active]="statusFilter() === 'verified'"
              (click)="setStatusFilter('verified')"
            >
              <span class="tab-dot"></span>
              <span class="tab-label">Verifies</span>
              <span class="tab-count">{{ stats()?.verified || 0 }}</span>
            </button>
            <button
              class="status-tab rejected"
              [class.active]="statusFilter() === 'rejected'"
              (click)="setStatusFilter('rejected')"
            >
              <span class="tab-dot"></span>
              <span class="tab-label">Rejetes</span>
              <span class="tab-count">{{ stats()?.rejected || 0 }}</span>
            </button>
            <button
              class="status-tab suspended"
              [class.active]="statusFilter() === 'suspended'"
              (click)="setStatusFilter('suspended')"
            >
              <span class="tab-dot"></span>
              <span class="tab-label">Suspendus</span>
              <span class="tab-count">{{ stats()?.suspended || 0 }}</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Chargement des reparateurs...</p>
          </div>
        } @else if (error()) {
          <div class="error-state">
            <div class="error-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </div>
            <p>{{ error() }}</p>
            <button class="btn btn-primary" (click)="loadRepairers()">Reessayer</button>
          </div>
        } @else if (repairers().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <h3>Aucun reparateur</h3>
            <p>Aucun reparateur ne correspond a ce filtre</p>
          </div>
        } @else {
          <!-- Repairers List -->
          <div class="repairers-list">
            @for (repairer of repairers(); track repairer.id) {
              <div class="repairer-card" [class.expanded]="expandedId() === repairer.id">
                <div class="card-header" (click)="toggleExpand(repairer.id)">
                  <div class="repairer-info">
                    <div class="avatar" [class]="repairer.verificationStatus">
                      @if (repairer.user?.avatarUrl) {
                        <img [src]="repairer.user?.avatarUrl" [alt]="repairer.businessName" />
                      } @else {
                        <span>{{ getInitials(repairer) }}</span>
                      }
                    </div>
                    <div class="info-content">
                      <h3>{{ repairer.businessName }}</h3>
                      <p class="user-name">{{ repairer.user?.firstName }} {{ repairer.user?.lastName }}</p>
                      <p class="user-phone">{{ repairer.user?.phone }}</p>
                    </div>
                  </div>
                  <div class="card-actions">
                    <span class="status-badge" [class]="repairer.verificationStatus">
                      <span class="badge-dot"></span>
                      {{ getStatusLabel(repairer.verificationStatus) }}
                    </span>
                    <div class="expand-btn" [class.expanded]="expandedId() === repairer.id">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                      </svg>
                    </div>
                  </div>
                </div>

                @if (expandedId() === repairer.id) {
                  <div class="card-details">
                    <!-- Business Info -->
                    <div class="detail-section">
                      <div class="section-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21H5M19 21H21M5 21H3M9 7H10M9 11H10M14 7H15M14 11H15M9 21V16C9 15.4477 9.44772 15 10 15H14C14.5523 15 15 15.4477 15 16V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        <h4>Informations commerciales</h4>
                      </div>
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Type d'activite</span>
                          <span class="detail-value">{{ repairer.businessType || 'Non specifie' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Telephone</span>
                          <span class="detail-value">{{ repairer.businessPhone || repairer.user?.phone }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Email</span>
                          <span class="detail-value">{{ repairer.businessEmail || 'Non specifie' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Experience</span>
                          <span class="detail-value highlight">{{ repairer.yearsOfExperience || 0 }} ans</span>
                        </div>
                      </div>
                    </div>

                    <!-- Location -->
                    <div class="detail-section">
                      <div class="section-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" stroke="currentColor" stroke-width="2"/>
                          <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        <h4>Localisation</h4>
                      </div>
                      <div class="detail-grid">
                        <div class="detail-item full">
                          <span class="detail-label">Adresse complete</span>
                          <span class="detail-value">{{ repairer.address || 'Non renseignee' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Ville</span>
                          <span class="detail-value">{{ repairer.city || 'Non renseignee' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Commune</span>
                          <span class="detail-value">{{ repairer.commune || 'Non renseignee' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Quartier</span>
                          <span class="detail-value">{{ repairer.quarter || 'Non renseigne' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Coordonnees GPS</span>
                          <span class="detail-value">
                            @if (repairer.latitude && repairer.longitude) {
                              <span class="gps-coords">{{ repairer.latitude.toFixed(6) }}, {{ repairer.longitude.toFixed(6) }}</span>
                            } @else {
                              <span class="not-provided">Non renseignees</span>
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <!-- Identity Documents -->
                    <div class="detail-section">
                      <div class="section-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                          <circle cx="9" cy="10" r="2" stroke="currentColor" stroke-width="2"/>
                          <path d="M15 8H17M15 12H17M7 16H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <h4>Documents d'identite</h4>
                      </div>
                      <div class="detail-grid">
                        <div class="detail-item">
                          <span class="detail-label">Numero CNI</span>
                          <span class="detail-value">{{ repairer.nationalIdNumber || 'Non fourni' }}</span>
                        </div>
                        <div class="detail-item">
                          <span class="detail-label">Date de naissance</span>
                          <span class="detail-value">{{ repairer.dateOfBirth || 'Non fournie' }}</span>
                        </div>
                      </div>
                      @if (repairer.nationalIdFrontUrl || repairer.nationalIdBackUrl) {
                        <div class="documents-preview">
                          @if (repairer.nationalIdFrontUrl) {
                            <a [href]="repairer.nationalIdFrontUrl" target="_blank" class="doc-link">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                              CNI (recto)
                            </a>
                          }
                          @if (repairer.nationalIdBackUrl) {
                            <a [href]="repairer.nationalIdBackUrl" target="_blank" class="doc-link">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                              CNI (verso)
                            </a>
                          }
                        </div>
                      }
                    </div>

                    <!-- Business Documents -->
                    @if (repairer.rccmNumber || repairer.taxId) {
                      <div class="detail-section">
                        <div class="section-header">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                          <h4>Documents commerciaux</h4>
                        </div>
                        <div class="detail-grid">
                          @if (repairer.rccmNumber) {
                            <div class="detail-item">
                              <span class="detail-label">Numero RCCM</span>
                              <span class="detail-value">{{ repairer.rccmNumber }}</span>
                            </div>
                          }
                          @if (repairer.taxId) {
                            <div class="detail-item">
                              <span class="detail-label">Numero Contribuable</span>
                              <span class="detail-value">{{ repairer.taxId }}</span>
                            </div>
                          }
                        </div>
                        @if (repairer.rccmDocumentUrl) {
                          <div class="documents-preview">
                            <a [href]="repairer.rccmDocumentUrl" target="_blank" class="doc-link">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                              Document RCCM
                            </a>
                          </div>
                        }
                      </div>
                    }

                    <!-- Specialties -->
                    @if (repairer.specialties && repairer.specialties.length) {
                      <div class="detail-section">
                        <div class="section-header">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          <h4>Specialites</h4>
                        </div>
                        <div class="specialties-list">
                          @for (specialty of repairer.specialties; track specialty) {
                            <span class="specialty-chip">{{ specialty }}</span>
                          }
                        </div>
                      </div>
                    }

                    <!-- Shop Photo -->
                    @if (repairer.shopPhotoUrl) {
                      <div class="detail-section">
                        <div class="section-header">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                            <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          <h4>Photo de la boutique</h4>
                        </div>
                        <div class="shop-photo-container">
                          <img [src]="repairer.shopPhotoUrl" alt="Boutique" class="shop-photo" />
                        </div>
                      </div>
                    }

                    <!-- Verification Notes -->
                    @if (repairer.verificationNotes) {
                      <div class="detail-section">
                        <div class="section-header">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          <h4>Notes de verification</h4>
                        </div>
                        <div class="notes-box">
                          <p>{{ repairer.verificationNotes }}</p>
                        </div>
                      </div>
                    }

                    <!-- Meta Info -->
                    <div class="meta-section">
                      <div class="meta-item">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                          <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                        <span>Inscrit le {{ repairer.createdAt | date:'dd/MM/yyyy a HH:mm' }}</span>
                      </div>
                      @if (repairer.verifiedAt) {
                        <div class="meta-item success">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                          <span>Verifie le {{ repairer.verifiedAt | date:'dd/MM/yyyy a HH:mm' }}</span>
                        </div>
                      }
                    </div>

                    <!-- Action Buttons -->
                    <div class="action-buttons">
                      @switch (repairer.verificationStatus) {
                        @case ('pending') {
                          <button class="btn btn-review" (click)="setUnderReview(repairer.id); $event.stopPropagation()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            Mettre en revision
                          </button>
                          <button class="btn btn-success" (click)="openVerifyModal(repairer, 'verified'); $event.stopPropagation()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Valider
                          </button>
                          <button class="btn btn-danger" (click)="openVerifyModal(repairer, 'rejected'); $event.stopPropagation()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            Rejeter
                          </button>
                        }
                        @case ('under_review') {
                          <button class="btn btn-success" (click)="openVerifyModal(repairer, 'verified'); $event.stopPropagation()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Valider
                          </button>
                          <button class="btn btn-danger" (click)="openVerifyModal(repairer, 'rejected'); $event.stopPropagation()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                            Rejeter
                          </button>
                        }
                        @case ('verified') {
                          <button class="btn btn-warning" (click)="openSuspendModal(repairer); $event.stopPropagation()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                              <path d="M4.93 4.93L19.07 19.07" stroke="currentColor" stroke-width="2"/>
                            </svg>
                            Suspendre
                          </button>
                        }
                        @case ('rejected') {
                          <button class="btn btn-success" (click)="openVerifyModal(repairer, 'verified'); $event.stopPropagation()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Revalider
                          </button>
                        }
                        @case ('suspended') {
                          <button class="btn btn-success" (click)="reactivate(repairer.id); $event.stopPropagation()">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                              <path d="M1 4V10H7M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Reactiver
                          </button>
                        }
                      }
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Pagination -->
          @if (total() > repairers().length || page() > 1) {
            <div class="pagination">
              <button
                class="pagination-btn"
                [disabled]="page() <= 1"
                (click)="previousPage()"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                Precedent
              </button>
              <div class="page-indicator">
                <span class="current-page">{{ page() }}</span>
              </div>
              <button
                class="pagination-btn"
                [disabled]="repairers().length < 20"
                (click)="nextPage()"
              >
                Suivant
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          }
        }
      </div>

      <!-- Verify Modal -->
      @if (showVerifyModal()) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header" [class.success]="modalAction() === 'verified'" [class.danger]="modalAction() === 'rejected'">
              <div class="modal-icon">
                @if (modalAction() === 'verified') {
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                } @else {
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                }
              </div>
              <h3>{{ modalAction() === 'verified' ? 'Valider le reparateur' : 'Rejeter le reparateur' }}</h3>
              <button class="close-btn" (click)="closeModals()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="repairer-preview">
                <div class="preview-avatar">
                  {{ getInitials(selectedRepairer()!) }}
                </div>
                <div class="preview-info">
                  <strong>{{ selectedRepairer()?.businessName }}</strong>
                  <span>{{ selectedRepairer()?.user?.firstName }} {{ selectedRepairer()?.user?.lastName }}</span>
                </div>
              </div>
              <div class="form-group">
                <label for="notes">Notes (optionnel)</label>
                <textarea
                  id="notes"
                  [(ngModel)]="verificationNotes"
                  placeholder="Ajouter une note de verification..."
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="closeModals()">Annuler</button>
              <button
                class="btn"
                [class.btn-success]="modalAction() === 'verified'"
                [class.btn-danger]="modalAction() === 'rejected'"
                (click)="confirmVerification()"
                [disabled]="isProcessing()"
              >
                @if (isProcessing()) {
                  <span class="spinner-small"></span>
                }
                {{ modalAction() === 'verified' ? 'Valider' : 'Rejeter' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Suspend Modal -->
      @if (showSuspendModal()) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header warning">
              <div class="modal-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                  <path d="M4.93 4.93L19.07 19.07" stroke="currentColor" stroke-width="2"/>
                </svg>
              </div>
              <h3>Suspendre le reparateur</h3>
              <button class="close-btn" (click)="closeModals()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
            <div class="modal-body">
              <div class="repairer-preview">
                <div class="preview-avatar warning">
                  {{ getInitials(selectedRepairer()!) }}
                </div>
                <div class="preview-info">
                  <strong>{{ selectedRepairer()?.businessName }}</strong>
                  <span>{{ selectedRepairer()?.user?.firstName }} {{ selectedRepairer()?.user?.lastName }}</span>
                </div>
              </div>
              <div class="form-group">
                <label for="reason">Raison de la suspension <span class="required">*</span></label>
                <textarea
                  id="reason"
                  [(ngModel)]="suspendReason"
                  placeholder="Indiquez la raison de la suspension..."
                  rows="3"
                  required
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" (click)="closeModals()">Annuler</button>
              <button
                class="btn btn-warning"
                (click)="confirmSuspend()"
                [disabled]="isProcessing() || !suspendReason.trim()"
              >
                @if (isProcessing()) {
                  <span class="spinner-small"></span>
                }
                Suspendre
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page {
      min-height: 100vh;
      background: #f8f9fa;
    }

    /* Header */
    .admin-header {
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 50%, #FF9800 100%);
      padding: 1.5rem 1rem;
      padding-top: calc(1.5rem + env(safe-area-inset-top, 0));
      position: relative;
      overflow: hidden;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: relative;
      z-index: 1;
    }

    .back-btn {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-decoration: none;
      backdrop-filter: blur(10px);
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .header-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      backdrop-filter: blur(10px);
    }

    .header-text h1 {
      font-size: 1.375rem;
      font-weight: 700;
      color: white;
      margin-bottom: 0.125rem;
    }

    .header-text p {
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.8rem;
    }

    .header-decoration {
      position: absolute;
      top: -50%;
      right: -10%;
      width: 200px;
      height: 200px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    /* Container */
    .admin-container {
      padding: 1rem;
      padding-top: 100px;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Search Section */
    .search-section {
      margin-bottom: 1rem;
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      padding: 0.875rem 1rem;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    }

    .search-bar:focus-within {
      border-color: #FF6B35;
      box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
    }

    .search-bar svg {
      color: #9ca3af;
      flex-shrink: 0;
    }

    .search-bar input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 1rem;
      color: #1f2937;
    }

    .search-bar input::placeholder {
      color: #9ca3af;
    }

    .clear-search {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      border: none;
      background: #f3f4f6;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .clear-search:hover {
      background: #e5e7eb;
      color: #374151;
    }

    /* Status Tabs */
    .status-tabs-container {
      margin-bottom: 1.5rem;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    .status-tabs {
      display: flex;
      gap: 0.5rem;
      padding-bottom: 0.5rem;
    }

    .status-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      background: white;
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;
    }

    .status-tab:hover {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    .status-tab.active {
      background: linear-gradient(135deg, #1f2937, #374151);
      border-color: #1f2937;
      color: white;
    }

    .status-tab.pending.active {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      border-color: #f59e0b;
    }

    .status-tab.review.active {
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
      border-color: #3b82f6;
    }

    .status-tab.verified.active {
      background: linear-gradient(135deg, #10b981, #34d399);
      border-color: #10b981;
    }

    .status-tab.rejected.active {
      background: linear-gradient(135deg, #ef4444, #f87171);
      border-color: #ef4444;
    }

    .status-tab.suspended.active {
      background: linear-gradient(135deg, #6b7280, #9ca3af);
      border-color: #6b7280;
    }

    .tab-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      opacity: 0.5;
    }

    .status-tab.active .tab-dot {
      opacity: 1;
      background: white;
    }

    .tab-count {
      background: rgba(0, 0, 0, 0.08);
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-tab.active .tab-count {
      background: rgba(255, 255, 255, 0.25);
    }

    /* Loading/Error/Empty States */
    .loading-state, .error-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      background: white;
      border-radius: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #FFE5D9;
      border-top-color: #FF6B35;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-icon, .empty-icon {
      color: #FF6B35;
      margin-bottom: 1rem;
      opacity: 0.8;
    }

    .empty-icon {
      color: #d1d5db;
    }

    .error-state p, .empty-state p {
      color: #6b7280;
      margin-bottom: 1.5rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    /* Repairers List */
    .repairers-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .repairer-card {
      background: white;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      transition: all 0.3s ease;
    }

    .repairer-card:hover {
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
    }

    .repairer-card.expanded {
      box-shadow: 0 8px 40px rgba(255, 107, 53, 0.15);
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      cursor: pointer;
      transition: background 0.2s;
    }

    .card-header:hover {
      background: #fafafa;
    }

    .repairer-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 1.125rem;
      overflow: hidden;
      flex-shrink: 0;
    }

    .avatar.verified { background: linear-gradient(135deg, #10b981, #34d399); }
    .avatar.pending { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
    .avatar.under_review { background: linear-gradient(135deg, #3b82f6, #60a5fa); }
    .avatar.rejected { background: linear-gradient(135deg, #ef4444, #f87171); }
    .avatar.suspended { background: linear-gradient(135deg, #6b7280, #9ca3af); }

    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .info-content h3 {
      font-size: 1.0625rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .user-name {
      font-size: 0.875rem;
      color: #4b5563;
    }

    .user-phone {
      font-size: 0.8125rem;
      color: #9ca3af;
    }

    .card-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.875rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: currentColor;
    }

    .status-badge.pending { background: #fef3c7; color: #b45309; }
    .status-badge.under_review { background: #dbeafe; color: #1d4ed8; }
    .status-badge.verified { background: #d1fae5; color: #047857; }
    .status-badge.rejected { background: #fee2e2; color: #b91c1c; }
    .status-badge.suspended { background: #f3f4f6; color: #4b5563; }

    .expand-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: #f3f4f6;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      transition: all 0.2s;
    }

    .expand-btn.expanded {
      background: #FF6B35;
      color: white;
      transform: rotate(180deg);
    }

    /* Card Details */
    .card-details {
      padding: 1.5rem;
      background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
      border-top: 1px solid #f3f4f6;
    }

    .detail-section {
      margin-bottom: 1.75rem;
    }

    .detail-section:last-of-type {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f3f4f6;
    }

    .section-header svg {
      color: #FF6B35;
    }

    .section-header h4 {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #374151;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.875rem;
    }

    @media (min-width: 640px) {
      .detail-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .detail-item {
      background: white;
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid #f3f4f6;
    }

    .detail-item.full {
      grid-column: 1 / -1;
    }

    .detail-label {
      display: block;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.375rem;
    }

    .detail-value {
      font-size: 0.9375rem;
      color: #1f2937;
      font-weight: 500;
    }

    .detail-value.highlight {
      color: #FF6B35;
      font-weight: 600;
    }

    .gps-coords {
      font-family: monospace;
      font-size: 0.8125rem;
      color: #3b82f6;
    }

    .not-provided {
      color: #9ca3af;
      font-style: italic;
    }

    .documents-preview {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .doc-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      color: #2563eb;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
    }

    .doc-link:hover {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      transform: translateY(-2px);
    }

    .specialties-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .specialty-chip {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #FFF4E6, #FFE5D9);
      border: 1px solid #FFD4B8;
      color: #E85A24;
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .shop-photo-container {
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid #f3f4f6;
    }

    .shop-photo {
      width: 100%;
      max-height: 250px;
      object-fit: cover;
      display: block;
    }

    .notes-box {
      background: linear-gradient(135deg, #fffbeb, #fef3c7);
      border: 1px solid #fcd34d;
      padding: 1rem;
      border-radius: 12px;
    }

    .notes-box p {
      font-size: 0.9375rem;
      color: #92400e;
      line-height: 1.6;
    }

    .meta-section {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding: 1rem 0;
      border-top: 1px solid #f3f4f6;
      margin-top: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #6b7280;
    }

    .meta-item svg {
      color: #9ca3af;
    }

    .meta-item.success {
      color: #047857;
    }

    .meta-item.success svg {
      color: #10b981;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 2px solid #f3f4f6;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9375rem;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      color: white;
      box-shadow: 0 4px 14px rgba(255, 107, 53, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);
    }

    .btn-success {
      background: linear-gradient(135deg, #10b981, #34d399);
      color: white;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }

    .btn-success:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
    }

    .btn-danger {
      background: linear-gradient(135deg, #ef4444, #f87171);
      color: white;
      box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
    }

    .btn-danger:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
    }

    .btn-warning {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
      color: white;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
    }

    .btn-warning:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    }

    .btn-review {
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
      color: white;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
    }

    .btn-review:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .btn-outline {
      background: white;
      border: 2px solid #e5e7eb;
      color: #374151;
    }

    .btn-outline:hover:not(:disabled) {
      border-color: #d1d5db;
      background: #f9fafb;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
      padding: 1rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    }

    .pagination-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      background: white;
      color: #374151;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      border-color: #FF6B35;
      color: #FF6B35;
    }

    .pagination-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-indicator {
      padding: 0.5rem 1rem;
    }

    .current-page {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      color: white;
      font-weight: 700;
      border-radius: 10px;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 24px;
      width: 100%;
      max-width: 420px;
      overflow: hidden;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      animation: modalSlideIn 0.3s ease;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem;
      background: linear-gradient(135deg, #374151, #1f2937);
      color: white;
    }

    .modal-header.success {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .modal-header.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .modal-header.warning {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }

    .modal-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-header h3 {
      flex: 1;
      font-size: 1.125rem;
      font-weight: 600;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .modal-body {
      padding: 1.5rem;
    }

    .repairer-preview {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .preview-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
    }

    .preview-avatar.warning {
      background: linear-gradient(135deg, #f59e0b, #fbbf24);
    }

    .preview-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .preview-info strong {
      font-size: 1rem;
      color: #1f2937;
    }

    .preview-info span {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .form-group {
      margin-bottom: 0;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .required {
      color: #ef4444;
    }

    .form-group textarea {
      width: 100%;
      padding: 1rem;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      resize: none;
      font-family: inherit;
      font-size: 0.9375rem;
      transition: all 0.2s;
    }

    .form-group textarea:focus {
      outline: none;
      border-color: #FF6B35;
      box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.1);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem;
      border-top: 1px solid #f3f4f6;
      background: #fafafa;
    }

    .spinner-small {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  `],
})
export class RepairersVerificationComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(true);
  readonly isProcessing = signal(false);
  readonly error = signal<string | null>(null);
  readonly repairers = signal<RepairerForVerification[]>([]);
  readonly stats = signal<VerificationStats | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly statusFilter = signal<StatusFilter>('all');
  readonly expandedId = signal<string | null>(null);

  // Modal states
  readonly showVerifyModal = signal(false);
  readonly showSuspendModal = signal(false);
  readonly selectedRepairer = signal<RepairerForVerification | null>(null);
  readonly modalAction = signal<'verified' | 'rejected'>('verified');

  searchQuery = '';
  verificationNotes = '';
  suspendReason = '';

  private searchTimeout: any;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['status']) {
        this.statusFilter.set(params['status'] as StatusFilter);
      }
      this.loadRepairers();
    });
  }

  async loadRepairers(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);

    try {
      const result = await this.adminService.getRepairers({
        status: this.statusFilter() === 'all' ? undefined : this.statusFilter(),
        page: this.page(),
        limit: 20,
        search: this.searchQuery || undefined,
      });
      this.repairers.set(result.data);
      this.total.set(result.total);
      this.stats.set(result.stats);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement');
    } finally {
      this.isLoading.set(false);
    }
  }

  setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.expandedId.set(null);
    this.router.navigate([], {
      queryParams: { status: status === 'all' ? null : status },
      queryParamsHandling: 'merge',
    });
    this.loadRepairers();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(1);
      this.loadRepairers();
    }, 300);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.page.set(1);
    this.loadRepairers();
  }

  toggleExpand(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  getTotalCount(): number {
    const s = this.stats();
    if (!s) return 0;
    return s.pending + s.underReview + s.verified + s.rejected + s.suspended;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      under_review: 'En revision',
      verified: 'Verifie',
      rejected: 'Rejete',
      suspended: 'Suspendu',
    };
    return labels[status] || status;
  }

  getInitials(repairer: RepairerForVerification | null): string {
    if (!repairer) return 'R';
    if (repairer.user?.firstName && repairer.user?.lastName) {
      return `${repairer.user.firstName[0]}${repairer.user.lastName[0]}`.toUpperCase();
    }
    return repairer.businessName?.substring(0, 2).toUpperCase() || 'R';
  }

  previousPage(): void {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadRepairers();
    }
  }

  nextPage(): void {
    this.page.update((p) => p + 1);
    this.loadRepairers();
  }

  // Actions
  async setUnderReview(id: string): Promise<void> {
    this.isProcessing.set(true);
    try {
      await this.adminService.setRepairerUnderReview(id);
      await this.loadRepairers();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      this.isProcessing.set(false);
    }
  }

  openVerifyModal(repairer: RepairerForVerification, action: 'verified' | 'rejected'): void {
    this.selectedRepairer.set(repairer);
    this.modalAction.set(action);
    this.verificationNotes = '';
    this.showVerifyModal.set(true);
  }

  openSuspendModal(repairer: RepairerForVerification): void {
    this.selectedRepairer.set(repairer);
    this.suspendReason = '';
    this.showSuspendModal.set(true);
  }

  closeModals(): void {
    this.showVerifyModal.set(false);
    this.showSuspendModal.set(false);
    this.selectedRepairer.set(null);
  }

  async confirmVerification(): Promise<void> {
    const repairer = this.selectedRepairer();
    if (!repairer) return;

    this.isProcessing.set(true);
    try {
      await this.adminService.verifyRepairer(repairer.id, {
        status: this.modalAction(),
        notes: this.verificationNotes || undefined,
      });
      this.closeModals();
      await this.loadRepairers();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async confirmSuspend(): Promise<void> {
    const repairer = this.selectedRepairer();
    if (!repairer || !this.suspendReason.trim()) return;

    this.isProcessing.set(true);
    try {
      await this.adminService.suspendRepairer(repairer.id, this.suspendReason);
      this.closeModals();
      await this.loadRepairers();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async reactivate(id: string): Promise<void> {
    this.isProcessing.set(true);
    try {
      await this.adminService.reactivateRepairer(id);
      await this.loadRepairers();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      this.isProcessing.set(false);
    }
  }
}

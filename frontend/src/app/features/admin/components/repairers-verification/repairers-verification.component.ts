import { Component, inject, signal, effect, OnInit, OnDestroy, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService, RepairerForVerification, VerificationStats } from '../../services/admin.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { HeaderSearchComponent } from '../../../../shared/components/header-search/header-search.component';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import {
  UiDataGridComponent,
  UiDataGridColumnComponent,
  DataGridPageEvent,
  DataGridSortEvent,
} from '../../../../shared/components/ui-data-grid';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';
import { StatusLabelsService, VerificationStatus } from '../../../../shared/services/status-labels.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type StatusFilter = 'all' | 'pending' | 'under_review' | 'verified' | 'rejected' | 'suspended';

@Component({
  selector: 'app-repairers-verification',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    HeaderSearchComponent,
    UiHeaderComponent,
    UiDataGridComponent,
    UiDataGridColumnComponent,
    InitialsPipe,
  ],
  template: `
    <div class="admin-page">
      <!-- Header unifié (charte sombre via ui-header) -->
      <ui-header
        title="Réparateurs"
        [subtitle]="total() + ' réparateur(s) au total'"
        [showBack]="true"
        backRoute="/admin"
        [showStatus]="true"
        [showRoleBadge]="true"
        [showProfile]="true"
      >
        <app-header-search
          placeholder="Rechercher un réparateur..."
          (search)="onSearchChange($event)"
          (cleared)="clearSearch()"
        />
      </ui-header>

      <div class="page-content">
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
            <button class="btn btn-primary" (click)="loadRepairers()">Réessayer</button>
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
          <!-- Tableau réutilisable <ui-data-grid> -->
          <ui-data-grid
            [data]="repairers()"
            [pageSize]="10"
            [pageSizeOptions]="[10, 25, 50, 100]"
            [rowClickable]="true"
            emptyMessage="Aucun réparateur ne correspond à ce filtre"
            (rowClick)="openDrawer($event)"
          >
            <ui-data-grid-column key="business" header="Réparateur" field="businessName" [sortable]="true">
              <ng-template let-row>
                <div class="cell-name">
                  <div class="cell-avatar" [class]="row.verificationStatus">
                    @if (row.user?.avatarUrl) {
                      <img [src]="row.user?.avatarUrl" [alt]="row.businessName" />
                    } @else {
                      <span>{{ row.user?.firstName | initials : row.user?.lastName }}</span>
                    }
                  </div>
                  <div class="cell-name-text">
                    <strong>{{ row.businessName || 'Sans nom commercial' }}</strong>
                    <span class="muted">{{ row.user?.firstName }} {{ row.user?.lastName }}</span>
                  </div>
                </div>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="phone" header="Contact" field="user.phone">
              <ng-template let-row>
                <span class="phone">{{ row.user?.phone }}</span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="status" header="Statut" field="verificationStatus" [sortable]="true">
              <ng-template let-row>
                <span class="status-badge" [class]="row.verificationStatus">
                  <span class="badge-dot"></span>
                  {{ statusLabels.getVerificationStatusLabel(row.verificationStatus) }}
                </span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="createdAt" header="Inscription" field="createdAt" [sortable]="true">
              <ng-template let-row>
                <span class="date">{{ row.createdAt | date:'dd/MM/yy' }}</span>
              </ng-template>
            </ui-data-grid-column>

            <ui-data-grid-column key="actions" header="Actions" align="right" width="180px">
              <ng-template let-row>
                <div class="action-buttons-inline" (click)="$event.stopPropagation()">
                  @switch (row.verificationStatus) {
                    @case ('pending') {
                      <button class="icon-btn success" (click)="openVerifyModal(row, 'verified')" title="Valider" aria-label="Valider">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                      <button class="icon-btn danger" (click)="openVerifyModal(row, 'rejected')" title="Rejeter" aria-label="Rejeter">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                      </button>
                      <button class="icon-btn review" (click)="setUnderReview(row.id)" title="Mettre en revision" aria-label="Mettre en revision">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
                      </button>
                    }
                    @case ('under_review') {
                      <button class="icon-btn success" (click)="openVerifyModal(row, 'verified')" title="Valider" aria-label="Valider">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                      <button class="icon-btn danger" (click)="openVerifyModal(row, 'rejected')" title="Rejeter" aria-label="Rejeter">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>
                      </button>
                    }
                    @case ('verified') {
                      <button class="icon-btn warning" (click)="openSuspendModal(row)" title="Suspendre" aria-label="Suspendre">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M4.93 4.93L19.07 19.07" stroke="currentColor" stroke-width="2"/></svg>
                      </button>
                    }
                    @case ('rejected') {
                      <button class="icon-btn success" (click)="openVerifyModal(row, 'verified')" title="Revalider" aria-label="Revalider">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 4V10H7M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                    }
                    @case ('suspended') {
                      <button class="icon-btn success" (click)="reactivate(row.id)" title="Reactiver" aria-label="Reactiver">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 4V10H7M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      </button>
                    }
                  }
                  <button class="icon-btn neutral" (click)="openDrawer(row)" title="Voir les détails" aria-label="Voir les détails">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
                  </button>
                </div>
              </ng-template>
            </ui-data-grid-column>
          </ui-data-grid>
        }
      </div>

      <!-- Drawer latéral : détails complets du réparateur -->
      @if (drawerRepairer(); as r) {
        <div class="drawer-overlay" (click)="closeDrawer()" aria-hidden="true"></div>
        <aside class="drawer" role="dialog" aria-labelledby="drawer-title">
          <header class="drawer-header">
            <div class="drawer-identity">
              <div class="drawer-avatar" [class]="r.verificationStatus">
                @if (r.user?.avatarUrl) {
                  <img [src]="r.user?.avatarUrl" [alt]="r.businessName" />
                } @else {
                  <span>{{ r.user?.firstName | initials : r.user?.lastName }}</span>
                }
              </div>
              <div>
                <h3 id="drawer-title">{{ r.businessName || 'Sans nom commercial' }}</h3>
                <p>{{ r.user?.firstName }} {{ r.user?.lastName }}</p>
                <span class="status-badge" [class]="r.verificationStatus">
                  <span class="badge-dot"></span>
                  {{ statusLabels.getVerificationStatusLabel(r.verificationStatus) }}
                </span>
              </div>
            </div>
            <button class="drawer-close" (click)="closeDrawer()" aria-label="Fermer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </header>

          <div class="drawer-body">
            <!-- Business Info -->
            <section class="detail-section">
              <div class="section-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M19 21V5C19 3.89543 18.1046 3 17 3H7C5.89543 3 5 3.89543 5 5V21M19 21H5M19 21H21M5 21H3M9 7H10M9 11H10M14 7H15M14 11H15M9 21V16C9 15.4477 9.44772 15 10 15H14C14.5523 15 15 15.4477 15 16V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h4>Informations commerciales</h4>
              </div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Type d'activité</span>
                  <span class="detail-value">{{ r.businessType || 'Non spécifié' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Téléphone</span>
                  <span class="detail-value">{{ r.businessPhone || r.user?.phone }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Email</span>
                  <span class="detail-value">{{ r.businessEmail || 'Non spécifié' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Expérience</span>
                  <span class="detail-value highlight">{{ r.yearsOfExperience || 0 }} ans</span>
                </div>
              </div>
            </section>

            <!-- Location -->
            <section class="detail-section">
              <div class="section-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <h4>Localisation</h4>
              </div>
              <div class="detail-grid">
                <div class="detail-item full">
                  <span class="detail-label">Adresse complète</span>
                  <span class="detail-value">{{ r.address || 'Non renseignée' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Ville</span>
                  <span class="detail-value">{{ r.city || 'Non renseignée' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Commune</span>
                  <span class="detail-value">{{ r.commune || 'Non renseignée' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Quartier</span>
                  <span class="detail-value">{{ r.quarter || 'Non renseigné' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Coordonnées GPS</span>
                  <span class="detail-value">
                    @if (r.latitude && r.longitude) {
                      <span class="gps-coords">{{ r.latitude.toFixed(6) }}, {{ r.longitude.toFixed(6) }}</span>
                    } @else {
                      <span class="not-provided">Non renseignées</span>
                    }
                  </span>
                </div>
              </div>
            </section>

            <!-- Identity Documents -->
            <section class="detail-section">
              <div class="section-header">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
                  <circle cx="9" cy="10" r="2" stroke="currentColor" stroke-width="2"/>
                  <path d="M15 8H17M15 12H17M7 16H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <h4>Documents d'identité</h4>
              </div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">Numéro CNI</span>
                  <span class="detail-value">{{ r.nationalIdNumber || 'Non fourni' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Date de naissance</span>
                  <span class="detail-value">{{ r.dateOfBirth || 'Non fournie' }}</span>
                </div>
              </div>
              @if (r.nationalIdFrontUrl || r.nationalIdBackUrl) {
                <div class="documents-preview">
                  @if (r.nationalIdFrontUrl) {
                    <a [href]="r.nationalIdFrontUrl" target="_blank" class="doc-link">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      CNI (recto)
                    </a>
                  }
                  @if (r.nationalIdBackUrl) {
                    <a [href]="r.nationalIdBackUrl" target="_blank" class="doc-link">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      CNI (verso)
                    </a>
                  }
                </div>
              }
            </section>

            <!-- Business Documents -->
            @if (r.rccmNumber || r.taxId) {
              <section class="detail-section">
                <div class="section-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <h4>Documents commerciaux</h4>
                </div>
                <div class="detail-grid">
                  @if (r.rccmNumber) {
                    <div class="detail-item">
                      <span class="detail-label">Numéro RCCM</span>
                      <span class="detail-value">{{ r.rccmNumber }}</span>
                    </div>
                  }
                  @if (r.taxId) {
                    <div class="detail-item">
                      <span class="detail-label">Numéro Contribuable</span>
                      <span class="detail-value">{{ r.taxId }}</span>
                    </div>
                  }
                </div>
                @if (r.rccmDocumentUrl) {
                  <div class="documents-preview">
                    <a [href]="r.rccmDocumentUrl" target="_blank" class="doc-link">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7L15 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                      Document RCCM
                    </a>
                  </div>
                }
              </section>
            }

            <!-- Specialties -->
            @if (r.specialties && r.specialties.length) {
              <section class="detail-section">
                <div class="section-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <h4>Spécialités</h4>
                </div>
                <div class="specialties-list">
                  @for (specialty of r.specialties; track specialty) {
                    <span class="specialty-chip">{{ specialty }}</span>
                  }
                </div>
              </section>
            }

            <!-- Shop Photo -->
            @if (r.shopPhotoUrl) {
              <section class="detail-section">
                <div class="section-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
                    <path d="M21 15L16 10L5 21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <h4>Photo de la boutique</h4>
                </div>
                <div class="shop-photo-container">
                  <img [src]="r.shopPhotoUrl" alt="Boutique" class="shop-photo" />
                </div>
              </section>
            }

            <!-- Verification Notes -->
            @if (r.verificationNotes) {
              <section class="detail-section">
                <div class="section-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <h4>Notes de vérification</h4>
                </div>
                <div class="notes-box">
                  <p>{{ r.verificationNotes }}</p>
                </div>
              </section>
            }

            <!-- Meta Info -->
            <div class="meta-section">
              <div class="meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" stroke-width="2"/>
                  <path d="M16 2V6M8 2V6M3 10H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <span>Inscrit le {{ r.createdAt | date:'dd/MM/yyyy à HH:mm' }}</span>
              </div>
              @if (r.verifiedAt) {
                <div class="meta-item success">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                  <span>Vérifié le {{ r.verifiedAt | date:'dd/MM/yyyy à HH:mm' }}</span>
                </div>
              }
            </div>
          </div>

          <footer class="drawer-footer">
            @switch (r.verificationStatus) {
              @case ('pending') {
                <button class="btn btn-review" (click)="setUnderReview(r.id)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>
                  Mettre en revision
                </button>
                <button class="btn btn-success" (click)="openVerifyModal(r, 'verified')">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Valider
                </button>
                <button class="btn btn-danger" (click)="openVerifyModal(r, 'rejected')">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  Rejeter
                </button>
              }
              @case ('under_review') {
                <button class="btn btn-success" (click)="openVerifyModal(r, 'verified')">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Valider
                </button>
                <button class="btn btn-danger" (click)="openVerifyModal(r, 'rejected')">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                  Rejeter
                </button>
              }
              @case ('verified') {
                <button class="btn btn-warning" (click)="openSuspendModal(r)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M4.93 4.93L19.07 19.07" stroke="currentColor" stroke-width="2"/></svg>
                  Suspendre
                </button>
              }
              @case ('rejected') {
                <button class="btn btn-success" (click)="openVerifyModal(r, 'verified')">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Revalider
                </button>
              }
              @case ('suspended') {
                <button class="btn btn-success" (click)="reactivate(r.id)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M1 4V10H7M23 20V14H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  Reactiver
                </button>
              }
            }
          </footer>
        </aside>
      }

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
                  {{ selectedRepairer()?.user?.firstName | initials : selectedRepairer()?.user?.lastName }}
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
                  {{ selectedRepairer()?.user?.firstName | initials : selectedRepairer()?.user?.lastName }}
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
      background: #FAFAFA;
    }

    /* Container */
    .page-content {
      padding: 1rem;
      padding-top: 180px;
      padding-bottom: 100px;
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
      border: 2px solid #EEEEEE;
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
      border-color: #D1D5DB;
      background: #FAFAFA;
    }

    .status-tab.active {
      background: linear-gradient(135deg, #1f2937, #374151);
      border-color: #1f2937;
      color: white;
    }

    .status-tab.pending.active {
      background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00));
      border-color: var(--color-mustard, #FFC107);
    }

    .status-tab.review.active {
      background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3));
      border-color: var(--color-ocean, #1565C0);
    }

    .status-tab.verified.active {
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-secondary-light, #81C784));
      border-color: var(--color-secondary, #4CAF50);
    }

    .status-tab.rejected.active {
      background: linear-gradient(135deg, var(--color-error, #F44336), #EF5350);
      border-color: var(--color-error, #F44336);
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
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-icon, .empty-icon {
      color: var(--color-primary-500, #FF9800);
      margin-bottom: 1rem;
      opacity: 0.8;
    }

    .empty-icon {
      color: #D1D5DB;
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
      box-shadow: 0 8px 40px rgba(255, 152, 0, 0.15);
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
      background: #FAFAFA;
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
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 1.125rem;
      overflow: hidden;
      flex-shrink: 0;
    }

    .avatar.verified { background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-secondary-light, #81C784)); }
    .avatar.pending { background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00)); }
    .avatar.under_review { background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3)); }
    .avatar.rejected { background: linear-gradient(135deg, var(--color-error, #F44336), #EF5350); }
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

    .status-badge.pending { background: #FFF8E1; color: #F57C00; }
    .status-badge.under_review { background: #E3F2FD; color: var(--color-primary-900, #E65100); }
    .status-badge.verified { background: #E8F5E9; color: #2E7D32; }
    .status-badge.rejected { background: #FFEBEE; color: var(--color-terracotta, #C62828); }
    .status-badge.suspended { background: #F5F5F5; color: #4b5563; }

    .expand-btn {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #F5F5F5;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9ca3af;
      transition: all 0.2s;
    }

    .expand-btn.expanded {
      background: var(--color-primary-500, #FF9800);
      color: white;
      transform: rotate(180deg);
    }

    /* Card Details */
    .card-details {
      padding: 1.5rem;
      background: linear-gradient(180deg, #FAFAFA 0%, #ffffff 100%);
      border-top: 1px solid #F5F5F5;
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
      border-bottom: 2px solid #F5F5F5;
    }

    .section-header svg {
      color: var(--color-primary-500, #FF9800);
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
      border: 1px solid #F5F5F5;
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
      color: var(--color-primary-500, #FF9800);
      font-weight: 600;
    }

    .gps-coords {
      font-family: monospace;
      font-size: 0.8125rem;
      color: var(--color-ocean, #1565C0);
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
      background: linear-gradient(135deg, #E3F2FD, #E3F2FD);
      color: var(--color-primary-500, #FF9800);
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
    }

    .doc-link:hover {
      background: linear-gradient(135deg, #E3F2FD, #BBDEFB);
      transform: translateY(-2px);
    }

    .specialties-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .specialty-chip {
      padding: 0.5rem 1rem;
      background: linear-gradient(135deg, #FFF3E0, #FFE5D9);
      border: 1px solid #FFD4B8;
      color: var(--color-primary-900, #E65100);
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .shop-photo-container {
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid #F5F5F5;
    }

    .shop-photo {
      width: 100%;
      max-height: 250px;
      object-fit: cover;
      display: block;
    }

    .notes-box {
      background: linear-gradient(135deg, #FFF8E1, #FFF8E1);
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
      border-top: 1px solid #F5F5F5;
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
      color: #2E7D32;
    }

    .meta-item.success svg {
      color: var(--color-secondary, #4CAF50);
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 2px solid #F5F5F5;
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
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      box-shadow: 0 4px 14px rgba(255, 152, 0, 0.3);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 152, 0, 0.4);
    }

    .btn-success {
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-secondary-light, #81C784));
      color: white;
      box-shadow: 0 4px 14px rgba(76, 175, 80, 0.3);
    }

    .btn-success:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
    }

    .btn-danger {
      background: linear-gradient(135deg, var(--color-error, #F44336), #EF5350);
      color: white;
      box-shadow: 0 4px 14px rgba(244, 67, 54, 0.3);
    }

    .btn-danger:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(244, 67, 54, 0.4);
    }

    .btn-warning {
      background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00));
      color: white;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
    }

    .btn-warning:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
    }

    .btn-review {
      background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3));
      color: white;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
    }

    .btn-review:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .btn-outline {
      background: white;
      border: 2px solid #EEEEEE;
      color: #374151;
    }

    .btn-outline:hover:not(:disabled) {
      border-color: #D1D5DB;
      background: #FAFAFA;
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
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      background: white;
      color: #374151;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pagination-btn:hover:not(:disabled) {
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
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
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      font-weight: 700;
      border-radius: 12px;
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
      background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-success-dark, #2E7D32));
    }

    .modal-header.danger {
      background: linear-gradient(135deg, var(--color-error, #F44336), var(--color-terracotta, #C62828));
    }

    .modal-header.warning {
      background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00));
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
      border-radius: 12px;
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
      background: #FAFAFA;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }

    .preview-avatar {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
    }

    .preview-avatar.warning {
      background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00));
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
      color: var(--color-error, #F44336);
    }

    .form-group textarea {
      width: 100%;
      padding: 1rem;
      border: 2px solid #EEEEEE;
      border-radius: 12px;
      resize: none;
      font-family: inherit;
      font-size: 0.9375rem;
      transition: all 0.2s;
    }

    .form-group textarea:focus {
      outline: none;
      border-color: var(--color-primary-500, #FF9800);
      box-shadow: 0 0 0 4px rgba(255, 152, 0, 0.1);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem;
      border-top: 1px solid #F5F5F5;
      background: #FAFAFA;
    }

    .spinner-small {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    /* ============================================================
       Cellules custom du <ui-data-grid>
       ============================================================ */
    .cell-name {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }

    .cell-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      font-weight: 700;
      font-size: 0.8125rem;
      overflow: hidden;
    }

    .cell-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .cell-avatar.verified  { background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-success-dark, #2E7D32)); }
    .cell-avatar.pending   { background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00)); }
    .cell-avatar.under_review { background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3)); }
    .cell-avatar.rejected  { background: linear-gradient(135deg, var(--color-error, #F44336), #EF5350); }
    .cell-avatar.suspended { background: linear-gradient(135deg, #6b7280, #9ca3af); }

    .cell-name-text {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .cell-name-text strong {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .cell-name-text .muted {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .phone {
      font-variant-numeric: tabular-nums;
      color: #4b5563;
    }

    .date {
      color: #6b7280;
      font-size: 0.8125rem;
    }

    /* Action buttons inline (icon-only) */
    .action-buttons-inline {
      display: inline-flex;
      gap: 0.25rem;
      justify-content: flex-end;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: #6b7280;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .icon-btn:hover {
      background: #F5F5F5;
    }

    .icon-btn:focus-visible {
      outline: 2px solid var(--color-primary-500, #FF9800);
      outline-offset: 1px;
    }

    .icon-btn.success { color: var(--color-secondary, #4CAF50); }
    .icon-btn.success:hover { background: #E8F5E9; }

    .icon-btn.danger { color: var(--color-error, #F44336); }
    .icon-btn.danger:hover { background: #FFEBEE; }

    .icon-btn.warning { color: var(--color-warning-dark, #F57C00); }
    .icon-btn.warning:hover { background: #FFF3E0; }

    .icon-btn.review { color: var(--color-ocean, #1565C0); }
    .icon-btn.review:hover { background: #E3F2FD; }

    .icon-btn.neutral { color: #6b7280; }
    .icon-btn.neutral:hover { background: #F5F5F5; color: var(--color-primary-500, #FF9800); }

    /* ============================================================
       Drawer latéral (détails du réparateur)
       ============================================================ */
    .drawer-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      z-index: 1100;
      animation: drawer-fade-in 0.2s ease;
    }

    @keyframes drawer-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }

    .drawer {
      position: fixed;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(560px, 100vw);
      background: white;
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.18);
      z-index: 1101;
      display: flex;
      flex-direction: column;
      animation: drawer-slide-in 0.25s ease;
    }

    @keyframes drawer-slide-in {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    .drawer-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem;
      border-bottom: 1px solid #F5F5F5;
      background: linear-gradient(135deg, #FFFAF3 0%, #FFF3E0 100%);
    }

    .drawer-identity {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      flex: 1;
      min-width: 0;
    }

    .drawer-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      font-weight: 700;
      font-size: 1.125rem;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(255, 152, 0, 0.25);
    }

    .drawer-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .drawer-avatar.verified  { background: linear-gradient(135deg, var(--color-secondary, #4CAF50), var(--color-success-dark, #2E7D32)); box-shadow: 0 4px 12px rgba(76, 175, 80, 0.25); }
    .drawer-avatar.pending   { background: linear-gradient(135deg, var(--color-mustard, #FFC107), var(--color-primary-700, #F57C00)); }
    .drawer-avatar.under_review { background: linear-gradient(135deg, var(--color-ocean, #1565C0), var(--color-ocean-500, #2196F3)); box-shadow: 0 4px 12px rgba(21, 101, 192, 0.25); }
    .drawer-avatar.rejected  { background: linear-gradient(135deg, var(--color-error, #F44336), #EF5350); box-shadow: 0 4px 12px rgba(244, 67, 54, 0.25); }
    .drawer-avatar.suspended { background: linear-gradient(135deg, #6b7280, #9ca3af); box-shadow: 0 4px 12px rgba(107, 114, 128, 0.25); }

    .drawer-identity h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 0.125rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .drawer-identity p {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0 0 0.5rem;
    }

    .drawer-close {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.05);
      color: #6b7280;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.15s ease;
    }

    .drawer-close:hover {
      background: rgba(0, 0, 0, 0.1);
      color: #1f2937;
    }

    .drawer-body {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overscroll-behavior: contain;
      scroll-padding-bottom: 1rem;
      padding: 1.25rem 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Scrollbar visible sur Webkit (Chrome, Edge, Safari) */
    .drawer-body::-webkit-scrollbar {
      width: 10px;
    }

    .drawer-body::-webkit-scrollbar-track {
      background: #FAFAFA;
    }

    .drawer-body::-webkit-scrollbar-thumb {
      background: #D1D5DB;
      border-radius: 6px;
      border: 2px solid #FAFAFA;
    }

    .drawer-body::-webkit-scrollbar-thumb:hover {
      background: var(--color-primary-500, #FF9800);
    }

    /* Firefox */
    .drawer-body {
      scrollbar-width: thin;
      scrollbar-color: #D1D5DB #FAFAFA;
    }

    .drawer-footer {
      display: flex;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
      border-top: 1px solid #F5F5F5;
      background: white;
      flex-wrap: wrap;
    }

    .drawer-footer .btn {
      flex: 1;
      min-width: 0;
    }

    @media (max-width: 640px) {
      .drawer {
        width: 100vw;
      }
    }
  `],
})
export class RepairersVerificationComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly authStore = inject(AuthStore);
  readonly statusLabels = inject(StatusLabelsService);

  readonly isLoading = signal(true);
  readonly isProcessing = signal(false);
  readonly error = signal<string | null>(null);
  readonly repairers = signal<RepairerForVerification[]>([]);
  readonly stats = signal<VerificationStats | null>(null);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly statusFilter = signal<StatusFilter>('all');

  // Drawer (remplace l'expand inline)
  readonly drawerRepairer = signal<RepairerForVerification | null>(null);

  // Modal states
  readonly showVerifyModal = signal(false);
  readonly showSuspendModal = signal(false);
  readonly selectedRepairer = signal<RepairerForVerification | null>(null);
  readonly modalAction = signal<'verified' | 'rejected'>('verified');

  searchQuery = '';
  verificationNotes = '';
  suspendReason = '';

  constructor() {
    // Lock le scroll de la page derrière quand le drawer est ouvert.
    effect(() => {
      const open = this.drawerRepairer() !== null;
      document.body.classList.toggle('drawer-scroll-locked', open);
    });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        if (params['status']) {
          this.statusFilter.set(params['status'] as StatusFilter);
        }
        this.loadRepairers();
      });
  }

  ngOnDestroy(): void {
    document.body.classList.remove('drawer-scroll-locked');
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
    this.drawerRepairer.set(null);
    this.router.navigate([], {
      queryParams: { status: status === 'all' ? null : status },
      queryParamsHandling: 'merge',
    });
    this.loadRepairers();
  }

  // Drawer
  openDrawer(repairer: RepairerForVerification): void {
    this.drawerRepairer.set(repairer);
  }

  closeDrawer(): void {
    this.drawerRepairer.set(null);
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.page.set(1);
    this.loadRepairers();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.page.set(1);
    this.loadRepairers();
  }

  getTotalCount(): number {
    const s = this.stats();
    if (!s) return 0;
    return s.pending + s.underReview + s.verified + s.rejected + s.suspended;
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
      this.closeDrawer();
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
      this.closeDrawer();
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
      this.closeDrawer();
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
      this.closeDrawer();
      await this.loadRepairers();
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      this.isProcessing.set(false);
    }
  }

}

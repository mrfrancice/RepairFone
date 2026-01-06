import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RepairerService, RepairerRequest, RequestFilterStatus } from '../../services/repairer.service';
import { RepairerStore } from '../../stores/repairer.store';
import { ChipVariant } from '../../../../shared/components/ui-chip/ui-chip.component';
import { AuthStore } from '../../../../core/stores/auth.store';
import { NotificationBellComponent } from '../../../../shared/components/notification-bell/notification-bell.component';
import { HeaderSearchComponent } from '../../../../shared/components/header-search/header-search.component';

@Component({
  selector: 'app-request-management',
  standalone: true,
  imports: [
    CommonModule,
    NotificationBellComponent,
    HeaderSearchComponent,
  ],
  template: `
    <div class="request-management">
      <!-- Header like home -->
      <header class="dashboard-header">
        <div class="header-top">
          <div class="header-left">
            <div class="logo-section">
              <div class="logo-icon">
                <svg viewBox="0 0 32 32" fill="none">
                  <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4z" fill="white"/>
                  <path d="M20 11l-2 2m0 0l-2-2m2 2v6m-4 2h8" stroke="#FF6B35" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="header-titles">
                <h1 class="app-title">RepairFone</h1>
                <p class="welcome-msg">{{ getGreeting() }}, {{ getUserName() }}</p>
              </div>
            </div>
          </div>
          <div class="header-right">
            <button class="location-chip" (click)="detectLocation(); $event.stopPropagation()">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 8.667a2 2 0 100-4 2 2 0 000 4z" stroke="currentColor" stroke-width="1.5"/>
                <path d="M8 14s5-3.5 5-7.333a5 5 0 10-10 0C3 10.5 8 14 8 14z" stroke="currentColor" stroke-width="1.5"/>
              </svg>
              @if (locationStatus() === 'loading') {
                <span>...</span>
              } @else if (locationStatus() === 'success') {
                <span>{{ getShortAddress() }}</span>
              } @else {
                <span>Localiser</span>
              }
            </button>
            <span class="status-online">
              <span class="status-dot"></span>
              En ligne
            </span>
            <span class="role-badge">{{ getRoleLabel() }}</span>
            <app-notification-bell />
            <button class="profile-btn" (click)="goToProfile()">
              @if (authStore.user()?.avatarUrl) {
                <img [src]="authStore.user()?.avatarUrl" alt="Profil" />
              } @else {
                <div class="profile-placeholder">
                  {{ getInitialsUser() }}
                </div>
              }
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <app-header-search
          placeholder="Rechercher une demande..."
          (search)="onSearchChange($event)"
        />
      </header>

      <div class="page-content">
        <!-- Stats Cards -->
        <div class="stats-row">
          <div class="stat-card new" (click)="setFilter('new')">
            <span class="stat-icon">🆕</span>
            <div class="stat-info">
              <span class="stat-value">{{ store.newRequestsCount() }}</span>
              <span class="stat-label">Nouvelles</span>
            </div>
          </div>
          <div class="stat-card progress" (click)="setFilter('in_progress')">
            <span class="stat-icon">🔧</span>
            <div class="stat-info">
              <span class="stat-value">{{ getInProgressCount() }}</span>
              <span class="stat-label">En cours</span>
            </div>
          </div>
          <div class="stat-card done" (click)="setFilter('completed')">
            <span class="stat-icon">✅</span>
            <div class="stat-info">
              <span class="stat-value">{{ getCompletedCount() }}</span>
              <span class="stat-label">Terminées</span>
            </div>
          </div>
        </div>

        <!-- Filters -->
        <div class="filters-section">
          <h3 class="filters-title">Filtrer par statut</h3>
          <div class="filters">
            @for (filter of filters; track filter.value) {
              <button
                class="filter-chip"
                [class.active]="store.requestFilter() === filter.value"
                (click)="setFilter(filter.value)"
              >
                <span class="filter-icon">{{ getFilterIcon(filter.value) }}</span>
                {{ filter.label }}
                @if (filter.count !== undefined && filter.count > 0) {
                  <span class="filter-count">{{ filter.count }}</span>
                }
              </button>
            }
          </div>
        </div>

        <!-- Loading -->
        @if (isLoading()) {
          <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Chargement des demandes...</p>
          </div>
        }

        <!-- Empty state -->
        @if (!isLoading() && store.filteredRequests().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>Aucune demande</h3>
            <p>{{ getEmptyMessage() }}</p>
          </div>
        }

        <!-- Request list -->
        @if (!isLoading() && store.filteredRequests().length > 0) {
          <div class="requests-list">
            @for (request of store.filteredRequests(); track request.id) {
              <div class="request-card" (click)="openRequest(request)">
                <!-- Card Header -->
                <div class="card-header">
                  <div class="device-wrapper">
                    <div class="device-icon-box">
                      <span>{{ getDeviceIcon(request.device?.type || '') }}</span>
                    </div>
                    <div class="device-info">
                      <h4 class="device-name">
                        {{ request.device?.brand || 'Appareil' }} {{ request.device?.model || '' }}
                      </h4>
                      <span class="service-type">🔧 {{ request.serviceType?.name || 'Service' }}</span>
                    </div>
                  </div>
                  <div class="badges">
                    @if (request.urgency === 'express') {
                      <span class="badge express">⚡ Express</span>
                    }
                    <span class="badge status" [attr.data-status]="request.status">
                      {{ getStatusLabel(request.status) }}
                    </span>
                  </div>
                </div>

                <!-- Problem Description -->
                @if (request.problemDescription) {
                  <div class="problem-section">
                    <p class="problem-text">{{ request.problemDescription | slice:0:100 }}{{ request.problemDescription && request.problemDescription.length > 100 ? '...' : '' }}</p>
                  </div>
                }

                <!-- Photos Preview -->
                @if (request.photos && request.photos.length > 0) {
                  <div class="photos-row">
                    @for (photo of request.photos.slice(0, 4); track $index) {
                      <div class="photo-thumb">
                        <img [src]="photo" alt="Photo" />
                      </div>
                    }
                    @if (request.photos.length > 4) {
                      <div class="photo-thumb more">+{{ request.photos.length - 4 }}</div>
                    }
                  </div>
                }

                <!-- Meta Info -->
                <div class="meta-row">
                  <div class="meta-item">
                    <span class="meta-icon">📍</span>
                    <span>{{ request.distance?.toFixed(1) || '?' }} km</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">{{ request.serviceMode === 'home' ? '🏠' : '🏪' }}</span>
                    <span>{{ request.serviceMode === 'home' ? 'Domicile' : 'Boutique' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="meta-icon">🕐</span>
                    <span>{{ getTimeAgo(request.createdAt) }}</span>
                  </div>
                </div>

                <!-- Client + Actions -->
                <div class="card-footer">
                  @if (request.client) {
                    <div class="client-info">
                      <div class="client-avatar">
                        {{ getInitials(request.client.firstName, request.client.lastName) }}
                      </div>
                      <span class="client-name">
                        {{ request.client.firstName }} {{ request.client.lastName?.charAt(0) }}.
                      </span>
                    </div>
                  }
                  <div class="action-buttons">
                    @switch (request.status) {
                      @case ('pending') {
                        <button class="btn btn-outline" (click)="rejectRequest(request, $event)">
                          Refuser
                        </button>
                        <button class="btn btn-primary" (click)="acceptRequest(request, $event)">
                          ✓ Accepter
                        </button>
                      }
                      @case ('accepted') {
                        <button class="btn btn-primary" (click)="createQuote(request, $event)">
                          📝 Créer devis
                        </button>
                      }
                      @case ('quote_sent') {
                        <span class="status-badge info">⏳ Devis envoyé</span>
                      }
                      @case ('quote_accepted') {
                        <button class="btn btn-primary" (click)="startRepair(request, $event)">
                          🔧 Commencer
                        </button>
                      }
                      @case ('in_progress') {
                        <button class="btn btn-success" (click)="completeRepair(request, $event)">
                          ✅ Terminer
                        </button>
                      }
                    }
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Load more -->
          @if (hasMore()) {
            <div class="load-more">
              <button class="btn btn-outline-full" [disabled]="isLoadingMore()" (click)="loadMore()">
                @if (isLoadingMore()) {
                  <span class="btn-spinner"></span> Chargement...
                } @else {
                  Charger plus de demandes
                }
              </button>
            </div>
          }
        }
      </div>

      <!-- Request Detail Modal -->
      @if (selectedRequest()) {
        <div class="modal-overlay" (click)="closeDetail()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Détails de la demande</h2>
              <button class="close-btn" (click)="closeDetail()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <!-- Device Info -->
              <div class="detail-device-card">
                <div class="detail-device-icon">
                  {{ getDeviceIcon(selectedRequest()?.device?.type || '') }}
                </div>
                <div class="detail-device-info">
                  <h3>{{ selectedRequest()?.device?.brand || 'Appareil' }} {{ selectedRequest()?.device?.model || '' }}</h3>
                  <span class="detail-service">🔧 {{ selectedRequest()?.serviceType?.name || 'Service' }}</span>
                </div>
                @if (selectedRequest()?.urgency === 'express') {
                  <span class="express-tag">⚡ Express</span>
                }
              </div>

              <!-- Problem -->
              <div class="detail-section">
                <h4>📝 Description du problème</h4>
                <p class="detail-problem">{{ selectedRequest()?.problemDescription || 'Aucune description' }}</p>
              </div>

              <!-- Photos -->
              @if (selectedRequest()?.photos && selectedRequest()!.photos!.length > 0) {
                <div class="detail-section">
                  <h4>📷 Photos</h4>
                  <div class="detail-photos">
                    @for (photo of selectedRequest()!.photos; track $index) {
                      <img [src]="photo" alt="Photo" (click)="openPhoto(photo)" />
                    }
                  </div>
                </div>
              }

              <!-- Details Grid -->
              <div class="detail-section">
                <h4>ℹ️ Informations</h4>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-icon">{{ selectedRequest()?.serviceMode === 'home' ? '🏠' : '🏪' }}</span>
                    <div class="info-content">
                      <span class="info-label">Mode</span>
                      <span class="info-value">{{ selectedRequest()?.serviceMode === 'home' ? 'À domicile' : 'En boutique' }}</span>
                    </div>
                  </div>
                  <div class="info-item">
                    <span class="info-icon">📍</span>
                    <div class="info-content">
                      <span class="info-label">Distance</span>
                      <span class="info-value">{{ selectedRequest()?.distance?.toFixed(1) || '?' }} km</span>
                    </div>
                  </div>
                  <div class="info-item">
                    <span class="info-icon">📅</span>
                    <div class="info-content">
                      <span class="info-label">Date</span>
                      <span class="info-value">{{ formatDate(selectedRequest()!.createdAt) }}</span>
                    </div>
                  </div>
                  <div class="info-item">
                    <span class="info-icon">⚡</span>
                    <div class="info-content">
                      <span class="info-label">Urgence</span>
                      <span class="info-value" [class.text-orange]="selectedRequest()?.urgency === 'express'">
                        {{ selectedRequest()?.urgency === 'express' ? 'Express (+30%)' : 'Normal' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Client -->
              @if (selectedRequest()?.client) {
                <div class="detail-section">
                  <h4>👤 Client</h4>
                  <div class="client-card-modal">
                    <div class="client-avatar-lg">
                      {{ getInitials(selectedRequest()!.client!.firstName, selectedRequest()!.client!.lastName) }}
                    </div>
                    <div class="client-details">
                      <span class="client-fullname">
                        {{ selectedRequest()!.client!.firstName }} {{ selectedRequest()!.client!.lastName }}
                      </span>
                      @if (selectedRequest()!.status !== 'pending' && selectedRequest()!.client!.phone) {
                        <a href="tel:{{ selectedRequest()!.client!.phone }}" class="client-phone">
                          📞 {{ selectedRequest()!.client!.phone }}
                        </a>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Modal Actions -->
            <div class="modal-actions">
              @switch (selectedRequest()!.status) {
                @case ('pending') {
                  <button class="btn btn-outline-modal" (click)="rejectRequest(selectedRequest()!)">
                    ✕ Refuser
                  </button>
                  <button class="btn btn-primary-modal" (click)="acceptRequest(selectedRequest()!)">
                    ✓ Accepter la demande
                  </button>
                }
                @case ('accepted') {
                  <button class="btn btn-primary-modal full" (click)="createQuote(selectedRequest()!)">
                    📝 Créer un devis
                  </button>
                }
                @case ('quote_accepted') {
                  <button class="btn btn-primary-modal full" (click)="startRepair(selectedRequest()!)">
                    🔧 Commencer la réparation
                  </button>
                }
                @case ('in_progress') {
                  <button class="btn btn-success-modal full" (click)="completeRepair(selectedRequest()!)">
                    ✅ Marquer comme terminé
                  </button>
                }
              }
            </div>
          </div>
        </div>
      }

      <!-- Photo Modal -->
      @if (selectedPhoto()) {
        <div class="photo-modal" (click)="selectedPhoto.set(null)">
          <button class="photo-close">✕</button>
          <img [src]="selectedPhoto()" />
        </div>
      }
    </div>
  `,
  styles: [`
    .request-management {
      min-height: 100vh;
      background: #f8fafc;
    }

    /* Dashboard Header */
    .dashboard-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: linear-gradient(135deg, #FF6B35 0%, #E85A24 100%);
      padding: 1.25rem 1.25rem 1.75rem;
      padding-top: calc(1.25rem + env(safe-area-inset-top, 0));
      border-radius: 0 0 24px 24px;
      box-shadow: 0 4px 20px rgba(255, 107, 53, 0.3);
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }

    .header-left {
      display: flex;
      align-items: center;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.15);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .logo-icon svg {
      width: 28px;
      height: 28px;
    }

    .header-titles {
      display: flex;
      flex-direction: column;
    }

    .app-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      margin: 0;
      line-height: 1.2;
    }

    .welcome-msg {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-online {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      background: rgba(16, 185, 129, 0.2);
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #ecfdf5;
      backdrop-filter: blur(4px);
    }

    .status-online .status-dot {
      width: 8px;
      height: 8px;
      background: #10b981;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .platform-badge {
      padding: 0.375rem 0.75rem;
      background: white;
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #FF6B35;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .role-badge {
      padding: 0.375rem 0.75rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: white;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      backdrop-filter: blur(4px);
    }

    .profile-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.1);
      overflow: hidden;
      cursor: pointer;
      padding: 0;
      transition: all 0.2s;
    }

    .profile-btn:hover {
      border-color: rgba(255, 255, 255, 0.5);
      transform: scale(1.05);
    }

    .profile-btn img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .profile-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
      background: rgba(255, 255, 255, 0.15);
    }

    /* Location Chip */
    .location-chip {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.625rem;
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      color: white;
      font-size: 0.6875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
      max-width: 120px;
    }

    .location-chip:hover {
      background: rgba(255, 255, 255, 0.25);
    }

    .location-chip svg {
      flex-shrink: 0;
      opacity: 0.9;
    }

    .location-chip span {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .page-content {
      padding: 1rem;
      padding-top: 180px;
      padding-bottom: 100px;
    }

    /* Stats Row */
    .stats-row {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .stat-card {
      flex: 1;
      background: white;
      border-radius: 1rem;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      cursor: pointer;
      transition: all 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .stat-icon {
      font-size: 1.5rem;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.6875rem;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .stat-card.new { border-left: 4px solid #f59e0b; }
    .stat-card.progress { border-left: 4px solid #3b82f6; }
    .stat-card.done { border-left: 4px solid #10b981; }

    /* Filters */
    .filters-section {
      margin-bottom: 1rem;
    }

    .filters-title {
      font-size: 0.75rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 0.75rem 0;
    }

    .filters {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      -webkit-overflow-scrolling: touch;
    }

    .filters::-webkit-scrollbar {
      display: none;
    }

    .filter-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.625rem 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 2rem;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #64748b;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-chip:hover {
      border-color: #FF6B35;
      color: #FF6B35;
    }

    .filter-chip.active {
      background: linear-gradient(135deg, #FF6B35, #FF8F5C);
      border-color: transparent;
      color: white;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    }

    .filter-icon {
      font-size: 0.875rem;
    }

    .filter-count {
      background: rgba(255,255,255,0.3);
      padding: 0.125rem 0.5rem;
      border-radius: 1rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    /* Loading & Empty */
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem 1rem;
      color: #64748b;
    }

    .loading-spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #ffe4d6;
      border-top-color: #FF6B35;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      background: white;
      border-radius: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .empty-state p {
      color: #64748b;
      margin: 0;
    }

    /* Request Cards */
    .requests-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .request-card {
      background: white;
      border-radius: 1rem;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .request-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .device-wrapper {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .device-icon-box {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #fff5f2, #ffe8e0);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      border: 2px solid rgba(255, 107, 53, 0.15);
    }

    .device-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .device-name {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .service-type {
      font-size: 0.8125rem;
      color: #FF6B35;
      font-weight: 500;
    }

    .badges {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.375rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.375rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge.express {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #b45309;
    }

    .badge.status {
      background: #f1f5f9;
      color: #64748b;
    }

    .badge.status[data-status="pending"] {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #b45309;
    }

    .badge.status[data-status="accepted"] {
      background: linear-gradient(135deg, #fff7ed, #ffedd5);
      color: #FF6B35;
    }

    .badge.status[data-status="in_progress"] {
      background: linear-gradient(135deg, #dbeafe, #bfdbfe);
      color: #1d4ed8;
    }

    .badge.status[data-status="completed"] {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      color: #15803d;
    }

    .badge.status[data-status="delivered"] {
      background: linear-gradient(135deg, #dcfce7, #bbf7d0);
      color: #15803d;
    }

    .badge.status[data-status="rejected"] {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
      color: #991b1b;
    }

    .problem-section {
      margin-bottom: 1rem;
    }

    .problem-text {
      font-size: 0.875rem;
      color: #475569;
      line-height: 1.5;
      margin: 0;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
    }

    .photos-row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .photo-thumb {
      width: 56px;
      height: 56px;
      border-radius: 0.75rem;
      overflow: hidden;
    }

    .photo-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-thumb.more {
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
      color: #64748b;
    }

    .meta-row {
      display: flex;
      gap: 1rem;
      padding: 0.75rem 0;
      border-top: 1px solid #f1f5f9;
      margin-bottom: 0.75rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .meta-icon {
      font-size: 1rem;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
    }

    .client-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .client-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF6B35, #FF8F5C);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .client-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1e293b;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.625rem 1rem;
      border-radius: 0.75rem;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }

    .btn-outline {
      background: white;
      border: 2px solid #e2e8f0;
      color: #64748b;
    }

    .btn-outline:hover {
      border-color: #cbd5e1;
      color: #475569;
    }

    .btn-primary {
      background: linear-gradient(135deg, #FF6B35, #FF8F5C);
      color: white;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
    }

    .btn-success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 0.875rem;
      border-radius: 0.5rem;
      font-size: 0.8125rem;
      font-weight: 500;
    }

    .status-badge.info {
      background: #dbeafe;
      color: #1d4ed8;
    }

    /* Load More */
    .load-more {
      padding: 1rem 0;
    }

    .btn-outline-full {
      width: 100%;
      padding: 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 1rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-outline-full:hover:not(:disabled) {
      border-color: #FF6B35;
      color: #FF6B35;
    }

    .btn-outline-full:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .btn-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #e2e8f0;
      border-top-color: #FF6B35;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: flex-end;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 1.5rem 1.5rem 0 0;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      border-bottom: 1px solid #f1f5f9;
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
    }

    .modal-header h2 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #f1f5f9;
      border: none;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .modal-body {
      padding: 1.25rem;
    }

    .detail-device-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #fff5f2, #ffe8e0);
      border-radius: 1rem;
      margin-bottom: 1.5rem;
    }

    .detail-device-icon {
      font-size: 2.5rem;
    }

    .detail-device-info {
      flex: 1;
    }

    .detail-device-info h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem 0;
    }

    .detail-service {
      font-size: 0.875rem;
      color: #FF6B35;
      font-weight: 500;
    }

    .express-tag {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #b45309;
      padding: 0.375rem 0.75rem;
      border-radius: 2rem;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .detail-section {
      margin-bottom: 1.5rem;
    }

    .detail-section h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 0.75rem 0;
    }

    .detail-problem {
      font-size: 0.9375rem;
      color: #475569;
      line-height: 1.6;
      margin: 0;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 1px solid #e2e8f0;
    }

    .detail-photos {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }

    .detail-photos img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 0.75rem;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .detail-photos img:hover {
      transform: scale(1.05);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 0.75rem;
    }

    .info-icon {
      font-size: 1.25rem;
    }

    .info-content {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 0.6875rem;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .info-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
    }

    .text-orange {
      color: #FF6B35 !important;
    }

    .client-card-modal {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 1rem;
    }

    .client-avatar-lg {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF6B35, #FF8F5C);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 700;
    }

    .client-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .client-fullname {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
    }

    .client-phone {
      font-size: 0.875rem;
      color: #FF6B35;
      text-decoration: none;
      font-weight: 500;
    }

    .modal-actions {
      display: flex;
      gap: 0.75rem;
      padding: 1.25rem;
      border-top: 1px solid #f1f5f9;
      background: white;
      position: sticky;
      bottom: 0;
    }

    .btn-outline-modal {
      flex: 1;
      padding: 1rem;
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-outline-modal:hover {
      border-color: #ef4444;
      color: #ef4444;
    }

    .btn-primary-modal {
      flex: 1;
      padding: 1rem;
      background: linear-gradient(135deg, #FF6B35, #FF8F5C);
      border: none;
      border-radius: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: white;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
      transition: all 0.2s;
    }

    .btn-primary-modal:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
    }

    .btn-primary-modal.full,
    .btn-success-modal.full {
      flex: unset;
      width: 100%;
    }

    .btn-success-modal {
      flex: 1;
      padding: 1rem;
      background: linear-gradient(135deg, #10b981, #059669);
      border: none;
      border-radius: 0.75rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: white;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      transition: all 0.2s;
    }

    /* Photo Modal */
    .photo-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1100;
    }

    .photo-modal img {
      max-width: 100%;
      max-height: 90vh;
      object-fit: contain;
      border-radius: 0.75rem;
    }

    .photo-close {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
    }

    /* Responsive */
    @media (max-width: 400px) {
      .stats-row {
        flex-direction: column;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RequestManagementComponent implements OnInit {
  readonly repairerService = inject(RepairerService);
  readonly store = inject(RepairerStore);
  readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isLoading = signal(false);
  readonly isLoadingMore = signal(false);
  readonly hasMore = signal(false);
  readonly selectedRequest = signal<RepairerRequest | null>(null);
  readonly selectedPhoto = signal<string | null>(null);
  readonly locationStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  readonly userAddress = signal<string>('Abidjan, Cote d\'Ivoire');

  searchQuery = '';
  private page = 1;
  private readonly limit = 10;

  readonly filters = [
    { value: 'all' as RequestFilterStatus, label: 'Toutes' },
    { value: 'new' as RequestFilterStatus, label: 'Nouvelles', count: 0 },
    { value: 'accepted' as RequestFilterStatus, label: 'Acceptées' },
    { value: 'in_progress' as RequestFilterStatus, label: 'En cours' },
    { value: 'completed' as RequestFilterStatus, label: 'Terminées' },
    { value: 'delivered' as RequestFilterStatus, label: 'Livrées' },
    { value: 'rejected' as RequestFilterStatus, label: 'Rejetées' },
  ];

  ngOnInit(): void {
    const filterParam = this.route.snapshot.queryParams['filter'];
    if (filterParam) {
      this.store.setRequestFilter(filterParam as RequestFilterStatus);
    }
    this.loadRequests();
    this.detectLocation();
  }

  async loadRequests(): Promise<void> {
    this.isLoading.set(true);
    this.page = 1;

    try {
      const status = this.store.requestFilter();
      const result = await this.repairerService.getRequests({
        status: status === 'all' ? undefined : status,
        page: this.page,
        limit: this.limit,
      });

      this.store.setRequests(result.data, result.total);
      this.hasMore.set(result.data.length < result.total);

      const newFilter = this.filters.find(f => f.value === 'new');
      if (newFilter) {
        newFilter.count = this.store.newRequestsCount();
      }
    } catch (err) {
      console.error('Error loading requests:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadMore(): Promise<void> {
    this.isLoadingMore.set(true);
    this.page++;

    try {
      const status = this.store.requestFilter();
      const result = await this.repairerService.getRequests({
        status: status === 'all' ? undefined : status,
        page: this.page,
        limit: this.limit,
      });

      this.store.appendRequests(result.data);
      this.hasMore.set(this.store.requests().length < result.total);
    } catch (err) {
      this.page--;
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  setFilter(filter: RequestFilterStatus): void {
    this.store.setRequestFilter(filter);
    this.loadRequests();
  }

  openRequest(request: RepairerRequest): void {
    this.selectedRequest.set(request);
  }

  closeDetail(): void {
    this.selectedRequest.set(null);
  }

  openPhoto(url: string): void {
    this.selectedPhoto.set(url);
  }

  async acceptRequest(request: RepairerRequest, event?: Event): Promise<void> {
    event?.stopPropagation();

    try {
      const updated = await this.repairerService.acceptRequest(request.id);
      this.store.updateRequest(request.id, updated);
      this.closeDetail();
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  }

  async rejectRequest(request: RepairerRequest, event?: Event): Promise<void> {
    event?.stopPropagation();

    const reason = prompt('Raison du refus (optionnel):');

    try {
      await this.repairerService.rejectRequest(request.id, reason || undefined);
      this.store.removeRequest(request.id);
      this.closeDetail();
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  }

  createQuote(request: RepairerRequest, event?: Event): void {
    event?.stopPropagation();
    this.router.navigate(['/repairer/quotes/new'], {
      queryParams: { requestId: request.id },
    });
  }

  async startRepair(request: RepairerRequest, event?: Event): Promise<void> {
    event?.stopPropagation();

    try {
      const updated = await this.repairerService.updateRequestStatus(request.id, 'in_progress');
      this.store.updateRequest(request.id, updated);
      this.closeDetail();
    } catch (err) {
      console.error('Error starting repair:', err);
    }
  }

  async completeRepair(request: RepairerRequest, event?: Event): Promise<void> {
    event?.stopPropagation();

    try {
      const updated = await this.repairerService.updateRequestStatus(request.id, 'completed');
      this.store.updateRequest(request.id, updated);
      this.closeDetail();
    } catch (err) {
      console.error('Error completing repair:', err);
    }
  }

  getEmptyMessage(): string {
    const filter = this.store.requestFilter();
    const messages: Record<RequestFilterStatus, string> = {
      all: 'Vous n\'avez pas encore de demandes',
      new: 'Aucune nouvelle demande pour le moment',
      accepted: 'Aucune demande acceptée',
      in_progress: 'Aucune réparation en cours',
      completed: 'Aucune réparation terminée',
      delivered: 'Aucune réparation livrée',
      rejected: 'Aucune demande rejetée',
    };
    return messages[filter];
  }

  getDeviceIcon(type: string): string {
    const icons: Record<string, string> = {
      smartphone: '📱',
      tablet: '📱',
      laptop: '💻',
      desktop: '🖥️',
    };
    return icons[type] || '📱';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Nouvelle',
      accepted: 'Acceptée',
      quote_sent: 'Devis envoyé',
      quote_accepted: 'Devis accepté',
      in_progress: 'En cours',
      completed: 'Terminée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      rejected: 'Refusée',
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): ChipVariant {
    const variants: Record<string, ChipVariant> = {
      pending: 'warning',
      accepted: 'primary',
      quote_sent: 'info',
      quote_accepted: 'info',
      in_progress: 'primary',
      completed: 'success',
      cancelled: 'default',
      rejected: 'danger',
    };
    return variants[status] || 'default';
  }

  getTimeAgo(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays}j`;
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  getInProgressCount(): number {
    return this.store.requests().filter(r => r.status === 'in_progress').length;
  }

  getCompletedCount(): number {
    return this.store.requests().filter(r => r.status === 'completed').length;
  }

  getFilterIcon(filter: RequestFilterStatus): string {
    const icons: Record<RequestFilterStatus, string> = {
      all: '📋',
      new: '🆕',
      accepted: '✅',
      in_progress: '🔧',
      completed: '🏆',
      delivered: '📦',
      rejected: '❌',
    };
    return icons[filter] || '📋';
  }

  // Header methods
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon apres-midi';
    return 'Bonsoir';
  }

  getUserName(): string {
    const user = this.authStore.user();
    return user?.firstName || 'Reparateur';
  }

  getInitialsUser(): string {
    const user = this.authStore.user();
    const first = user?.firstName?.[0] || '';
    const last = user?.lastName?.[0] || '';
    return (first + last).toUpperCase() || 'R';
  }

  getRoleLabel(): string {
    const role = this.authStore.user()?.role;
    const labels: Record<string, string> = {
      repairer: 'Réparateur',
      client: 'Client',
      admin: 'Admin',
    };
    return labels[role || ''] || 'Utilisateur';
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  onSearchChange(query: string): void {
    // Filtrer les demandes par recherche
    this.searchQuery = query;
    this.loadRequests();
  }

  detectLocation(): void {
    this.locationStatus.set('loading');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // En production, faire du reverse geocoding
          const repairerProfile = this.authStore.user()?.repairerProfile;
          if (repairerProfile?.address) {
            this.userAddress.set(repairerProfile.address);
          } else {
            this.userAddress.set('Cocody, Abidjan');
          }
          this.locationStatus.set('success');
        },
        () => {
          this.locationStatus.set('error');
        },
        { timeout: 10000 }
      );
    } else {
      this.locationStatus.set('error');
    }
  }

  getShortAddress(): string {
    const address = this.userAddress();
    // Retourne juste la ville ou les premiers mots
    if (address.includes(',')) {
      return address.split(',')[0].trim();
    }
    // Limiter à 15 caractères
    return address.length > 15 ? address.substring(0, 12) + '...' : address;
  }
}

import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RequestsService, RepairRequest, RequestStatus } from '../../../requests/services/requests.service';
import { UiMapComponent, MapMarker, MapRoute } from '../../../../shared/components/ui-map/ui-map.component';
import { UiTimelineComponent, TimelineStep } from '../../../../shared/components/ui-timeline/ui-timeline.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';

@Component({
  selector: 'app-tracking-view',
  standalone: true,
  imports: [CommonModule, RouterLink, UiMapComponent, UiTimelineComponent, UiButtonComponent],
  template: `
    <div class="tracking-container">
      <header class="tracking-header">
        <button class="back-btn" (click)="goBack()">
          <span>←</span>
        </button>
        <div class="header-content">
          <h1>Suivi de réparation</h1>
          @if (request()) {
            <span class="request-id">#{{ request()?.id?.slice(0, 8)?.toUpperCase() }}</span>
          }
        </div>
        @if (lastRefresh()) {
          <span class="last-update">{{ getTimeAgo(lastRefresh()!) }}</span>
        }
      </header>

      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>
      } @else if (request()) {
        <div class="tracking-content">
          <!-- Status Banner -->
          <div class="status-banner" [style.background]="getStatusBannerColor()">
            <div class="status-info">
              <span class="status-icon">{{ getStatusIcon() }}</span>
              <div class="status-text">
                <span class="status-label">{{ getStatusLabel() }}</span>
                <span class="status-desc">{{ getStatusDescription() }}</span>
              </div>
            </div>
            @if (request()?.urgency === 'express') {
              <span class="urgency-badge">⚡ Express</span>
            }
          </div>

          <!-- Timeline Section -->
          <section class="section timeline-section">
            <div class="section-header">
              <h2>Progression</h2>
              <button class="refresh-btn" (click)="refresh()" [disabled]="isRefreshing()">
                @if (isRefreshing()) {
                  <span class="spinner-small"></span>
                } @else {
                  🔄 Actualiser
                }
              </button>
            </div>
            <ui-timeline [steps]="timelineSteps()" [currentStatus]="request()?.status || 'pending'" />
          </section>

          <!-- Rejection Reason (if rejected) -->
          @if (request()?.status === 'rejected' && request()?.rejectionReason) {
            <section class="section rejection-section">
              <div class="section-header">
                <h2>❌ Motif du rejet</h2>
              </div>
              <div class="rejection-card">
                <p>{{ request()?.rejectionReason }}</p>
              </div>
            </section>
          }

          <!-- Map Section -->
          <section class="section map-section">
            <div class="section-header">
              <h2>📍 Localisation</h2>
              @if (hasMapData()) {
                <button class="refresh-btn" (click)="refreshLocation()" [disabled]="isRefreshing()">
                  🔄
                </button>
              }
            </div>

            @if (hasMapData()) {
              <ui-map
                height="180px"
                [centerLat]="mapCenter().lat"
                [centerLng]="mapCenter().lng"
                [zoom]="14"
                [markers]="mapMarkers()"
                [route]="mapRoute()"
                [showControls]="true"
              ></ui-map>

              @if (estimatedDistance()) {
                <div class="distance-info">
                  <span>📏 Distance: {{ estimatedDistance() }} km</span>
                </div>
              }
            } @else {
              <div class="map-placeholder">
                <span class="placeholder-icon">🗺️</span>
                <p>Position non disponible</p>
              </div>
            }
          </section>

          <!-- Request Details -->
          <section class="section">
            <h2>🔧 Détails de la réparation</h2>
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Appareil</span>
                <span class="detail-value">{{ request()?.device?.brand }} {{ request()?.device?.model }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Service</span>
                <span class="detail-value">{{ request()?.serviceType?.name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Mode</span>
                <span class="detail-value">{{ getDeliveryModeLabel(request()?.deliveryMode) }}</span>
              </div>
              @if (request()?.preferredDate) {
                <div class="detail-item">
                  <span class="detail-label">Date souhaitée</span>
                  <span class="detail-value">{{ formatDate(request()?.preferredDate) }}</span>
                </div>
              }
            </div>

            @if (request()?.description) {
              <div class="description-section">
                <span class="detail-label">Description du problème</span>
                <p class="description-text">{{ request()?.description }}</p>
              </div>
            }

            @if (request()?.images?.length) {
              <div class="images-section">
                <span class="detail-label">Photos</span>
                <div class="images-grid">
                  @for (img of request()?.images; track img) {
                    <img [src]="img" alt="Photo" (click)="openImageModal(img)" />
                  }
                </div>
              </div>
            }
          </section>

          <!-- Repairer Card -->
          <section class="section repairer-section">
            <h2>👨‍🔧 Votre réparateur</h2>
            <div class="repairer-card">
              <div class="repairer-avatar">
                @if (request()?.repairer?.avatarUrl) {
                  <img [src]="request()?.repairer?.avatarUrl" alt="Avatar" />
                } @else {
                  <span class="avatar-placeholder">{{ getRepairerInitials() }}</span>
                }
                @if (request()?.repairer?.repairerProfile?.isAvailable) {
                  <span class="online-badge"></span>
                }
              </div>
              <div class="repairer-info">
                <span class="repairer-name">{{ getRepairerName() }}</span>
                @if (request()?.repairer?.repairerProfile?.rating) {
                  <div class="repairer-rating">
                    ⭐ {{ request()?.repairer?.repairerProfile?.rating?.toFixed(1) }}
                    <span class="rating-count">({{ request()?.repairer?.repairerProfile?.reviewCount || 0 }} avis)</span>
                  </div>
                }
                @if (request()?.repairer?.repairerProfile?.address) {
                  <span class="repairer-address">📍 {{ request()?.repairer?.repairerProfile?.address }}</span>
                }
              </div>
              <div class="repairer-actions">
                <a [href]="getMaskedPhoneLink()" class="action-btn call-btn">
                  📞
                </a>
                <button class="action-btn chat-btn" (click)="openChat()">
                  💬
                </button>
              </div>
            </div>
          </section>

          <!-- Status History -->
          @if (request()?.statusHistory?.length) {
            <section class="section history-section">
              <h2>📋 Historique</h2>
              <div class="history-list">
                @for (entry of request()?.statusHistory; track entry.id) {
                  <div class="history-item">
                    <div class="history-dot" [style.background]="requestsService.getStatusColor(entry.status)"></div>
                    <div class="history-content">
                      <span class="history-status">{{ requestsService.getStatusLabel(entry.status) }}</span>
                      @if (entry.comment) {
                        <span class="history-comment">{{ entry.comment }}</span>
                      }
                      <span class="history-time">{{ formatDateTime(entry.createdAt) }}</span>
                    </div>
                  </div>
                }
              </div>
            </section>
          }

          <!-- Actions -->
          <div class="actions-section">
            @if (request()?.status === 'accepted') {
              <ui-button variant="primary" fullWidth (click)="contactRepairer()">
                📞 Contacter le réparateur
              </ui-button>
            }

            @if (request()?.status === 'rejected') {
              <ui-button variant="primary" fullWidth routerLink="/search">
                🔍 Trouver un autre réparateur
              </ui-button>
            }
          </div>
        </div>
      } @else {
        <div class="error-state">
          <span class="error-icon">❌</span>
          <p>Demande non trouvée</p>
          <ui-button variant="primary" routerLink="/requests">
            Retour aux demandes
          </ui-button>
        </div>
      }

      <!-- Image Modal -->
      @if (selectedImage()) {
        <div class="image-modal" (click)="closeImageModal()">
          <button class="close-modal-btn">✕</button>
          <img [src]="selectedImage()" alt="Photo agrandie" />
        </div>
      }
    </div>
  `,
  styles: [`
    .tracking-container {
      min-height: 100vh;
      background: #FFF5F0;
      padding-bottom: 2rem;
    }

    .tracking-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      color: white;
      box-shadow: 0 2px 12px rgba(255, 107, 53, 0.3);
    }

    .back-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      transition: all 0.2s;
      min-width: 44px;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .header-content {
      flex: 1;
    }

    .tracking-header h1 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .request-id {
      font-size: 0.75rem;
      opacity: 0.8;
      font-family: monospace;
    }

    .last-update {
      font-size: 0.75rem;
      opacity: 0.8;
      white-space: nowrap;
    }

    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      gap: 1rem;
      text-align: center;
    }

    .error-icon {
      font-size: 4rem;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #FFE5D9;
      border-top-color: #FF6B35;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner-small {
      width: 18px;
      height: 18px;
      border: 3px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .tracking-content {
      padding: 1rem;
      max-width: 800px;
      margin: 0 auto;
    }

    /* Status Banner */
    .status-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      border-radius: 16px;
      margin-bottom: 1rem;
      color: white;
    }

    .status-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-icon {
      font-size: 2rem;
    }

    .status-text {
      display: flex;
      flex-direction: column;
    }

    .status-label {
      font-weight: 600;
      font-size: 1.125rem;
    }

    .status-desc {
      font-size: 0.75rem;
      opacity: 0.9;
    }

    .urgency-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    /* Sections */
    .section {
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #FFE5D9;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .section h2 {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f2937;
    }

    .refresh-btn {
      background: white;
      border: 2px solid #FFE5D9;
      padding: 0.5rem 0.875rem;
      border-radius: 12px;
      font-size: 0.8125rem;
      color: #FF6B35;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-weight: 600;
      transition: all 0.2s;
      min-height: 40px;
    }

    .refresh-btn:hover:not(:disabled) {
      border-color: #FF6B35;
      background: #FFF5F0;
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.15);
    }

    .refresh-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Quote Section */
    .quote-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .quote-badge.pending {
      background: #FFF4E6;
      color: #F9A825;
      border: 1px solid #F9A825;
    }

    .quote-badge.accepted {
      background: #E8F5E9;
      color: #4CAF50;
      border: 1px solid #4CAF50;
    }

    .quote-card {
      background: linear-gradient(135deg, #FFF5F0 0%, #FFFFFF 100%);
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid #FFE5D9;
    }

    .quote-breakdown {
      padding: 1rem;
    }

    .quote-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }

    .quote-row.supplement {
      color: #FF6B35;
      font-weight: 600;
    }

    .parts-list {
      padding-left: 1rem;
      margin: 0.5rem 0;
    }

    .part-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: #6b7280;
      padding: 0.25rem 0;
    }

    .quote-total {
      display: flex;
      justify-content: space-between;
      padding-top: 0.75rem;
      margin-top: 0.5rem;
      border-top: 3px solid #FFE5D9;
      font-weight: 700;
    }

    .total-amount {
      color: #FF6B35;
      font-size: 1.5rem;
    }

    .quote-meta {
      padding: 0.75rem 1rem;
      background: #e5e7eb;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .meta-icon {
      font-size: 1rem;
    }

    .quote-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      padding: 1rem;
    }

    .quote-pending {
      text-align: center;
      padding: 2rem 1rem;
    }

    .pending-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .quote-pending p {
      margin: 0 0 0.5rem;
      font-weight: 500;
    }

    .pending-hint {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    /* Map Section */
    .map-placeholder {
      background: #f3f4f6;
      border-radius: 12px;
      height: 150px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #6b7280;
    }

    .placeholder-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .distance-info {
      margin-top: 0.75rem;
      padding: 0.5rem 0.75rem;
      background: #f3f4f6;
      border-radius: 8px;
      font-size: 0.875rem;
      color: #4b5563;
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    .detail-value {
      font-weight: 500;
      color: #1f2937;
    }

    .description-section {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;
    }

    .description-text {
      margin: 0.5rem 0 0;
      font-size: 0.875rem;
      color: #4b5563;
      line-height: 1.5;
    }

    .images-section {
      margin-top: 1rem;
    }

    .images-grid {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      flex-wrap: wrap;
    }

    .images-grid img {
      width: 80px;
      height: 80px;
      border-radius: 8px;
      object-fit: cover;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .images-grid img:hover {
      transform: scale(1.05);
    }

    /* Repairer Card */
    .repairer-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 12px;
    }

    .repairer-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .repairer-avatar img,
    .avatar-placeholder {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      background: linear-gradient(135deg, #FF6B35 0%, #FF9800 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.25rem;
    }

    .online-badge {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 14px;
      height: 14px;
      background: #4CAF50;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 8px rgba(76, 175, 80, 0.4);
    }

    .repairer-info {
      flex: 1;
      min-width: 0;
    }

    .repairer-name {
      font-weight: 600;
      color: #1f2937;
      display: block;
    }

    .repairer-rating {
      font-size: 0.875rem;
      color: #f59e0b;
    }

    .rating-count {
      color: #9ca3af;
      font-size: 0.75rem;
    }

    .repairer-address {
      font-size: 0.75rem;
      color: #6b7280;
      display: block;
      margin-top: 0.25rem;
    }

    .repairer-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .call-btn {
      background: #4CAF50;
      color: white;
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
    }

    .call-btn:hover {
      background: #45A049;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.4);
    }

    .chat-btn {
      background: #FF6B35;
      color: white;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
    }

    .chat-btn:hover {
      background: #FF5722;
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
    }

    /* History Section */
    .history-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .history-item {
      display: flex;
      gap: 1rem;
    }

    .history-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .history-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .history-status {
      font-weight: 500;
      color: #1f2937;
    }

    .history-comment {
      font-size: 0.875rem;
      color: #4b5563;
    }

    .history-time {
      font-size: 0.75rem;
      color: #9ca3af;
    }

    /* Actions Section */
    .actions-section {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    /* Image Modal */
    .image-modal {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .image-modal img {
      max-width: 100%;
      max-height: 90vh;
      border-radius: 8px;
    }

    .close-modal-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
    }
  `],
})
export class TrackingViewComponent implements OnInit, OnDestroy {
  readonly requestsService = inject(RequestsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly request = signal<RepairRequest | null>(null);
  readonly isLoading = signal(true);
  readonly isRefreshing = signal(false);
  readonly lastRefresh = signal<Date | null>(null);
  readonly userLocation = signal<{ lat: number; lng: number } | null>(null);
  readonly selectedImage = signal<string | null>(null);

  private refreshInterval?: ReturnType<typeof setInterval>;

  readonly timelineSteps = computed<TimelineStep[]>(() => {
    const req = this.request();
    const history = req?.statusHistory || [];
    const currentStatus = req?.status || 'pending';

    // Define step order for 3 statuses
    const statusOrder = ['pending', 'accepted'];
    const currentIndex = statusOrder.indexOf(currentStatus);

    const getStepStatus = (stepId: string): 'completed' | 'current' | 'pending' | 'error' => {
      const stepIndex = statusOrder.indexOf(stepId);
      if (currentStatus === 'rejected') return 'error';
      if (stepIndex < currentIndex) return 'completed';
      if (stepIndex === currentIndex) return 'current';
      return 'pending';
    };

    const steps: TimelineStep[] = [
      {
        id: 'pending',
        status: currentStatus === 'rejected' ? 'error' : (currentStatus === 'pending' ? 'current' : 'completed'),
        title: 'En cours d\'analyse',
        description: 'Le réparateur analyse votre demande',
        date: this.getHistoryTime('pending', history) || req?.createdAt,
      },
      {
        id: 'accepted',
        status: currentStatus === 'rejected' ? 'error' : (currentStatus === 'accepted' ? 'current' : 'pending'),
        title: 'Demande acceptée',
        description: 'Le réparateur a accepté votre demande',
        date: this.getHistoryTime('accepted', history),
      },
    ];

    // Add rejected step if rejected
    if (currentStatus === 'rejected') {
      steps.push({
        id: 'rejected',
        status: 'error',
        title: 'Demande rejetée',
        description: req?.rejectionReason || 'La demande a été rejetée',
        date: req?.rejectedAt,
      });
    }

    return steps;
  });

  // Map computed signals
  readonly mapMarkers = computed<MapMarker[]>(() => {
    const markers: MapMarker[] = [];
    const req = this.request();

    if (req?.repairer?.repairerProfile?.latitude && req?.repairer?.repairerProfile?.longitude) {
      markers.push({
        id: 'repairer',
        latitude: req.repairer.repairerProfile.latitude,
        longitude: req.repairer.repairerProfile.longitude,
        title: req.repairer.repairerProfile.businessName || 'Réparateur',
        icon: 'repairer',
        popup: `<strong>${req.repairer.repairerProfile.businessName || 'Réparateur'}</strong>`
      });
    }

    if (req?.clientLatitude && req?.clientLongitude) {
      markers.push({
        id: 'client',
        latitude: req.clientLatitude,
        longitude: req.clientLongitude,
        title: 'Votre position',
        icon: 'user',
        popup: '<strong>Votre position</strong>'
      });
    } else if (this.userLocation()) {
      markers.push({
        id: 'user',
        latitude: this.userLocation()!.lat,
        longitude: this.userLocation()!.lng,
        title: 'Votre position',
        icon: 'user',
        popup: '<strong>Votre position</strong>'
      });
    }

    return markers;
  });

  readonly mapRoute = computed<MapRoute | undefined>(() => {
    const req = this.request();
    const repairerLat = req?.repairer?.repairerProfile?.latitude;
    const repairerLng = req?.repairer?.repairerProfile?.longitude;
    const clientLat = req?.clientLatitude || this.userLocation()?.lat;
    const clientLng = req?.clientLongitude || this.userLocation()?.lng;

    if (repairerLat && repairerLng && clientLat && clientLng) {
      return {
        start: { latitude: clientLat, longitude: clientLng },
        end: { latitude: repairerLat, longitude: repairerLng },
        color: '#2563eb'
      };
    }
    return undefined;
  });

  readonly mapCenter = computed(() => {
    const req = this.request();
    if (req?.repairer?.repairerProfile?.latitude && req?.repairer?.repairerProfile?.longitude) {
      return { lat: req.repairer.repairerProfile.latitude, lng: req.repairer.repairerProfile.longitude };
    }
    if (req?.clientLatitude && req?.clientLongitude) {
      return { lat: req.clientLatitude, lng: req.clientLongitude };
    }
    if (this.userLocation()) {
      return this.userLocation()!;
    }
    return { lat: 5.3600, lng: -4.0083 }; // Abidjan default
  });

  readonly estimatedDistance = computed(() => {
    const route = this.mapRoute();
    if (!route) return null;

    const R = 6371;
    const dLat = this.toRad(route.end.latitude - route.start.latitude);
    const dLon = this.toRad(route.end.longitude - route.start.longitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(route.start.latitude)) *
      Math.cos(this.toRad(route.end.latitude)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  });

  ngOnInit(): void {
    const requestId = this.route.snapshot.paramMap.get('requestId');
    if (requestId) {
      this.loadRequest(requestId);
      this.detectUserLocation();
      this.refreshInterval = setInterval(() => this.loadRequest(requestId), 30000);
    }
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  private getHistoryTime(status: RequestStatus, history: { status: RequestStatus; createdAt: string }[]): string | undefined {
    const entry = history.find(h => h.status === status);
    return entry?.createdAt;
  }

  async loadRequest(id: string): Promise<void> {
    try {
      const request = await this.requestsService.getRequest(id);
      this.request.set(request);
      this.lastRefresh.set(new Date());
    } catch (err) {
      console.error('Error loading request:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async refresh(): Promise<void> {
    this.isRefreshing.set(true);
    const requestId = this.route.snapshot.paramMap.get('requestId');
    if (requestId) {
      await this.loadRequest(requestId);
    }
    this.isRefreshing.set(false);
  }

  async refreshLocation(): Promise<void> {
    this.isRefreshing.set(true);
    await this.detectUserLocation();
    this.isRefreshing.set(false);
  }

  private async detectUserLocation(): Promise<void> {
    if (!navigator.geolocation) return;

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      this.userLocation.set({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    } catch (err) {
      console.error('Error getting user location:', err);
    }
  }

  hasMapData(): boolean {
    const req = this.request();
    return !!(
      (req?.repairer?.repairerProfile?.latitude && req?.repairer?.repairerProfile?.longitude) ||
      (req?.clientLatitude && req?.clientLongitude) ||
      this.userLocation()
    );
  }

  getStatusBannerColor(): string {
    const status = this.request()?.status;
    const colors: Record<string, string> = {
      pending: 'linear-gradient(135deg, #F9A825 0%, #FF9800 100%)',
      accepted: 'linear-gradient(135deg, #10B981 0%, #4CAF50 100%)',
      rejected: 'linear-gradient(135deg, #E53935 0%, #C62828 100%)',
    };
    return colors[status || 'pending'] || colors['pending'];
  }

  getStatusIcon(): string {
    const status = this.request()?.status;
    const icons: Record<string, string> = {
      pending: '⏳',
      accepted: '✅',
      rejected: '🚫',
    };
    return icons[status || 'pending'] || '⏳';
  }

  getStatusLabel(): string {
    return this.requestsService.getStatusLabel(this.request()?.status || 'pending');
  }

  getStatusDescription(): string {
    const status = this.request()?.status;
    const descriptions: Record<string, string> = {
      pending: 'En attente de réponse du réparateur',
      accepted: 'Le réparateur a accepté votre demande',
      rejected: 'Le réparateur n\'a pas pu accepter',
    };
    return descriptions[status || 'pending'] || '';
  }

  getRepairerName(): string {
    const r = this.request()?.repairer;
    if (!r) return '';
    if (r.repairerProfile?.businessName) return r.repairerProfile.businessName;
    return `${r.firstName || ''} ${r.lastName || ''}`.trim() || 'Réparateur';
  }

  getRepairerInitials(): string {
    const name = this.getRepairerName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getDeliveryModeLabel(mode?: string): string {
    const labels: Record<string, string> = {
      'in_shop': '🏪 En boutique',
      'at_home': '🏠 À domicile',
      'postal': '📦 Envoi postal'
    };
    return labels[mode || ''] || mode || '';
  }

  getMaskedPhoneLink(): string {
    // In production, this would use a masked phone number service
    return `tel:${this.request()?.repairer?.phone}`;
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  formatDateTime(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'à l\'instant';
    if (seconds < 120) return 'il y a 1 min';
    if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`;
    return `il y a ${Math.floor(seconds / 3600)} h`;
  }

  canCancel(): boolean {
    const status = this.request()?.status;
    return status === 'pending' || status === 'accepted';
  }

  contactRepairer(): void {
    const req = this.request();
    if (req?.repairer?.phone) {
      window.location.href = `tel:${req.repairer.phone}`;
    }
  }

  openChat(): void {
    const req = this.request();
    if (req) {
      this.router.navigate(['/chat', req.id]);
    }
  }

  openImageModal(imageUrl: string): void {
    this.selectedImage.set(imageUrl);
  }

  closeImageModal(): void {
    this.selectedImage.set(null);
  }

  goBack(): void {
    this.router.navigate(['/requests']);
  }

  private toRad(value: number): number {
    return (value * Math.PI) / 180;
  }
}

import { Component, inject, OnInit, signal, ViewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DisputesService, Dispute, DisputeMessage } from '../../services/disputes.service';
import { DisputesStore } from '../../stores/disputes.store';
import { UiCardComponent } from '../../../../shared/components/ui-card/ui-card.component';
import { UiButtonComponent } from '../../../../shared/components/ui-button/ui-button.component';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiPriceDisplayComponent } from '../../../../shared/components/ui-price-display/ui-price-display.component';

@Component({
  selector: 'app-dispute-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiCardComponent,
    UiButtonComponent,
    UiLoadingComponent,
    UiPriceDisplayComponent,
  ],
  template: `
    <div class="dispute-detail">
      <!-- Header -->
      <header class="header">
        <button class="back-btn" routerLink="/disputes">
          ← Retour
        </button>
        <h1>Litige #{{ dispute()?.id?.slice(0, 8) }}</h1>
      </header>

      <!-- Loading -->
      @if (isLoading()) {
        <div class="loading-container">
          <ui-loading size="lg" />
          <p>Chargement...</p>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <ui-card class="error-card">
          <p>{{ error() }}</p>
          <ui-button variant="outline" size="sm" (onClick)="loadDispute()">
            Réessayer
          </ui-button>
        </ui-card>
      }

      @if (dispute()) {
        <!-- Status Banner -->
        <div class="status-banner" [style.background]="getStatusGradient()">
          <div class="status-content">
            <span class="status-icon">{{ getStatusIcon() }}</span>
            <div class="status-info">
              <span class="status-label">
                {{ disputesService.getStatusLabel(dispute()!.status) }}
              </span>
              @if (getEstimatedTime()) {
                <span class="status-hint">{{ getEstimatedTime() }}</span>
              }
            </div>
          </div>
        </div>

        <!-- Reason Card -->
        <ui-card class="reason-card">
          <div class="reason-header">
            <span class="reason-icon">{{ disputesService.getReasonIcon(dispute()!.reason) }}</span>
            <div class="reason-info">
              <span class="reason-label">{{ disputesService.getReasonLabel(dispute()!.reason) }}</span>
              <span class="reason-date">Signalé le {{ formatDate(dispute()!.createdAt) }}</span>
            </div>
          </div>
          <p class="reason-description">{{ dispute()!.description }}</p>
        </ui-card>

        <!-- Evidence Photos -->
        @if (dispute()!.evidencePhotos.length > 0) {
          <ui-card class="evidence-card">
            <h3>Photos / Preuves</h3>
            <div class="evidence-grid">
              @for (photo of dispute()!.evidencePhotos; track $index) {
                <div class="evidence-item" (click)="openPhoto(photo)">
                  <img [src]="photo" alt="Preuve {{ $index + 1 }}" />
                </div>
              }
            </div>
          </ui-card>
        }

        <!-- Related Request -->
        @if (dispute()!.request) {
          <ui-card class="request-card" [routerLink]="['/tracking', dispute()!.requestId]">
            <h3>Réparation concernée</h3>
            <div class="request-info">
              <span class="device-icon">📱</span>
              <div class="device-details">
                <span class="device-name">
                  {{ dispute()!.request!.device?.brand }} {{ dispute()!.request!.device?.model }}
                </span>
                @if (dispute()!.request?.serviceType) {
                  <span class="service-type">{{ dispute()!.request!.serviceType!.name }}</span>
                }
              </div>
              <span class="arrow">→</span>
            </div>
          </ui-card>
        }

        <!-- Resolution (if resolved) -->
        @if (dispute()!.resolution) {
          <ui-card class="resolution-card">
            <h3>Résolution</h3>
            <div class="resolution-content">
              <span class="resolution-type">
                {{ disputesService.getResolutionLabel(dispute()!.resolution!) }}
              </span>
              @if (dispute()!.refundAmount) {
                <div class="refund-amount">
                  <span class="label">Montant remboursé:</span>
                  <ui-price-display [amount]="dispute()!.refundAmount!" size="lg" />
                </div>
              }
              @if (dispute()!.resolutionNotes) {
                <p class="resolution-notes">{{ dispute()!.resolutionNotes }}</p>
              }
            </div>
          </ui-card>
        }

        <!-- Messages Section -->
        <div class="messages-section">
          <h3>Échanges</h3>

          @if (store.currentDisputeMessages().length === 0) {
            <ui-card class="no-messages">
              <p>Aucun message pour le moment. L'équipe support va prendre en charge votre litige.</p>
            </ui-card>
          }

          <div class="messages-list" #messagesList>
            @for (message of store.currentDisputeMessages(); track message.id) {
              <div class="message" [class.own]="isOwnMessage(message)" [class.support]="message.senderType === 'support'">
                <div class="message-header">
                  <span class="sender">{{ getSenderLabel(message) }}</span>
                  <span class="time">{{ formatTime(message.createdAt) }}</span>
                </div>
                <div class="message-content">
                  <p>{{ message.message }}</p>
                  @if (message.attachments?.length) {
                    <div class="message-attachments">
                      @for (attachment of message.attachments; track $index) {
                        <img [src]="attachment" (click)="openPhoto(attachment)" />
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Message Input -->
          @if (canSendMessage()) {
            <div class="message-input">
              <label class="attach-btn">
                <input
                  type="file"
                  accept="image/*"
                  (change)="onAttachmentSelected($event)"
                  hidden
                />
                📎
              </label>
              <input
                type="text"
                [(ngModel)]="newMessage"
                placeholder="Votre message..."
                (keyup.enter)="sendMessage()"
              />
              <button
                class="send-btn"
                [disabled]="!newMessage.trim() && pendingAttachments().length === 0"
                (click)="sendMessage()"
              >
                ➤
              </button>
            </div>

            @if (pendingAttachments().length > 0) {
              <div class="pending-attachments">
                @for (attachment of pendingAttachments(); track $index) {
                  <div class="pending-item">
                    <img [src]="attachment" />
                    <button (click)="removeAttachment($index)">×</button>
                  </div>
                }
              </div>
            }
          }
        </div>

        <!-- Actions -->
        @if (dispute()!.status === 'open') {
          <div class="actions">
            <ui-button variant="outline" (onClick)="cancelDispute()">
              Annuler le litige
            </ui-button>
          </div>
        }

        <!-- Photo Modal -->
        @if (selectedPhoto()) {
          <div class="photo-modal" (click)="selectedPhoto.set(null)">
            <img [src]="selectedPhoto()" />
            <button class="close-btn">×</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .dispute-detail {
      padding: 1rem;
      padding-bottom: 5rem;
    }

    .header {
      margin-bottom: 1.5rem;

      .back-btn {
        background: none;
        border: none;
        color: #3b82f6;
        font-size: 0.875rem;
        padding: 0;
        margin-bottom: 0.5rem;
        cursor: pointer;
      }

      h1 {
        font-size: 1.25rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: #64748b;
    }

    .error-card {
      padding: 1.5rem;
      text-align: center;
      background: #fef2f2;

      p {
        color: #dc2626;
        margin: 0 0 1rem 0;
      }
    }

    .status-banner {
      padding: 1.25rem;
      border-radius: 1rem;
      margin-bottom: 1rem;

      .status-content {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .status-icon {
        font-size: 2rem;
      }

      .status-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .status-label {
        font-size: 1.125rem;
        font-weight: 600;
        color: white;
      }

      .status-hint {
        font-size: 0.8125rem;
        color: rgba(255, 255, 255, 0.85);
      }
    }

    .reason-card,
    .evidence-card,
    .request-card,
    .resolution-card {
      padding: 1rem;
      margin-bottom: 1rem;

      h3 {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0 0 0.75rem 0;
      }
    }

    .reason-card {
      .reason-header {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      .reason-icon {
        font-size: 2rem;
      }

      .reason-info {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .reason-label {
        font-weight: 600;
        color: #1e293b;
      }

      .reason-date {
        font-size: 0.75rem;
        color: #94a3b8;
      }

      .reason-description {
        font-size: 0.875rem;
        color: #475569;
        line-height: 1.6;
        margin: 0;
        padding-top: 0.75rem;
        border-top: 1px solid #f1f5f9;
      }
    }

    .evidence-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;

      .evidence-item {
        aspect-ratio: 1;
        border-radius: 0.5rem;
        overflow: hidden;
        cursor: pointer;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
    }

    .request-card {
      cursor: pointer;

      .request-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .device-icon {
        font-size: 1.5rem;
      }

      .device-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .device-name {
        font-weight: 600;
        color: #1e293b;
      }

      .service-type {
        font-size: 0.8125rem;
        color: #64748b;
      }

      .arrow {
        color: #94a3b8;
      }
    }

    .resolution-card {
      background: #f0fdf4;
      border-color: #bbf7d0;

      h3 {
        color: #166534;
      }

      .resolution-content {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .resolution-type {
        font-weight: 600;
        color: #166534;
        font-size: 1rem;
      }

      .refund-amount {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .label {
          font-size: 0.875rem;
          color: #15803d;
        }
      }

      .resolution-notes {
        font-size: 0.875rem;
        color: #166534;
        line-height: 1.5;
        margin: 0;
      }
    }

    .messages-section {
      margin-top: 1.5rem;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: #1e293b;
        margin: 0 0 1rem 0;
      }
    }

    .no-messages {
      padding: 1.5rem;
      text-align: center;

      p {
        margin: 0;
        color: #64748b;
        font-size: 0.875rem;
      }
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 400px;
      overflow-y: auto;
      padding-right: 0.5rem;
      margin-bottom: 1rem;
    }

    .message {
      max-width: 85%;

      &.own {
        margin-left: auto;

        .message-content {
          background: #3b82f6;
          color: white;

          p {
            color: white;
          }
        }
      }

      &.support {
        .message-content {
          background: #fef3c7;
          border-color: #fcd34d;
        }

        .sender {
          color: #92400e;
        }
      }

      .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
        padding: 0 0.5rem;
      }

      .sender {
        font-size: 0.75rem;
        font-weight: 600;
        color: #64748b;
      }

      .time {
        font-size: 0.625rem;
        color: #94a3b8;
      }

      .message-content {
        background: white;
        border: 1px solid #e2e8f0;
        border-radius: 1rem;
        padding: 0.75rem 1rem;

        p {
          margin: 0;
          font-size: 0.875rem;
          color: #1e293b;
          line-height: 1.5;
        }
      }

      .message-attachments {
        display: flex;
        gap: 0.5rem;
        margin-top: 0.5rem;

        img {
          width: 4rem;
          height: 4rem;
          object-fit: cover;
          border-radius: 0.375rem;
          cursor: pointer;
        }
      }
    }

    .message-input {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 9999px;

      .attach-btn {
        width: 2.5rem;
        height: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.25rem;
        cursor: pointer;
        border-radius: 50%;
        transition: background 0.2s;

        &:hover {
          background: #f1f5f9;
        }
      }

      input[type="text"] {
        flex: 1;
        border: none;
        font-size: 0.9375rem;
        padding: 0.5rem;

        &:focus {
          outline: none;
        }
      }

      .send-btn {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background: #3b82f6;
        color: white;
        border: none;
        font-size: 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;

        &:hover:not(:disabled) {
          background: #2563eb;
        }

        &:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }
      }
    }

    .pending-attachments {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.5rem;
      padding: 0.5rem;

      .pending-item {
        position: relative;

        img {
          width: 3rem;
          height: 3rem;
          object-fit: cover;
          border-radius: 0.375rem;
        }

        button {
          position: absolute;
          top: -0.375rem;
          right: -0.375rem;
          width: 1.25rem;
          height: 1.25rem;
          border-radius: 50%;
          background: #ef4444;
          color: white;
          border: none;
          font-size: 0.75rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }

    .actions {
      margin-top: 2rem;
    }

    .photo-modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      z-index: 1000;

      img {
        max-width: 100%;
        max-height: 90vh;
        object-fit: contain;
        border-radius: 0.5rem;
      }

      .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background: white;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
      }
    }
  `]
})
export class DisputeDetailComponent implements OnInit {
  @ViewChild('messagesList') messagesListRef!: ElementRef;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly disputesService = inject(DisputesService);
  readonly store = inject(DisputesStore);

  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedPhoto = signal<string | null>(null);
  readonly pendingAttachments = signal<string[]>([]);
  readonly isSending = signal(false);

  newMessage = '';

  readonly dispute = this.store.currentDispute;

  ngOnInit(): void {
    this.loadDispute();
  }

  async loadDispute(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('ID de litige manquant');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    try {
      const dispute = await this.disputesService.getDispute(id);
      this.store.setCurrentDispute(dispute);
    } catch (err: any) {
      this.error.set(err.message || 'Erreur lors du chargement du litige');
    } finally {
      this.isLoading.set(false);
    }
  }

  getStatusGradient(): string {
    const status = this.dispute()?.status;
    const gradients: Record<string, string> = {
      open: 'linear-gradient(135deg, #f59e0b, #d97706)',
      in_review: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      resolved: 'linear-gradient(135deg, #10b981, #059669)',
      closed: 'linear-gradient(135deg, #6b7280, #4b5563)',
      rejected: 'linear-gradient(135deg, #ef4444, #dc2626)',
    };
    return gradients[status || 'open'];
  }

  getStatusIcon(): string {
    const status = this.dispute()?.status;
    const icons: Record<string, string> = {
      open: '📋',
      in_review: '🔍',
      resolved: '✅',
      closed: '📁',
      rejected: '❌',
    };
    return icons[status || 'open'];
  }

  getEstimatedTime(): string {
    const dispute = this.dispute();
    if (!dispute) return '';
    return this.disputesService.getEstimatedResolutionTime(dispute);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  isOwnMessage(message: DisputeMessage): boolean {
    return message.senderType === 'client';
  }

  getSenderLabel(message: DisputeMessage): string {
    switch (message.senderType) {
      case 'client':
        return 'Vous';
      case 'repairer':
        return 'Réparateur';
      case 'support':
        return 'Support RepairFone';
      default:
        return 'Inconnu';
    }
  }

  canSendMessage(): boolean {
    const status = this.dispute()?.status;
    return status === 'open' || status === 'in_review';
  }

  onAttachmentSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.pendingAttachments().length < 3) {
      const reader = new FileReader();
      reader.onload = () => {
        this.pendingAttachments.update(attachments => [
          ...attachments,
          reader.result as string,
        ]);
      };
      reader.readAsDataURL(file);
    }

    input.value = '';
  }

  removeAttachment(index: number): void {
    this.pendingAttachments.update(attachments =>
      attachments.filter((_, i) => i !== index)
    );
  }

  async sendMessage(): Promise<void> {
    const dispute = this.dispute();
    if (!dispute) return;

    const message = this.newMessage.trim();
    const attachments = this.pendingAttachments();

    if (!message && attachments.length === 0) return;

    this.isSending.set(true);

    try {
      const newMsg = await this.disputesService.addMessage(
        dispute.id,
        message,
        attachments.length > 0 ? attachments : undefined
      );

      this.store.addMessageToCurrentDispute(newMsg);
      this.newMessage = '';
      this.pendingAttachments.set([]);

      // Scroll to bottom
      setTimeout(() => {
        if (this.messagesListRef) {
          const el = this.messagesListRef.nativeElement;
          el.scrollTop = el.scrollHeight;
        }
      }, 100);
    } catch (err: any) {
      console.error('Failed to send message:', err);
    } finally {
      this.isSending.set(false);
    }
  }

  openPhoto(url: string): void {
    this.selectedPhoto.set(url);
  }

  async cancelDispute(): Promise<void> {
    const dispute = this.dispute();
    if (!dispute) return;

    if (!confirm('Êtes-vous sûr de vouloir annuler ce litige ?')) {
      return;
    }

    try {
      const updated = await this.disputesService.cancelDispute(dispute.id);
      this.store.setCurrentDispute(updated);
    } catch (err: any) {
      console.error('Failed to cancel dispute:', err);
    }
  }
}

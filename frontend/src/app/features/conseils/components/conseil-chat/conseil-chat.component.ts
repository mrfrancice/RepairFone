import { Component, inject, OnInit, signal, ViewChild, ElementRef, AfterViewChecked, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ConseilsService, ConseilSession, ConseilMessage, ConseilsStore } from '@app/domains/conseils';
import { StatusLabelsService, SessionStatus } from '../../../../shared/services/status-labels.service';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-conseil-chat',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, UiHeaderComponent],
  template: `
    <div class="chat-container">
      <!-- Header unifié (charte sombre via ui-header, mode inline pour layout flex) -->
      <ui-header [showBack]="true" backRoute="/conseils/sessions" [inline]="true">
        @if (session()) {
          <div header-center class="expert-info">
            <div class="expert-avatar">
              @if (session()?.expert?.avatarUrl) {
                <img [src]="session()?.expert?.avatarUrl" [alt]="session()?.expert?.firstName" />
              } @else {
                <div class="avatar-placeholder">
                  {{ getExpertInitials() }}
                </div>
              }
              <span class="presence-dot" [class.online]="session()?.expert?.isAvailable"></span>
            </div>
            <div class="expert-details">
              <span class="expert-name">{{ session()?.expert?.firstName }} {{ session()?.expert?.lastName }}</span>
              <span class="session-status">{{ statusLabels.getSessionStatusLabel($any(session()?.status)) }}</span>
            </div>
          </div>
        }

        <button header-actions class="menu-btn" aria-label="Options de la session">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
          </svg>
        </button>
      </ui-header>

      <!-- Messages -->
      <div class="chat-messages" #messagesContainer>
        @if (store.isLoadingMessages()) {
          <div class="loading-state">
            <div class="spinner"></div>
          </div>
        } @else if (store.messages().length === 0) {
          <div class="empty-chat">
            <div class="empty-icon">💬</div>
            <h3>Démarrez la conversation</h3>
            <p>Décrivez votre problème à l'expert</p>
          </div>
        } @else {
          <div class="messages-list">
            @for (message of store.messages(); track message.id) {
              <div
                class="message"
                [class.sent]="message.senderType === 'client'"
                [class.received]="message.senderType !== 'client'"
              >
                <div class="message-bubble">
                  <p class="message-text">{{ message.content }}</p>
                  @if (message.attachments?.length) {
                    <div class="message-attachments">
                      @for (attachment of message.attachments; track attachment) {
                        <img [src]="attachment" alt="Attachment" class="attachment-image" />
                      }
                    </div>
                  }
                  <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Input -->
      <footer class="chat-input-container">
        @if (session()?.status === 'pending') {
          <div class="pending-notice">
            <span class="notice-icon">⏳</span>
            <span>En attente de confirmation de l'expert...</span>
          </div>
        } @else if (session()?.status === 'completed' || session()?.status === 'cancelled') {
          <div class="ended-notice">
            <span class="notice-icon">✓</span>
            <span>Cette session est terminée</span>
          </div>
        } @else {
          <button class="attach-btn" (click)="attachFile()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21.44 11.05L12.25 20.24C10.72 21.77 8.25 21.77 6.72 20.24C5.19 18.71 5.19 16.24 6.72 14.71L15.91 5.52C16.89 4.54 18.48 4.54 19.46 5.52C20.44 6.5 20.44 8.09 19.46 9.07L10.27 18.26C9.79 18.74 9.02 18.74 8.54 18.26C8.06 17.78 8.06 17.01 8.54 16.53L17.73 7.34" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <input
            type="text"
            [(ngModel)]="newMessage"
            (keyup.enter)="sendMessage()"
            placeholder="Écrivez votre message..."
            class="chat-input"
          />
          <button
            class="send-btn"
            (click)="sendMessage()"
            [disabled]="!newMessage.trim() || isSending()"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        }
      </footer>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #FAFAFA;
    }

    /* Bouton menu projeté dans ui-header [header-actions] */
    .menu-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      min-width: 44px;
      min-height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 12px;
      transition: all 150ms ease;
    }

    .menu-btn:hover {
      background: rgba(255, 152, 0, 0.18);
      border-color: var(--color-primary-500, #FF9800);
      color: var(--color-primary-500, #FF9800);
    }

    /* Bloc expert projeté dans ui-header [header-center] */
    .expert-info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }

    .expert-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .expert-avatar img,
    .avatar-placeholder {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800) 0%, var(--color-gold-800, #F9A825) 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .presence-dot {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid #1A1A1A;
      background: #9ca3af;
    }

    .presence-dot.online {
      background: var(--color-secondary, #4CAF50);
    }

    .expert-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .expert-name {
      font-weight: 600;
      color: white;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .session-status {
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.65);
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }

    .spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #EEEEEE;
      border-top-color: var(--color-primary-500, #FF9800);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-chat {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      text-align: center;
      padding: 2rem;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-chat h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .empty-chat p {
      color: #6b7280;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .message {
      display: flex;
      max-width: 85%;
    }

    .message.sent {
      margin-left: auto;
    }

    .message.received {
      margin-right: auto;
    }

    .message-bubble {
      padding: 0.75rem 1rem;
      border-radius: 16px;
    }

    .message.sent .message-bubble {
      background: var(--color-primary-500, #FF9800);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .message.received .message-bubble {
      background: white;
      color: #1f2937;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .message-text {
      margin: 0;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .message-attachments {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .attachment-image {
      max-width: 200px;
      max-height: 150px;
      border-radius: 12px;
      object-fit: cover;
    }

    .message-time {
      display: block;
      font-size: 0.625rem;
      opacity: 0.7;
      text-align: right;
      margin-top: 0.25rem;
    }

    .chat-input-container {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0));
      background: white;
      border-top: 1px solid #EEEEEE;
    }

    .pending-notice,
    .ended-notice {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
      background: #faf5ff;
      border-radius: 24px;
      color: var(--color-primary-500, #FF9800);
      font-size: 0.875rem;
    }

    .ended-notice {
      background: #F5F5F5;
      color: #6b7280;
    }

    .notice-icon {
      font-size: 1rem;
    }

    .attach-btn {
      background: none;
      border: none;
      color: #6b7280;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 50%;
    }

    .attach-btn:hover {
      background: #F5F5F5;
      color: var(--color-primary-500, #FF9800);
    }

    .chat-input {
      flex: 1;
      padding: 0.75rem 1rem;
      border: 1px solid #EEEEEE;
      border-radius: 24px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .chat-input:focus {
      border-color: var(--color-primary-500, #FF9800);
    }

    .send-btn {
      background: var(--color-primary-500, #FF9800);
      border: none;
      color: white;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      background: #6d28d9;
    }

    .send-btn:disabled {
      background: #D1D5DB;
      cursor: not-allowed;
    }
  `],
})
export class ConseilChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly conseilsService = inject(ConseilsService);
  readonly store = inject(ConseilsStore);
  readonly statusLabels = inject(StatusLabelsService);
  private readonly logger = inject(LoggerService);

  readonly session = signal<ConseilSession | null>(null);
  readonly isSending = signal(false);

  newMessage = '';
  private shouldScrollToBottom = false;

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('sessionId');
    if (sessionId) {
      this.loadSession(sessionId);
      this.loadMessages(sessionId);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  async loadSession(id: string): Promise<void> {
    // If we have a current session in store, use it
    const currentSession = this.store.currentSession();
    if (currentSession && currentSession.id === id) {
      this.session.set(currentSession);
      return;
    }

    try {
      const session = await this.conseilsService.getSession(id);
      this.session.set(session);
      this.store.setCurrentSession(session);
    } catch (err) {
      this.logger.error('ConseilChatComponent', 'Error loading session', err);
    }
  }

  async loadMessages(sessionId: string): Promise<void> {
    this.store.setIsLoadingMessages(true);
    try {
      const result = await this.conseilsService.getMessages(sessionId);
      this.store.setMessages(result.data);
      this.shouldScrollToBottom = true;
    } catch (err) {
      this.logger.error('ConseilChatComponent', 'Error loading messages', err);
    } finally {
      this.store.setIsLoadingMessages(false);
    }
  }

  async sendMessage(): Promise<void> {
    const content = this.newMessage.trim();
    if (!content) return;

    const sessionId = this.session()?.id;
    if (!sessionId) return;

    this.isSending.set(true);
    this.newMessage = '';

    try {
      const message = await this.conseilsService.sendMessage(sessionId, content);
      this.store.addMessage(message);
      this.shouldScrollToBottom = true;
    } catch (err) {
      this.logger.error('ConseilChatComponent', 'Error sending message', err);
      this.newMessage = content; // Restore message on error
    } finally {
      this.isSending.set(false);
    }
  }

  attachFile(): void {
    // TODO: Implement file attachment
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const element = this.messagesContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }

  getExpertInitials(): string {
    const expert = this.session()?.expert;
    if (expert) {
      return `${expert.firstName[0]}${expert.lastName[0]}`.toUpperCase();
    }
    return 'E';
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

}

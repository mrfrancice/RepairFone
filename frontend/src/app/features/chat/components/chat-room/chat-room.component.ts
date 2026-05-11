import { Component, inject, OnInit, OnDestroy, signal, ElementRef, ViewChild, AfterViewChecked, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChatService, ChatMessage, Conversation } from '../../services/chat.service';
import { ChatStore } from '../../stores/chat.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiHeaderComponent } from '../../../../shared/components/ui-header/ui-header.component';
import { FormatDatePipe } from '../../../../shared/pipes/format-date.pipe';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';
import { LoggerService } from '../../../../core/services/logger.service';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiLoadingComponent,
    UiHeaderComponent,
    FormatDatePipe,
    InitialsPipe,
  ],
  template: `
    <div class="chat-room">
      <!-- Header unifié (charte sombre via ui-header, mode inline pour layout flex) -->
      <ui-header [showBack]="true" backRoute="/chat" [inline]="true">
        @if (store.currentConversation()) {
          <div header-center class="conversation-info">
            <div class="avatar">
              @if (store.currentConversation()?.clientId === authStore.user()?.id) {
                {{ store.currentConversation()?.repairer?.firstName | initials : store.currentConversation()?.repairer?.lastName }}
              } @else {
                {{ store.currentConversation()?.client?.firstName | initials : store.currentConversation()?.client?.lastName }}
              }
            </div>
            <div class="info">
              <span class="name">{{ getConversationName() }}</span>
              @if (store.currentTypingUsers().length > 0) {
                <span class="typing">écrit...</span>
              } @else if (store.currentConversation()?.request?.device) {
                <span class="device">
                  {{ store.currentConversation()?.request?.device?.brand }}
                  {{ store.currentConversation()?.request?.device?.model }}
                </span>
              }
            </div>
          </div>
        }

        @if (store.currentConversation()?.request) {
          <button
            header-actions
            class="chat-action-btn"
            [routerLink]="['/requests', store.currentConversation()?.request?.id]"
            title="Voir la demande"
            aria-label="Voir la demande"
          >
            📋
          </button>
        }
      </ui-header>

      <!-- Messages -->
      <div class="messages-container" #messagesContainer>
        @if (store.isLoadingMessages()) {
          <div class="loading-container">
            <ui-loading size="md" />
          </div>
        }

        @if (store.hasMoreMessages() && !store.isLoadingMessages()) {
          <button class="load-more" (click)="loadMoreMessages()">
            Charger les messages précédents
          </button>
        }

        <div class="messages">
          @for (message of store.messages(); track message.id; let i = $index) {
            @if (shouldShowDate(message, i)) {
              <div class="date-separator">
                <span>{{ message.createdAt | formatDate:'relative' }}</span>
              </div>
            }

            <div
              class="message"
              [class.own]="isOwnMessage(message)"
              [class.other]="!isOwnMessage(message)"
            >
              <div class="message-bubble">
                @if (message.attachments?.length) {
                  <div class="attachments">
                    @for (attachment of message.attachments; track attachment.id) {
                      @if (attachment.type === 'image') {
                        <img
                          [src]="attachment.url"
                          [alt]="attachment.name || 'Image'"
                          class="attachment-image"
                          (click)="openImage(attachment.url)"
                        />
                      } @else {
                        <a
                          [href]="attachment.url"
                          target="_blank"
                          class="attachment-file"
                        >
                          <span class="file-icon">📎</span>
                          <span class="file-name">{{ attachment.name }}</span>
                        </a>
                      }
                    }
                  </div>
                }

                @if (message.content) {
                  <p class="content">{{ message.content }}</p>
                }

                <div class="message-meta">
                  <span class="time">{{ formatTime(message.createdAt) }}</span>
                  @if (isOwnMessage(message)) {
                    <span class="status">
                      @if (message.readAt) {
                        ✓✓
                      } @else {
                        ✓
                      }
                    </span>
                  }
                </div>
              </div>
            </div>
          }

          @if (store.currentTypingUsers().length > 0) {
            <div class="message other">
              <div class="message-bubble typing-bubble">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Input -->
      <div class="input-container">
        @if (selectedImages().length > 0) {
          <div class="selected-images">
            @for (image of selectedImages(); track $index) {
              <div class="preview-item">
                <img [src]="image.preview" alt="Preview" />
                <button class="remove-btn" (click)="removeImage($index)">×</button>
              </div>
            }
          </div>
        }

        <div class="input-row">
          <input
            type="file"
            #fileInput
            accept="image/*"
            multiple
            hidden
            (change)="onFilesSelected($event)"
          />

          <button class="attach-btn" (click)="fileInput.click()">
            📷
          </button>

          <input
            type="text"
            [(ngModel)]="messageText"
            placeholder="Écrivez votre message..."
            class="message-input"
            (keyup.enter)="sendMessage()"
            (input)="onTyping()"
          />

          <button
            class="send-btn"
            [disabled]="!canSend()"
            (click)="sendMessage()"
          >
            @if (store.isSending()) {
              <ui-loading size="sm" />
            } @else {
              ➤
            }
          </button>
        </div>
      </div>

      <!-- Connection status -->
      @if (chatService.connectionError()) {
        <div class="connection-error">
          <span class="icon">⚠️</span>
          <span>{{ chatService.connectionError() }}</span>
          <button class="retry-btn" (click)="reconnect()">Réessayer</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .chat-room {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #FAFAFA;
    }

    /* Bloc avatar+nom projeté dans ui-header [header-center] */
    .conversation-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;

      .avatar {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 0.875rem;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(255, 152, 0, 0.35);
      }

      .info {
        display: flex;
        flex-direction: column;
        min-width: 0;

        .name {
          font-weight: 600;
          color: white;
          font-size: 0.9375rem;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .device {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.65);
        }

        .typing {
          font-size: 0.75rem;
          color: var(--color-primary-500, #FF9800);
          font-style: italic;
        }
      }
    }

    /* Bouton action projeté dans ui-header [header-actions] */
    .chat-action-btn {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 8px;
      min-width: 44px;
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 1rem;
    }

    .load-more {
      display: block;
      width: 100%;
      padding: 0.75rem;
      background: white;
      border: 2px solid #EEEEEE;
      border-radius: 0.75rem;
      color: var(--color-primary-500, #FF9800);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 1rem;
      transition: all 0.2s;

      &:hover {
        background: #FFF3E0;
        border-color: var(--color-primary-500, #FF9800);
      }
    }

    .messages {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .date-separator {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 1rem 0;

      span {
        background: #EEEEEE;
        color: #6B7280;
        font-size: 0.75rem;
        padding: 0.25rem 0.75rem;
        border-radius: 1rem;
      }
    }

    .message {
      display: flex;
      max-width: 80%;

      &.own {
        align-self: flex-end;

        .message-bubble {
          background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
          color: white;
          border-bottom-right-radius: 0.25rem;
          box-shadow: 0 2px 8px rgba(255, 152, 0, 0.2);

          .message-meta {
            color: rgba(255, 255, 255, 0.8);

            .status {
              color: rgba(255, 255, 255, 0.95);
            }
          }
        }
      }

      &.other {
        align-self: flex-start;

        .message-bubble {
          background: white;
          color: #1F2937;
          border-bottom-left-radius: 0.25rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

          .message-meta {
            color: #9CA3AF;
          }
        }
      }
    }

    .message-bubble {
      padding: 0.625rem 0.875rem;
      border-radius: 1rem;
      max-width: 100%;

      .attachments {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }

      .attachment-image {
        max-width: 200px;
        max-height: 200px;
        border-radius: 0.5rem;
        cursor: pointer;
        object-fit: cover;
      }

      .attachment-file {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: rgba(0, 0, 0, 0.1);
        border-radius: 0.5rem;
        text-decoration: none;
        color: inherit;

        .file-icon {
          font-size: 1.25rem;
        }

        .file-name {
          font-size: 0.8125rem;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .content {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.4;
        word-wrap: break-word;
      }

      .message-meta {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.25rem;
        margin-top: 0.25rem;
        font-size: 0.6875rem;

        .status {
          font-size: 0.625rem;
        }
      }
    }

    .typing-bubble {
      padding: 0.75rem 1rem;

      .typing-indicator {
        display: flex;
        gap: 0.25rem;

        span {
          width: 0.5rem;
          height: 0.5rem;
          background: #9CA3AF;
          border-radius: 50%;
          animation: typing 1.4s infinite ease-in-out;

          &:nth-child(1) { animation-delay: 0s; }
          &:nth-child(2) { animation-delay: 0.2s; }
          &:nth-child(3) { animation-delay: 0.4s; }
        }
      }
    }

    @keyframes typing {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-0.5rem); }
    }

    .input-container {
      background: white;
      border-top: 1px solid #EEEEEE;
      padding: 0.75rem 1rem;
      padding-bottom: max(0.75rem, env(safe-area-inset-bottom));

      .selected-images {
        display: flex;
        gap: 0.5rem;
        padding-bottom: 0.75rem;
        overflow-x: auto;

        .preview-item {
          position: relative;
          flex-shrink: 0;

          img {
            width: 4rem;
            height: 4rem;
            object-fit: cover;
            border-radius: 0.5rem;
          }

          .remove-btn {
            position: absolute;
            top: -0.5rem;
            right: -0.5rem;
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 50%;
            background: var(--color-error, #F44336);
            color: white;
            border: none;
            font-size: 0.875rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }
      }

      .input-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .attach-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        padding: 0.5rem;
      }

      .message-input {
        flex: 1;
        padding: 0.75rem 1rem;
        border: 2px solid #EEEEEE;
        border-radius: 1.5rem;
        font-size: 0.9375rem;
        outline: none;
        transition: all 0.2s;

        &:focus {
          border-color: var(--color-primary-500, #FF9800);
          box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
        }
      }

      .send-btn {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
        color: white;
        border: none;
        font-size: 1.125rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
        transition: all 0.2s;

        &:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
        }

        &:disabled {
          background: #9CA3AF;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
      }
    }

    .connection-error {
      position: fixed;
      bottom: 5rem;
      left: 1rem;
      right: 1rem;
      background: #FFEBEE;
      border: 1px solid #FFCDD2;
      color: var(--color-terracotta, #C62828);
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;

      .icon {
        font-size: 1rem;
      }

      .retry-btn {
        margin-left: auto;
        background: var(--color-terracotta, #C62828);
        color: white;
        border: none;
        padding: 0.375rem 0.75rem;
        border-radius: 0.25rem;
        font-size: 0.8125rem;
        cursor: pointer;
      }
    }
  `]
})
export class ChatRoomComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  readonly chatService = inject(ChatService);
  readonly store = inject(ChatStore);
  readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly logger = inject(LoggerService);

  messageText = '';
  selectedImages = signal<{ file: File; preview: string }[]>([]);

  private messageUnsubscribe?: () => void;
  private typingUnsubscribe?: () => void;
  private typingTimeout?: any;
  private shouldScrollToBottom = false;

  ngOnInit(): void {
    const conversationId = this.route.snapshot.paramMap.get('id');
    if (conversationId) {
      this.loadConversation(conversationId);
      this.setupRealTimeListeners();
    } else {
      this.router.navigate(['/chat']);
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.messageUnsubscribe?.();
    this.typingUnsubscribe?.();
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    this.chatService.sendStopTyping(this.store.currentConversation()?.id || '');
    this.store.clearCurrentConversation();
  }

  private async loadConversation(id: string): Promise<void> {
    this.store.setLoadingMessages(true);

    try {
      const conversation = await this.chatService.getConversation(id);
      this.store.setCurrentConversation(conversation);

      const { data, hasMore } = await this.chatService.getMessages(id);
      this.store.setMessages(data, hasMore);

      this.shouldScrollToBottom = true;

      // Mark as read
      await this.chatService.markAsRead(id);
    } catch (err) {
      this.logger.error('ChatRoomComponent', 'Error loading conversation', err);
      this.router.navigate(['/chat']);
    } finally {
      this.store.setLoadingMessages(false);
    }
  }

  private setupRealTimeListeners(): void {
    // Listen for new messages
    this.messageUnsubscribe = this.chatService.onMessage((message) => {
      if (message.conversationId === this.store.currentConversation()?.id) {
        this.store.addMessage(message);
        this.shouldScrollToBottom = true;

        // Mark as read immediately
        this.chatService.markAsRead(message.conversationId);
      }
    });

    // Listen for typing events
    this.typingUnsubscribe = this.chatService.onTyping((data) => {
      if (data.userId !== this.authStore.user()?.id) {
        this.store.setUserTyping(data.conversationId, data.userId, data.isTyping);
      }
    });
  }

  async loadMoreMessages(): Promise<void> {
    const messages = this.store.messages();
    if (messages.length === 0) return;

    const oldestMessage = messages[0];
    const conversationId = this.store.currentConversation()?.id;
    if (!conversationId) return;

    this.store.setLoadingMessages(true);

    try {
      const { data, hasMore } = await this.chatService.getMessages(conversationId, {
        before: oldestMessage.id,
        limit: 20,
      });
      this.store.prependMessages(data, hasMore);
    } catch (err) {
      this.logger.error('ChatRoomComponent', 'Error loading more messages', err);
    } finally {
      this.store.setLoadingMessages(false);
    }
  }

  async sendMessage(): Promise<void> {
    const content = this.messageText.trim();
    const images = this.selectedImages();

    if (!content && images.length === 0) return;

    const conversationId = this.store.currentConversation()?.id;
    if (!conversationId) return;

    this.store.setSending(true);
    this.chatService.sendStopTyping(conversationId);

    try {
      // Upload chaque image sélectionnée et collecte les URLs serveur.
      // Parallélisé pour rester rapide même avec plusieurs photos.
      let attachmentUrls: string[] | undefined;
      if (images.length > 0) {
        attachmentUrls = await Promise.all(
          images.map((img) => this.chatService.uploadAttachment(conversationId, img.file)),
        );
      }

      await this.chatService.sendMessage({
        conversationId,
        content,
        attachments: attachmentUrls,
      });

      this.messageText = '';
      // Libère les blob: URLs créées en preview pour éviter les fuites mémoire.
      images.forEach((img) => URL.revokeObjectURL(img.preview));
      this.selectedImages.set([]);
      this.shouldScrollToBottom = true;
    } catch (err) {
      this.logger.error('ChatRoomComponent', 'Error sending message', err);
    } finally {
      this.store.setSending(false);
    }
  }

  onTyping(): void {
    const conversationId = this.store.currentConversation()?.id;
    if (!conversationId) return;

    this.chatService.sendTyping(conversationId);

    // Clear previous timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Stop typing after 2 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.chatService.sendStopTyping(conversationId);
    }, 2000);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const currentImages = this.selectedImages();
    const newImages: { file: File; preview: string }[] = [];

    Array.from(input.files).forEach((file) => {
      if (currentImages.length + newImages.length >= 5) return;

      const preview = URL.createObjectURL(file);
      newImages.push({ file, preview });
    });

    this.selectedImages.set([...currentImages, ...newImages]);
    input.value = '';
  }

  removeImage(index: number): void {
    const images = this.selectedImages();
    URL.revokeObjectURL(images[index].preview);
    this.selectedImages.set(images.filter((_, i) => i !== index));
  }

  canSend(): boolean {
    return (this.messageText.trim().length > 0 || this.selectedImages().length > 0) &&
      !this.store.isSending();
  }

  getConversationName(): string {
    const conversation = this.store.currentConversation();
    if (!conversation) return '';

    const currentUserId = this.authStore.user()?.id || '';
    return this.chatService.getConversationName(conversation, currentUserId);
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.senderId === this.authStore.user()?.id;
  }

  shouldShowDate(message: ChatMessage, index: number): boolean {
    if (index === 0) return true;

    const messages = this.store.messages();
    const prevMessage = messages[index - 1];

    const currentDate = new Date(message.createdAt).toDateString();
    const prevDate = new Date(prevMessage.createdAt).toDateString();

    return currentDate !== prevDate;
  }

  formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  openImage(url: string): void {
    window.open(url, '_blank');
  }

  reconnect(): void {
    const token = this.authStore.token();
    if (token) {
      this.chatService.connect(token);
    }
  }

  private scrollToBottom(): void {
    try {
      const container = this.messagesContainer?.nativeElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    } catch (err) {
      this.logger.error('ChatRoomComponent', 'Error scrolling to bottom', err);
    }
  }
}

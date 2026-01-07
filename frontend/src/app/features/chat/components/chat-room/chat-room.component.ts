import { Component, inject, OnInit, OnDestroy, signal, ElementRef, ViewChild, AfterViewChecked, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ChatService, ChatMessage, Conversation } from '../../services/chat.service';
import { ChatStore } from '../../stores/chat.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    UiLoadingComponent,
  ],
  template: `
    <div class="chat-room">
      <!-- Header -->
      <header class="header">
        <button class="back-btn" routerLink="/chat">
          <span class="icon">←</span>
        </button>

        @if (store.currentConversation()) {
          <div class="conversation-info">
            <div class="avatar">
              {{ getInitials() }}
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

        <div class="header-actions">
          @if (store.currentConversation()?.request) {
            <button
              class="action-btn"
              [routerLink]="['/requests', store.currentConversation()?.request?.id]"
              title="Voir la demande"
            >
              📋
            </button>
          }
        </div>
      </header>

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
                <span>{{ formatDate(message.createdAt) }}</span>
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
      background: #f9fafb;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;
      min-height: 3.5rem;

      .back-btn {
        background: none;
        border: none;
        font-size: 1.25rem;
        color: #64748b;
        cursor: pointer;
        padding: 0.25rem;
      }

      .conversation-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;

        .avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 50%;
          background: linear-gradient(135deg, #FF6B35, #FF9800);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
        }

        .info {
          display: flex;
          flex-direction: column;

          .name {
            font-weight: 600;
            color: #1e293b;
            font-size: 0.9375rem;
          }

          .device {
            font-size: 0.75rem;
            color: #64748b;
          }

          .typing {
            font-size: 0.75rem;
            color: #FF6B35;
            font-style: italic;
          }
        }
      }

      .header-actions {
        .action-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.5rem;
        }
      }
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
      border: 2px solid #e5e7eb;
      border-radius: 0.75rem;
      color: #FF6B35;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      margin-bottom: 1rem;
      transition: all 0.2s;

      &:hover {
        background: #fff5f0;
        border-color: #FF6B35;
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
        background: #e5e7eb;
        color: #64748b;
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
          background: linear-gradient(135deg, #FF6B35, #FF9800);
          color: white;
          border-bottom-right-radius: 0.25rem;
          box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2);

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
          color: #1e293b;
          border-bottom-left-radius: 0.25rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

          .message-meta {
            color: #94a3b8;
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
          background: #94a3b8;
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
      border-top: 1px solid #e5e7eb;
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
            background: #ef4444;
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
        border: 2px solid #e5e7eb;
        border-radius: 1.5rem;
        font-size: 0.9375rem;
        outline: none;
        transition: all 0.2s;

        &:focus {
          border-color: #FF6B35;
          box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
        }
      }

      .send-btn {
        width: 2.5rem;
        height: 2.5rem;
        border-radius: 50%;
        background: linear-gradient(135deg, #FF6B35, #FF9800);
        color: white;
        border: none;
        font-size: 1.125rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
        transition: all 0.2s;

        &:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
        }

        &:disabled {
          background: #94a3b8;
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
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
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
        background: #dc2626;
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
  private readonly authStore = inject(AuthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
      console.error('Error loading conversation:', err);
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
      console.error('Error loading more messages:', err);
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
      // In a real app, upload images first and get URLs
      const attachmentUrls = images.length > 0 ? ['placeholder-url'] : undefined;

      await this.chatService.sendMessage({
        conversationId,
        content,
        attachments: attachmentUrls,
      });

      this.messageText = '';
      this.selectedImages.set([]);
      this.shouldScrollToBottom = true;
    } catch (err) {
      console.error('Error sending message:', err);
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

  getInitials(): string {
    const conversation = this.store.currentConversation();
    if (!conversation) return '?';

    const currentUserId = this.authStore.user()?.id || '';

    if (conversation.clientId === currentUserId) {
      const name = conversation.repairer?.repairerProfile?.businessName ||
        `${conversation.repairer?.firstName || ''} ${conversation.repairer?.lastName || ''}`;
      return this.extractInitials(name);
    } else {
      const firstName = conversation.client?.firstName || '';
      const lastName = conversation.client?.lastName || '';
      return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || '?';
    }
  }

  private extractInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase() || '?';
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

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';

    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
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
      console.error('Error scrolling to bottom:', err);
    }
  }
}

import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChatService, Conversation } from '../../services/chat.service';
import { ChatStore } from '../../stores/chat.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiEmptyStateComponent } from '../../../../shared/components/ui-empty-state/ui-empty-state.component';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    UiLoadingComponent,
    UiEmptyStateComponent,
  ],
  template: `
    <div class="chat-list">
      <!-- Header -->
      <header class="header">
        <h1>Messages</h1>
        @if (store.totalUnreadCount() > 0) {
          <span class="unread-badge">{{ store.totalUnreadCount() }}</span>
        }
      </header>

      <!-- Loading -->
      @if (store.isLoadingConversations()) {
        <div class="loading-container">
          <ui-loading size="lg" text="Chargement des conversations..." />
        </div>
      }

      <!-- Empty state -->
      @if (!store.isLoadingConversations() && !store.hasConversations()) {
        <ui-empty-state
          icon="💬"
          title="Aucune conversation"
          description="Vos conversations avec les réparateurs apparaîtront ici"
        />
      }

      <!-- Conversations list -->
      @if (!store.isLoadingConversations() && store.hasConversations()) {
        <div class="conversations">
          @for (conversation of store.sortedConversations(); track conversation.id) {
            <div
              class="conversation-item"
              [class.unread]="conversation.unreadCount > 0"
              [routerLink]="['/chat', conversation.id]"
            >
              <div class="avatar">
                {{ getInitials(conversation) }}
              </div>

              <div class="conversation-content">
                <div class="conversation-header">
                  <span class="name">{{ getConversationName(conversation) }}</span>
                  <span class="time">{{ chatService.formatMessageTime(conversation.lastMessage?.createdAt || conversation.updatedAt) }}</span>
                </div>

                <div class="conversation-preview">
                  @if (conversation.request?.device) {
                    <span class="device-tag">
                      {{ conversation.request?.device?.brand }} {{ conversation.request?.device?.model }}
                    </span>
                  }

                  @if (conversation.lastMessage) {
                    <p class="last-message">
                      @if (isOwnMessage(conversation.lastMessage)) {
                        <span class="you">Vous: </span>
                      }
                      {{ conversation.lastMessage.content | slice:0:50 }}{{ conversation.lastMessage.content.length > 50 ? '...' : '' }}
                    </p>
                  } @else {
                    <p class="last-message empty">Nouvelle conversation</p>
                  }
                </div>
              </div>

              @if (conversation.unreadCount > 0) {
                <div class="unread-count">
                  {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- Connection status -->
      @if (chatService.connectionError()) {
        <div class="connection-error">
          <span class="icon">⚠️</span>
          <span>{{ chatService.connectionError() }}</span>
        </div>
      }
    </div>
  `,
  styles: [`
    .chat-list {
      min-height: 100vh;
      background: #f9fafb;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem 1rem 1rem;
      background: white;
      border-bottom: 1px solid #e5e7eb;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0;
      }

      .unread-badge {
        background: #FF6B35;
        color: white;
        font-size: 0.75rem;
        font-weight: 600;
        padding: 0.125rem 0.5rem;
        border-radius: 9999px;
        box-shadow: 0 2px 4px rgba(255, 107, 53, 0.3);
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

    .conversations {
      background: white;
    }

    .conversation-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: #f8fafc;
      }

      &.unread {
        background: #fff5f0;
        border-left: 3px solid #FF6B35;

        .name {
          font-weight: 700;
          color: #1e293b;
        }

        .last-message {
          font-weight: 500;
          color: #1e293b;
        }
      }
    }

    .avatar {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3);
    }

    .conversation-content {
      flex: 1;
      min-width: 0;
    }

    .conversation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;

      .name {
        font-weight: 600;
        color: #1e293b;
        font-size: 0.9375rem;
      }

      .time {
        font-size: 0.75rem;
        color: #94a3b8;
      }
    }

    .conversation-preview {
      .device-tag {
        display: inline-block;
        font-size: 0.6875rem;
        color: #64748b;
        background: #f1f5f9;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        margin-bottom: 0.25rem;
      }

      .last-message {
        font-size: 0.8125rem;
        color: #64748b;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        .you {
          color: #94a3b8;
        }

        &.empty {
          font-style: italic;
          color: #94a3b8;
        }
      }
    }

    .unread-count {
      background: linear-gradient(135deg, #FF6B35, #FF9800);
      color: white;
      font-size: 0.6875rem;
      font-weight: 700;
      min-width: 1.25rem;
      height: 1.25rem;
      border-radius: 9999px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 0.25rem;
      box-shadow: 0 2px 6px rgba(255, 107, 53, 0.4);
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
    }
  `]
})
export class ChatListComponent implements OnInit {
  readonly chatService = inject(ChatService);
  readonly store = inject(ChatStore);
  private readonly authStore = inject(AuthStore);

  ngOnInit(): void {
    this.loadConversations();
  }

  async loadConversations(): Promise<void> {
    this.store.setLoadingConversations(true);

    try {
      const conversations = await this.chatService.getConversations();
      this.store.setConversations(conversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
    } finally {
      this.store.setLoadingConversations(false);
    }
  }

  getConversationName(conversation: Conversation): string {
    const currentUserId = this.authStore.user()?.id || '';
    return this.chatService.getConversationName(conversation, currentUserId);
  }

  getInitials(conversation: Conversation): string {
    const currentUserId = this.authStore.user()?.id || '';

    if (conversation.clientId === currentUserId) {
      // Show repairer initials
      const name = conversation.repairer?.repairerProfile?.businessName ||
        `${conversation.repairer?.firstName || ''} ${conversation.repairer?.lastName || ''}`;
      return this.extractInitials(name);
    } else {
      // Show client initials
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

  isOwnMessage(message: any): boolean {
    return message.senderId === this.authStore.user()?.id;
  }
}

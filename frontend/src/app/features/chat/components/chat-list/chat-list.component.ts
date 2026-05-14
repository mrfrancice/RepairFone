import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChatService, ChatStore, type Conversation } from '@app/domains/chat';
import { AuthStore } from '../../../../core/stores/auth.store';
import { UiLoadingComponent } from '../../../../shared/components/ui-loading/ui-loading.component';
import { UiEmptyStateComponent } from '../../../../shared/components/ui-empty-state/ui-empty-state.component';
import { UiErrorStateComponent } from '../../../../shared/components/ui-error-state/ui-error-state.component';
import { InitialsPipe } from '../../../../shared/pipes/initials.pipe';
import { LoggerService } from '../../../../core/services/logger.service';
import { UiHeaderComponent } from '@app/features/common/components';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    UiLoadingComponent,
    UiEmptyStateComponent,
    UiErrorStateComponent,
    InitialsPipe,
    UiHeaderComponent,
  ],
  template: `
    <div class="chat-list">
      <ui-header title="Messages">
        @if (store.totalUnreadCount() > 0) {
          <span header-actions class="unread-badge">{{ store.totalUnreadCount() }}</span>
        }
      </ui-header>

      <!-- Loading -->
      @if (store.isLoadingConversations()) {
        <div class="loading-container">
          <ui-loading size="lg" text="Chargement des conversations..." />
        </div>
      }

      <!-- Error state -->
      @if (!store.isLoadingConversations() && error()) {
        <ui-error-state
          [message]="error()!"
          severity="error"
          [showRetry]="true"
          (onRetry)="loadConversations()"
        />
      }

      <!-- Empty state -->
      @if (!store.isLoadingConversations() && !error() && !store.hasConversations()) {
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
                @if (conversation.clientId === authStore.user()?.id) {
                  {{ conversation.repairer?.firstName | initials : conversation.repairer?.lastName }}
                } @else {
                  {{ conversation.client?.firstName | initials : conversation.client?.lastName }}
                }
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
      background: #FAFAFA;
      padding-top: var(--header-height, 100px);
    }

    .unread-badge {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), var(--color-gold-800, #F9A825));
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.125rem 0.5rem;
      border-radius: 9999px;
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.35);
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: #6B7280;
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
        background: #FFF3E0;
        border-left: 3px solid var(--color-primary-500, #FF9800);

        .name {
          font-weight: 700;
          color: #1F2937;
        }

        .last-message {
          font-weight: 500;
          color: #1F2937;
        }
      }
    }

    .avatar {
      width: 3rem;
      height: 3rem;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), #FF9800);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 1rem;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
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
        color: #1F2937;
        font-size: 0.9375rem;
      }

      .time {
        font-size: 0.75rem;
        color: #9CA3AF;
      }
    }

    .conversation-preview {
      .device-tag {
        display: inline-block;
        font-size: 0.6875rem;
        color: #6B7280;
        background: #f1f5f9;
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
        margin-bottom: 0.25rem;
      }

      .last-message {
        font-size: 0.8125rem;
        color: #6B7280;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        .you {
          color: #9CA3AF;
        }

        &.empty {
          font-style: italic;
          color: #9CA3AF;
        }
      }
    }

    .unread-count {
      background: linear-gradient(135deg, var(--color-primary-500, #FF9800), #FF9800);
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
      box-shadow: 0 2px 6px rgba(255, 152, 0, 0.4);
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
    }
  `]
})
export class ChatListComponent implements OnInit {
  readonly chatService = inject(ChatService);
  readonly store = inject(ChatStore);
  readonly authStore = inject(AuthStore);
  private readonly logger = inject(LoggerService);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadConversations();
  }

  async loadConversations(): Promise<void> {
    this.store.setLoadingConversations(true);
    this.error.set(null);

    try {
      const conversations = await this.chatService.getConversations();
      this.store.setConversations(conversations);
    } catch (err) {
      this.logger.error('ChatListComponent', 'Error loading conversations', err);
      this.error.set('Impossible de charger les conversations');
    } finally {
      this.store.setLoadingConversations(false);
    }
  }

  getConversationName(conversation: Conversation): string {
    const currentUserId = this.authStore.user()?.id || '';
    return this.chatService.getConversationName(conversation, currentUserId);
  }

  isOwnMessage(message: any): boolean {
    return message.senderId === this.authStore.user()?.id;
  }
}

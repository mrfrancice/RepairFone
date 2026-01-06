import { Injectable, signal, computed } from '@angular/core';
import { Conversation, ChatMessage } from '../services/chat.service';

@Injectable({ providedIn: 'root' })
export class ChatStore {
  // Conversations
  private readonly _conversations = signal<Conversation[]>([]);
  private readonly _currentConversation = signal<Conversation | null>(null);

  // Messages
  private readonly _messages = signal<ChatMessage[]>([]);
  private readonly _hasMoreMessages = signal(false);

  // UI state
  private readonly _isLoadingConversations = signal(false);
  private readonly _isLoadingMessages = signal(false);
  private readonly _isSending = signal(false);
  private readonly _typingUsers = signal<Map<string, Set<string>>>(new Map());

  // Public selectors
  readonly conversations = this._conversations.asReadonly();
  readonly currentConversation = this._currentConversation.asReadonly();
  readonly messages = this._messages.asReadonly();
  readonly hasMoreMessages = this._hasMoreMessages.asReadonly();
  readonly isLoadingConversations = this._isLoadingConversations.asReadonly();
  readonly isLoadingMessages = this._isLoadingMessages.asReadonly();
  readonly isSending = this._isSending.asReadonly();

  // Computed
  readonly totalUnreadCount = computed(() =>
    this._conversations().reduce((sum, c) => sum + c.unreadCount, 0)
  );

  readonly hasConversations = computed(() =>
    this._conversations().length > 0
  );

  readonly sortedConversations = computed(() =>
    [...this._conversations()].sort((a, b) => {
      const dateA = a.lastMessage?.createdAt || a.updatedAt;
      const dateB = b.lastMessage?.createdAt || b.updatedAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
  );

  readonly currentTypingUsers = computed(() => {
    const conversation = this._currentConversation();
    if (!conversation) return [];

    const typingMap = this._typingUsers();
    const userIds = typingMap.get(conversation.id);
    return userIds ? Array.from(userIds) : [];
  });

  // Actions - Conversations
  setConversations(conversations: Conversation[]): void {
    this._conversations.set(conversations);
  }

  setLoadingConversations(loading: boolean): void {
    this._isLoadingConversations.set(loading);
  }

  addConversation(conversation: Conversation): void {
    this._conversations.update(conversations => {
      // Check if already exists
      const exists = conversations.some(c => c.id === conversation.id);
      if (exists) {
        return conversations.map(c =>
          c.id === conversation.id ? conversation : c
        );
      }
      return [conversation, ...conversations];
    });
  }

  updateConversation(id: string, updates: Partial<Conversation>): void {
    this._conversations.update(conversations =>
      conversations.map(c =>
        c.id === id ? { ...c, ...updates } : c
      )
    );

    if (this._currentConversation()?.id === id) {
      this._currentConversation.update(c =>
        c ? { ...c, ...updates } : null
      );
    }
  }

  setCurrentConversation(conversation: Conversation | null): void {
    this._currentConversation.set(conversation);
    if (conversation) {
      // Reset unread count for this conversation
      this.updateConversation(conversation.id, { unreadCount: 0 });
    }
  }

  // Actions - Messages
  setMessages(messages: ChatMessage[], hasMore: boolean): void {
    this._messages.set(messages);
    this._hasMoreMessages.set(hasMore);
  }

  prependMessages(messages: ChatMessage[], hasMore: boolean): void {
    this._messages.update(current => [...messages, ...current]);
    this._hasMoreMessages.set(hasMore);
  }

  addMessage(message: ChatMessage): void {
    this._messages.update(messages => [...messages, message]);

    // Update conversation's last message
    this.updateConversation(message.conversationId, {
      lastMessage: message,
      updatedAt: message.createdAt,
    });

    // If message is for a different conversation, increment unread
    if (this._currentConversation()?.id !== message.conversationId) {
      this._conversations.update(conversations =>
        conversations.map(c =>
          c.id === message.conversationId
            ? { ...c, unreadCount: c.unreadCount + 1 }
            : c
        )
      );
    }
  }

  updateMessage(id: string, updates: Partial<ChatMessage>): void {
    this._messages.update(messages =>
      messages.map(m =>
        m.id === id ? { ...m, ...updates } : m
      )
    );
  }

  setLoadingMessages(loading: boolean): void {
    this._isLoadingMessages.set(loading);
  }

  setSending(sending: boolean): void {
    this._isSending.set(sending);
  }

  // Actions - Typing
  setUserTyping(conversationId: string, userId: string, isTyping: boolean): void {
    this._typingUsers.update(typingMap => {
      const newMap = new Map(typingMap);
      const userSet = newMap.get(conversationId) || new Set();

      if (isTyping) {
        userSet.add(userId);
      } else {
        userSet.delete(userId);
      }

      if (userSet.size > 0) {
        newMap.set(conversationId, userSet);
      } else {
        newMap.delete(conversationId);
      }

      return newMap;
    });
  }

  // Reset
  clearCurrentConversation(): void {
    this._currentConversation.set(null);
    this._messages.set([]);
    this._hasMoreMessages.set(false);
  }

  reset(): void {
    this._conversations.set([]);
    this._currentConversation.set(null);
    this._messages.set([]);
    this._hasMoreMessages.set(false);
    this._isLoadingConversations.set(false);
    this._isLoadingMessages.set(false);
    this._isSending.set(false);
    this._typingUsers.set(new Map());
  }
}

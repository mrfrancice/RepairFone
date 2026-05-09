import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { LoggerService } from '../../../core/services/logger.service';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'client' | 'repairer';
  content: string;
  attachments?: ChatAttachment[];
  readAt?: string;
  createdAt: string;
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name?: string;
  size?: number;
}

export interface Conversation {
  id: string;
  requestId: string;
  clientId: string;
  repairerId: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  client?: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };
  repairer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    repairerProfile?: {
      businessName?: string;
    };
  };
  request?: {
    id: string;
    status: string;
    device?: { brand: string; model: string };
    serviceType?: { name: string };
  };
}

export interface SendMessageDto {
  conversationId: string;
  content: string;
  attachments?: string[];
}

type WebSocketMessage =
  | { type: 'new_message'; data: ChatMessage }
  | { type: 'message_read'; data: { messageId: string; readAt: string } }
  | { type: 'typing'; data: { conversationId: string; userId: string } }
  | { type: 'stop_typing'; data: { conversationId: string; userId: string } };

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly logger = inject(LoggerService);
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private reconnectTimeout: any;
  private pingInterval: any;

  // State
  readonly isConnected = signal(false);
  readonly isConnecting = signal(false);
  readonly connectionError = signal<string | null>(null);

  // Callbacks for real-time events
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private typingCallbacks: ((data: { conversationId: string; userId: string; isTyping: boolean }) => void)[] = [];

  // Connect to WebSocket
  connect(token: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting.set(true);
    this.connectionError.set(null);

    // In production, use wss:// and actual server URL
    const wsUrl = `wss://api.repairfone.ci/ws?token=${token}`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected.set(true);
        this.isConnecting.set(false);
        this.reconnectAttempts = 0;

        // Start ping interval to keep connection alive
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (err) {
          this.logger.error('ChatService', 'Failed to parse WebSocket message', err);
        }
      };

      this.ws.onclose = (event) => {
        this.isConnected.set(false);
        this.isConnecting.set(false);
        this.stopPingInterval();

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect(token);
        } else {
          this.connectionError.set('Connexion perdue. Veuillez rafraîchir la page.');
        }
      };

      this.ws.onerror = (error) => {
        this.logger.error('ChatService', 'WebSocket error', error);
        this.connectionError.set('Erreur de connexion');
      };
    } catch (err) {
      this.logger.error('ChatService', 'Failed to create WebSocket', err);
      this.isConnecting.set(false);
      this.connectionError.set('Impossible de se connecter au chat');
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'new_message':
        this.messageCallbacks.forEach(cb => cb(message.data));
        break;
      case 'typing':
        this.typingCallbacks.forEach(cb => cb({
          conversationId: message.data.conversationId,
          userId: message.data.userId,
          isTyping: true,
        }));
        break;
      case 'stop_typing':
        this.typingCallbacks.forEach(cb => cb({
          conversationId: message.data.conversationId,
          userId: message.data.userId,
          isTyping: false,
        }));
        break;
    }
  }

  private scheduleReconnect(token: string): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.reconnectTimeout = setTimeout(() => {
      this.connect(token);
    }, delay);
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  disconnect(): void {
    this.stopPingInterval();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected.set(false);
  }

  // Subscribe to new messages
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(cb => cb !== callback);
    };
  }

  // Subscribe to typing events
  onTyping(callback: (data: { conversationId: string; userId: string; isTyping: boolean }) => void): () => void {
    this.typingCallbacks.push(callback);
    return () => {
      this.typingCallbacks = this.typingCallbacks.filter(cb => cb !== callback);
    };
  }

  // Send typing indicator
  sendTyping(conversationId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'typing',
        conversationId,
      }));
    }
  }

  // Send stop typing indicator
  sendStopTyping(conversationId: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'stop_typing',
        conversationId,
      }));
    }
  }

  // REST API methods

  async getConversations(): Promise<Conversation[]> {
    return firstValueFrom(
      this.api.get<Conversation[]>('/chat/conversations')
    );
  }

  async getConversation(id: string): Promise<Conversation> {
    return firstValueFrom(
      this.api.get<Conversation>(`/chat/conversations/${id}`)
    );
  }

  async getOrCreateConversation(requestId: string): Promise<Conversation> {
    return firstValueFrom(
      this.api.post<Conversation>('/chat/conversations', { requestId })
    );
  }

  async getMessages(conversationId: string, params?: {
    before?: string;
    limit?: number;
  }): Promise<{ data: ChatMessage[]; hasMore: boolean }> {
    return firstValueFrom(
      this.api.get<{ data: ChatMessage[]; hasMore: boolean }>(
        `/chat/conversations/${conversationId}/messages`,
        params
      )
    );
  }

  async sendMessage(dto: SendMessageDto): Promise<ChatMessage> {
    return firstValueFrom(
      this.api.post<ChatMessage>(
        `/chat/conversations/${dto.conversationId}/messages`,
        { content: dto.content, attachments: dto.attachments }
      )
    );
  }

  async markAsRead(conversationId: string): Promise<void> {
    return firstValueFrom(
      this.api.post<void>(`/chat/conversations/${conversationId}/read`, {})
    );
  }

  async getTotalUnreadCount(): Promise<number> {
    const result = await firstValueFrom(
      this.api.get<{ count: number }>('/chat/unread-count')
    );
    return result.count;
  }

  // Helper methods
  formatMessageTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `${diffDays}j`;

    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  getConversationName(conversation: Conversation, currentUserId: string): string {
    if (conversation.clientId === currentUserId) {
      // Current user is client, show repairer name
      return conversation.repairer?.repairerProfile?.businessName ||
        `${conversation.repairer?.firstName} ${conversation.repairer?.lastName}`;
    } else {
      // Current user is repairer, show client name
      return `${conversation.client?.firstName} ${conversation.client?.lastName}`;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}

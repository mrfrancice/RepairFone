// ============================================
// CHAT DOMAIN — Types
// ============================================

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name?: string;
  size?: number;
}

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

// ============================================
// CHAT DOMAIN — Types
// ============================================

import type { User } from '@app/domains/users';
import type { RepairRequest } from '@app/domains/requests';

export interface ChatConversation {
  id: string;
  requestId: string;
  request?: RepairRequest;
  participants: ChatParticipant[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  userId: string;
  user?: User;
  role: 'client' | 'repairer';
  joinedAt: string;
  lastSeenAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType?: 'client' | 'repairer';
  sender?: User;
  type: ChatMessageType;
  content: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export type ChatMessageType = 'text' | 'image' | 'system' | 'quote' | 'payment';

export interface SendMessageDto {
  conversationId: string;
  content: string;
  type?: ChatMessageType;
  image?: File;
}

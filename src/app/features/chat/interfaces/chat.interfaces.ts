export type MessageType = 'user' | 'assistant';

export interface ChatMessage {
  id: string | number;
  content: string;
  type: MessageType;
  timestamp: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  currentConversationId: number | null;
}

export interface ChatRequest {
  message: string;
  conversationId?: number;
}

export interface ChatResponse {
  id: number;
  message: string;
  role: 'assistant';
  timestamp: string;
  conversationId: number;
  metadata?: {
    confidence?: number;
    type?: string;
  };
}

export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: {
    id: number;
    content: string;
    role: 'user' | 'assistant';
    metadata?: Record<string, unknown>;
    createdAt: string;
  }[];
}
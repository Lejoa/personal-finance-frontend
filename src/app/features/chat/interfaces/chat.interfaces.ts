export type MessageType = 'user' | 'assistant';

export interface TransactionCreated {
  id: number;
  name: string;
  type: 'ingreso' | 'gasto';
  amount: number;
  date: string;
  categoryId: number;
  categoryName: string;
}

export interface CategoryOption {
  id: number;
  name: string;
}

export interface PendingCategorization {
  transactionId: number;
  suggestedCategory: CategoryOption | null;
  categories: CategoryOption[];
  name: string;
  type: 'ingreso' | 'gasto';
  amount: number;
  date: string;
}

export interface ChatMessage {
  id: string | number;
  content: string;
  type: MessageType;
  timestamp: Date;
  transactionCreated?: TransactionCreated;
  pendingCategorization?: PendingCategorization;
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
    transaction_created?: TransactionCreated;
    pending_categorization?: {
      transaction_id: number;
      suggested_category: CategoryOption | null;
      categories: CategoryOption[];
      name: string;
      type: 'ingreso' | 'gasto';
      amount: number;
      date: string;
    };
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
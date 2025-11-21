export type MessageType = 'user' | 'bot';

export interface ChatMessage {
  id: string;
  content: string;
  type: MessageType;
  timestamp: Date;
}

export interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
}

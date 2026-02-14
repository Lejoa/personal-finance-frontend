import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  ChatMessage,
  ChatResponse,
  ChatState,
  Conversation,
  ConversationDetail
} from '../interfaces/chat.interfaces';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/chat`;

  private chatStateSubject = new BehaviorSubject<ChatState>({
    messages: [],
    isTyping: false,
    currentConversationId: null
  });

  public chatState$: Observable<ChatState> = this.chatStateSubject.asObservable();

  constructor() {
    this.initializeChat();
  }

  private initializeChat(): void {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      content: '¡Hola! Soy tu asistente financiero. Puedo ayudarte a registrar gastos e ingresos, y responder preguntas sobre tus finanzas. ¿En qué puedo ayudarte hoy?',
      type: 'assistant',
      timestamp: new Date()
    };

    this.addMessage(welcomeMessage);
  }

  public sendMessage(content: string): void {
    const userMessage: ChatMessage = {
      id: this.generateId(),
      content,
      type: 'user',
      timestamp: new Date()
    };

    this.addMessage(userMessage);
    this.setTyping(true);

    const conversationId = this.chatStateSubject.value.currentConversationId ?? undefined;

    this.sendToBackend(content, conversationId).subscribe({
      next: (response) => {
        const botMessage: ChatMessage = {
          id: response.id,
          content: response.message,
          type: 'assistant',
          timestamp: new Date(response.timestamp)
        };

        this.setTyping(false);
        this.addMessage(botMessage);
        this.setConversationId(response.conversationId);
      },
      error: () => {
        const errorMessage: ChatMessage = {
          id: this.generateId(),
          content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
          type: 'assistant',
          timestamp: new Date()
        };

        this.setTyping(false);
        this.addMessage(errorMessage);
      }
    });
  }

  public getConversations(): Observable<{ data: Conversation[]; total: number }> {
    return this.http.get<{ data: Conversation[]; total: number }>(`${this.apiUrl}/conversations`);
  }

  public loadConversation(id: number): Observable<ConversationDetail> {
    return this.http.get<ConversationDetail>(`${this.apiUrl}/conversations/${id}`);
  }

  public deleteConversation(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/conversations/${id}`);
  }

  public restoreConversation(detail: ConversationDetail): void {
    const messages: ChatMessage[] = detail.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      type: msg.role,
      timestamp: new Date(msg.createdAt)
    }));

    this.chatStateSubject.next({
      messages,
      isTyping: false,
      currentConversationId: detail.conversation.id
    });
  }

  public clearChat(): void {
    this.chatStateSubject.next({
      messages: [],
      isTyping: false,
      currentConversationId: null
    });
    this.initializeChat();
  }

  private sendToBackend(message: string, conversationId?: number): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, { message, conversationId });
  }

  private addMessage(message: ChatMessage): void {
    const currentState = this.chatStateSubject.value;
    this.chatStateSubject.next({
      ...currentState,
      messages: [...currentState.messages, message]
    });
  }

  private setTyping(isTyping: boolean): void {
    const currentState = this.chatStateSubject.value;
    this.chatStateSubject.next({
      ...currentState,
      isTyping
    });
  }

  private setConversationId(conversationId: number): void {
    const currentState = this.chatStateSubject.value;
    this.chatStateSubject.next({
      ...currentState,
      currentConversationId: conversationId
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
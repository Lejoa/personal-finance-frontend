import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import {
  ChatMessage,
  ChatResponse,
  ChatState,
  Conversation,
  ConversationDetail,
  TransactionCreated,
} from '../interfaces/chat.interfaces';
import { TransactionService } from '../../../shared/services/transaction.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly transactionService = inject(TransactionService);
  private readonly chatApiUrl = `${environment.apiUrl}/api/chat`;

  private chatStateSubject = new BehaviorSubject<ChatState>({
    messages: [],
    isTyping: false,
    currentConversationId: null
  });

  public chatState$: Observable<ChatState> = this.chatStateSubject.asObservable();

  constructor() {
    this.addWelcomeMessage();
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
          timestamp: new Date(response.timestamp),
          transactionCreated: response.metadata?.transaction_created,
          pendingCategorization: response.metadata?.pending_categorization
            ? {
                transactionId: response.metadata.pending_categorization.transaction_id,
                suggestedCategory: response.metadata.pending_categorization.suggested_category,
                categories: response.metadata.pending_categorization.categories,
                name: response.metadata.pending_categorization.name,
                type: response.metadata.pending_categorization.type,
                amount: response.metadata.pending_categorization.amount,
                date: response.metadata.pending_categorization.date,
              }
            : undefined,
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
    return this.http.get<{ data: Conversation[]; total: number }>(`${this.chatApiUrl}/conversations`);
  }

  public loadConversation(id: number): Observable<ConversationDetail> {
    return this.http.get<ConversationDetail>(`${this.chatApiUrl}/conversations/${id}`);
  }

  public deleteConversation(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.chatApiUrl}/conversations/${id}`);
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
    this.addWelcomeMessage();
  }

  public assignCategory(
    messageId: string | number,
    transactionId: number,
    categoryId: number,
    categoryName: string,
    date?: string,
    note?: string
  ): void {
    const payload: Parameters<typeof this.transactionService.updateTransaction>[1] = { categoryId };
    if (date) payload.date = new Date(date);
    if (note) payload.note = note;

    this.transactionService.updateTransaction(transactionId, payload).pipe(
      switchMap(() => this.transactionService.getFeedback(transactionId))
    ).subscribe({
      next: ({ feedback }) => {
        const currentState = this.chatStateSubject.value;
        const messages = currentState.messages.map(msg => {
          if (msg.id !== messageId || !msg.pendingCategorization) return msg;
          const pc = msg.pendingCategorization;
          return {
            ...msg,
            pendingCategorization: undefined,
            transactionCreated: {
              id: transactionId,
              name: pc.name,
              type: pc.type,
              amount: pc.amount,
              date: date || pc.date,
              categoryId,
              categoryName,
            } satisfies TransactionCreated,
          };
        });

        const updatedState = { ...currentState, messages };

        if (feedback) {
          const feedbackMessage: ChatMessage = {
            id: `feedback-${transactionId}`,
            content: feedback,
            type: 'assistant',
            timestamp: new Date(),
          };
          updatedState.messages = [...messages, feedbackMessage];
        }

        this.chatStateSubject.next(updatedState);
      },
      error: () => {
        const errorMessage: ChatMessage = {
          id: this.generateId(),
          content: 'No se pudo asignar la categoría. Por favor, intenta de nuevo.',
          type: 'assistant',
          timestamp: new Date(),
        };
        this.addMessage(errorMessage);
      }
    });
  }

  public undoTransaction(transactionId: number, messageId?: string | number): void {
    this.transactionService.deleteTransaction(transactionId).subscribe({
      next: () => {
        const currentState = this.chatStateSubject.value;
        const messages = currentState.messages.map(msg => {
          if (msg.id !== messageId) return msg;
          return { ...msg, transactionCreated: undefined };
        });
        const undoMessage: ChatMessage = {
          id: this.generateId(),
          content: 'La transacción fue eliminada.',
          type: 'assistant',
          timestamp: new Date(),
        };
        this.chatStateSubject.next({ ...currentState, messages: [...messages, undoMessage] });
      },
      error: () => {
        const errorMessage: ChatMessage = {
          id: this.generateId(),
          content: 'No se pudo eliminar la transacción. Por favor, intenta de nuevo.',
          type: 'assistant',
          timestamp: new Date(),
        };
        this.addMessage(errorMessage);
      }
    });
  }

  private sendToBackend(message: string, conversationId?: number): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.chatApiUrl, { message, conversationId });
  }

  private addWelcomeMessage(): void {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      content: '¡Hola! Soy tu asistente financiero. Puedo ayudarte a registrar gastos e ingresos, y responder preguntas sobre tus finanzas. ¿En qué puedo ayudarte hoy?',
      type: 'assistant',
      timestamp: new Date()
    };
    this.addMessage(welcomeMessage);
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
    this.chatStateSubject.next({ ...currentState, isTyping });
  }

  private setConversationId(conversationId: number): void {
    const currentState = this.chatStateSubject.value;
    this.chatStateSubject.next({ ...currentState, currentConversationId: conversationId });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
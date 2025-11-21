import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, delay, of } from 'rxjs';
import { ChatMessage, ChatState } from '../interfaces/chat.interfaces';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatStateSubject = new BehaviorSubject<ChatState>({
    messages: [],
    isTyping: false
  });

  public chatState$: Observable<ChatState> = this.chatStateSubject.asObservable();

  constructor() {
    this.initializeChat();
  }

  private initializeChat(): void {
    const welcomeMessage: ChatMessage = {
      id: this.generateId(),
      content: '¡Hola! Soy tu asistente financiero. Puedo ayudarte a registrar gastos e ingresos, y responder preguntas sobre tus finanzas. ¿En qué puedo ayudarte hoy?',
      type: 'bot',
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

    // Simular respuesta del LLM con delay
    this.getBotResponse(content)
      .pipe(delay(1500))
      .subscribe(response => {
        const botMessage: ChatMessage = {
          id: this.generateId(),
          content: response,
          type: 'bot',
          timestamp: new Date()
        };
        this.setTyping(false);
        this.addMessage(botMessage);
      });
  }

  private getBotResponse(userMessage: string): Observable<string> {
    // Mock responses - reemplazar con llamada HTTP al LLM
    const lowercaseMessage = userMessage.toLowerCase();

    if (lowercaseMessage.includes('gast') || lowercaseMessage.includes('pagué') || lowercaseMessage.includes('compré')) {
      return of('He registrado tu gasto. ¿Puedes indicarme la categoría y el monto exacto?');
    } else if (lowercaseMessage.includes('ingreso') || lowercaseMessage.includes('ganancia') || lowercaseMessage.includes('cobré')) {
      return of('Perfecto, registraré tu ingreso. ¿De qué fuente proviene y cuál es el monto?');
    } else if (lowercaseMessage.includes('cuánto') || lowercaseMessage.includes('total') || lowercaseMessage.includes('balance')) {
      return of('Basado en tus registros, tu balance actual es de $1,500. Has gastado $800 este mes.');
    } else if (lowercaseMessage.includes('hola') || lowercaseMessage.includes('ayuda')) {
      return of('¡Hola! Puedo ayudarte a registrar gastos e ingresos, consultar tu balance, y analizar tus patrones de gasto. ¿Qué necesitas?');
    } else {
      return of('Entiendo. ¿Podrías darme más detalles sobre tu consulta financiera?');
    }
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

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public clearChat(): void {
    this.chatStateSubject.next({
      messages: [],
      isTyping: false
    });
    this.initializeChat();
  }
}

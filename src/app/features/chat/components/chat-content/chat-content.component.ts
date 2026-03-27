import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { ChatState } from '../../interfaces/chat.interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-content',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    FormsModule,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './chat-content.component.html',
  styleUrl: './chat-content.component.scss'
})
export class ChatContentComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  chatState!: ChatState;

  userInput: string = '';
  pendingExtras: Record<string | number, { date: string; note: string; selectedCategoryId: number | null; selectedCategoryName: string | null; showMore: boolean }> = {};
  private subscription: Subscription = new Subscription();
  private shouldScrollToBottom = false;

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.chatService.chatState$.subscribe(state => {
        this.chatState = state;
        state.messages.forEach(message => {
          if (message.pendingCategorization && !this.pendingExtras[message.id]) {
            const pendingCategorization = message.pendingCategorization;
            const todayFormatted = new Date().toISOString().split('T')[0];
            this.pendingExtras[message.id] = {
              date: todayFormatted,
              note: '',
              selectedCategoryId: pendingCategorization.suggestedCategory?.id ?? null,
              selectedCategoryName: pendingCategorization.suggestedCategory?.name ?? null,
              showMore: false,
            };
          }
        });
        this.shouldScrollToBottom = true;
      })
    );
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  sendMessage(): void {
    if (this.userInput.trim()) {
      this.chatService.sendMessage(this.userInput);
      this.userInput = '';
    }
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  clearChat(): void {
    this.chatService.clearChat();
  }

  selectCategory(messageId: string | number, categoryId: number, categoryName: string): void {
    const pendingExtra = this.pendingExtras[messageId];
    if (!pendingExtra) return;
    pendingExtra.selectedCategoryId = categoryId;
    pendingExtra.selectedCategoryName = categoryName;
  }

  confirmTransaction(messageId: string | number, transactionId: number): void {
    const pendingExtra = this.pendingExtras[messageId];
    if (!pendingExtra?.selectedCategoryId || !pendingExtra?.selectedCategoryName) return;
    this.chatService.assignCategory(
      messageId,
      transactionId,
      pendingExtra.selectedCategoryId,
      pendingExtra.selectedCategoryName,
      pendingExtra.date || undefined,
      pendingExtra.note || undefined,
    );
    delete this.pendingExtras[messageId];
  }

  cancelTransaction(messageId: string | number, transactionId: number): void {
    this.chatService.undoTransaction(transactionId);
    delete this.pendingExtras[messageId];
  }

  undoTransaction(transactionId: number): void {
    this.chatService.undoTransaction(transactionId);
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch(err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

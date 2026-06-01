import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe } from '@angular/common';
import { ChatService } from '../../services/chat.service';
import { ChatState } from '../../interfaces/chat.interfaces';

@Component({
  selector: 'app-chat-content',
  standalone: true,
  imports: [
    FormsModule,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl: './chat-content.component.html',
  styleUrl: './chat-content.component.scss'
})
export class ChatContentComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  private chatService = inject(ChatService);
  private destroyRef = inject(DestroyRef);

  chatState!: ChatState;
  userInput = '';
  pendingFormsByMessageId: Record<string | number, {
    date: string;
    note: string;
    selectedCategoryId: number | null;
    selectedCategoryName: string | null;
    showMore: boolean;
  }> = {};

  private needsScroll = false;

  get canSendMessage(): boolean {
    return !!this.userInput.trim() && !this.chatState?.isTyping;
  }

  ngOnInit(): void {
    this.chatService.chatState$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(state => {
        this.chatState = state;
        this.initializePendingForms(state);
        this.needsScroll = true;
      });
  }

  ngAfterViewChecked(): void {
    if (this.needsScroll) {
      this.scrollToBottom();
      this.needsScroll = false;
    }
  }

  submitMessage(): void {
    if (!this.canSendMessage) return;
    this.chatService.sendMessage(this.userInput);
    this.userInput = '';
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitMessage();
    }
  }

  clearChat(): void {
    this.chatService.clearChat();
  }

  toggleShowMore(messageId: string | number): void {
    const form = this.pendingFormsByMessageId[messageId];
    if (form) {
      form.showMore = !form.showMore;
    }
  }

  selectCategory(messageId: string | number, categoryId: number, categoryName: string): void {
    const form = this.pendingFormsByMessageId[messageId];
    if (!form) return;
    form.selectedCategoryId = categoryId;
    form.selectedCategoryName = categoryName;
  }

  confirmTransaction(messageId: string | number, transactionId: number): void {
    const form = this.pendingFormsByMessageId[messageId];
    if (!form?.selectedCategoryId || !form?.selectedCategoryName) return;
    this.chatService.assignCategory(
      messageId,
      transactionId,
      form.selectedCategoryId,
      form.selectedCategoryName,
      form.date || undefined,
      form.note || undefined,
    );
    delete this.pendingFormsByMessageId[messageId];
  }

  cancelTransaction(messageId: string | number, transactionId: number): void {
    this.chatService.undoTransaction(transactionId, messageId);
    delete this.pendingFormsByMessageId[messageId];
  }

  undoTransaction(messageId: string | number, transactionId: number): void {
    this.chatService.undoTransaction(transactionId, messageId);
  }

  private initializePendingForms(state: ChatState): void {
    state.messages.forEach(message => {
      if (message.pendingCategorization && !this.pendingFormsByMessageId[message.id]) {
        const todayFormatted = new Date().toISOString().split('T')[0];
        this.pendingFormsByMessageId[message.id] = {
          date: todayFormatted,
          note: '',
          selectedCategoryId: message.pendingCategorization.suggestedCategory?.id ?? null,
          selectedCategoryName: message.pendingCategorization.suggestedCategory?.name ?? null,
          showMore: false,
        };
      }
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error al hacer scroll al final del chat:', err);
    }
  }
}

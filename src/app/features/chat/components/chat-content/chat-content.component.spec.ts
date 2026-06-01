import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatContentComponent } from './chat-content.component';
import { ChatService } from '../../services/chat.service';
import { ChatState } from '../../interfaces/chat.interfaces';

const emptyState: ChatState = { messages: [], isTyping: false, currentConversationId: null };

describe('ChatContentComponent', () => {
  let component: ChatContentComponent;
  let fixture: ComponentFixture<ChatContentComponent>;
  let chatServiceSpy: jasmine.SpyObj<ChatService>;
  let chatStateSubject: BehaviorSubject<ChatState>;

  beforeEach(async () => {
    chatStateSubject = new BehaviorSubject<ChatState>(emptyState);
    chatServiceSpy = jasmine.createSpyObj('ChatService', [
      'sendMessage', 'clearChat', 'assignCategory', 'undoTransaction'
    ], {
      chatState$: chatStateSubject.asObservable()
    });

    await TestBed.configureTestingModule({
      imports: [ChatContentComponent],
      providers: [
        { provide: ChatService, useValue: chatServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('canSendMessage getter', () => {
    it('should return false when userInput is empty', () => {
      component.userInput = '';
      expect(component.canSendMessage).toBeFalse();
    });

    it('should return false when chat is typing', () => {
      component.userInput = 'Hola';
      chatStateSubject.next({ messages: [], isTyping: true, currentConversationId: null });
      expect(component.canSendMessage).toBeFalse();
    });

    it('should return true when input has content and chat is not typing', () => {
      component.userInput = 'Hola';
      expect(component.canSendMessage).toBeTrue();
    });
  });

  describe('submitMessage', () => {
    it('should call chatService.sendMessage and clear input', () => {
      component.userInput = 'Hola';
      component.submitMessage();
      expect(chatServiceSpy.sendMessage).toHaveBeenCalledOnceWith('Hola');
      expect(component.userInput).toBe('');
    });

    it('should do nothing when canSendMessage is false', () => {
      component.userInput = '';
      component.submitMessage();
      expect(chatServiceSpy.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('onKeyPress', () => {
    it('should call submitMessage when Enter is pressed without Shift', () => {
      component.userInput = 'Mensaje';
      const event = new KeyboardEvent('keypress', { key: 'Enter', shiftKey: false });
      spyOn(event, 'preventDefault');
      component.onKeyPress(event);
      expect(chatServiceSpy.sendMessage).toHaveBeenCalled();
    });

    it('should not call submitMessage when Shift+Enter is pressed', () => {
      component.userInput = 'Mensaje';
      const event = new KeyboardEvent('keypress', { key: 'Enter', shiftKey: true });
      component.onKeyPress(event);
      expect(chatServiceSpy.sendMessage).not.toHaveBeenCalled();
    });

    it('should not call submitMessage for other keys', () => {
      component.userInput = 'Mensaje';
      const event = new KeyboardEvent('keypress', { key: 'a' });
      component.onKeyPress(event);
      expect(chatServiceSpy.sendMessage).not.toHaveBeenCalled();
    });
  });

  describe('clearChat', () => {
    it('should call chatService.clearChat', () => {
      component.clearChat();
      expect(chatServiceSpy.clearChat).toHaveBeenCalledOnceWith();
    });
  });

  describe('toggleShowMore', () => {
    it('should toggle showMore for the given messageId', () => {
      component.pendingFormsByMessageId[1] = {
        date: '', note: '', selectedCategoryId: null, selectedCategoryName: null, showMore: false
      };
      component.toggleShowMore(1);
      expect(component.pendingFormsByMessageId[1].showMore).toBeTrue();
      component.toggleShowMore(1);
      expect(component.pendingFormsByMessageId[1].showMore).toBeFalse();
    });

    it('should do nothing for an unknown messageId', () => {
      expect(() => component.toggleShowMore(999)).not.toThrow();
    });
  });

  describe('selectCategory', () => {
    it('should update selectedCategoryId and selectedCategoryName', () => {
      component.pendingFormsByMessageId[1] = {
        date: '', note: '', selectedCategoryId: null, selectedCategoryName: null, showMore: false
      };
      component.selectCategory(1, 5, 'Comida');
      expect(component.pendingFormsByMessageId[1].selectedCategoryId).toBe(5);
      expect(component.pendingFormsByMessageId[1].selectedCategoryName).toBe('Comida');
    });

    it('should do nothing for an unknown messageId', () => {
      expect(() => component.selectCategory(999, 5, 'Comida')).not.toThrow();
    });
  });

  describe('confirmTransaction', () => {
    it('should call assignCategory and remove the pending form', () => {
      component.pendingFormsByMessageId[1] = {
        date: '2024-05-01', note: 'nota', selectedCategoryId: 3, selectedCategoryName: 'Comida', showMore: false
      };
      component.confirmTransaction(1, 42);
      expect(chatServiceSpy.assignCategory).toHaveBeenCalledWith(
        1, 42, 3, 'Comida', '2024-05-01', 'nota'
      );
      expect(component.pendingFormsByMessageId[1]).toBeUndefined();
    });

    it('should do nothing when selectedCategoryId is null', () => {
      component.pendingFormsByMessageId[1] = {
        date: '', note: '', selectedCategoryId: null, selectedCategoryName: null, showMore: false
      };
      component.confirmTransaction(1, 42);
      expect(chatServiceSpy.assignCategory).not.toHaveBeenCalled();
    });
  });

  describe('cancelTransaction', () => {
    it('should call undoTransaction with transactionId and messageId, and remove the pending form', () => {
      component.pendingFormsByMessageId[1] = {
        date: '', note: '', selectedCategoryId: null, selectedCategoryName: null, showMore: false
      };
      component.cancelTransaction(1, 42);
      expect(chatServiceSpy.undoTransaction).toHaveBeenCalledOnceWith(42, 1);
      expect(component.pendingFormsByMessageId[1]).toBeUndefined();
    });
  });

  describe('undoTransaction', () => {
    it('should call chatService.undoTransaction with transactionId and messageId', () => {
      component.undoTransaction('msg-1', 99);
      expect(chatServiceSpy.undoTransaction).toHaveBeenCalledOnceWith(99, 'msg-1');
    });
  });
});

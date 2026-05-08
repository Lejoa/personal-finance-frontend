import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { FinancialLiteracyComponent } from './financial-literacy.component';
import { TipService } from '../../services/tip.service';
import { TabService } from '../../../core/services/tab/tab.service';
import { ChatService } from '../../../features/chat/services/chat.service';
import { FinancialTip } from '../../../features/learning/interfaces/learning-content.interfaces';

const mockTip: FinancialTip = {
  id: 1,
  title: 'Ahorra el 20%',
  description: 'Descripción de prueba',
  shortDescription: 'Descripción corta'
};

describe('FinancialLiteracyComponent', () => {
  let component: FinancialLiteracyComponent;
  let fixture: ComponentFixture<FinancialLiteracyComponent>;
  let tipServiceSpy: jasmine.SpyObj<TipService>;
  let tabServiceSpy: { setActiveTab: jasmine.Spy };
  let chatServiceSpy: jasmine.SpyObj<ChatService>;

  beforeEach(async () => {
    tipServiceSpy = jasmine.createSpyObj('TipService', ['getRecommendedTips']);
    tabServiceSpy = { setActiveTab: jasmine.createSpy() };
    chatServiceSpy = jasmine.createSpyObj('ChatService', ['sendMessage'], {
      chatState$: of({ messages: [], isLoading: false })
    });

    tipServiceSpy.getRecommendedTips.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [FinancialLiteracyComponent],
      providers: [
        { provide: TipService,  useValue: tipServiceSpy },
        { provide: TabService,  useValue: tabServiceSpy },
        { provide: ChatService, useValue: chatServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(FinancialLiteracyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load tips and set isLoading to false on success', () => {
      tipServiceSpy.getRecommendedTips.and.returnValue(of([mockTip]));

      component.ngOnInit();

      expect(component.tips).toEqual([mockTip]);
      expect(component.isLoading).toBeFalse();
    });

    it('should set isLoading to false on error', () => {
      tipServiceSpy.getRecommendedTips.and.returnValue(throwError(() => new Error('error')));

      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });

    it('should leave tips empty when service returns empty array', () => {
      tipServiceSpy.getRecommendedTips.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.tips).toEqual([]);
    });
  });

  describe('selectTip', () => {
    it('should set selectedTip', () => {
      component.selectTip(mockTip);
      expect(component.selectedTip).toEqual(mockTip);
    });
  });

  describe('clearSelectedTip', () => {
    it('should clear selectedTip', () => {
      component.selectedTip = mockTip;
      component.clearSelectedTip();
      expect(component.selectedTip).toBeUndefined();
    });
  });

  describe('learnMore', () => {
    it('should set active tab to Create', fakeAsync(() => {
      component.learnMore(mockTip);
      tick();
      expect(tabServiceSpy.setActiveTab).toHaveBeenCalledOnceWith('Create');
    }));

    it('should send a message with title and shortDescription', fakeAsync(() => {
      component.learnMore(mockTip);
      tick();
      expect(chatServiceSpy.sendMessage).toHaveBeenCalledOnceWith(
        `Quiero aprender más sobre este tema: "${mockTip.title}". ${mockTip.shortDescription}`
      );
    }));

    it('should send a message with only title when shortDescription is absent', fakeAsync(() => {
      const tipWithoutDesc: FinancialTip = { title: 'Solo título', description: 'Desc' };
      component.learnMore(tipWithoutDesc);
      tick();
      expect(chatServiceSpy.sendMessage).toHaveBeenCalledOnceWith(
        `Quiero aprender más sobre este tema: "${tipWithoutDesc.title}".`
      );
    }));
  });
});

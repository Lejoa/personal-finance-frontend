import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { LearningContentComponent } from './learning-content.component';
import { TipService } from '../../../../shared/services/tip.service';
import { TabService } from '../../../../core/services/tab/tab.service';
import { ChatService } from '../../../chat/services/chat.service';
import { AnalysisService } from '../../services/analysis.service';
import { FinancialTip, FinancialAnalysis } from '../../interfaces/learning-content.interfaces';

const mockTip: FinancialTip = {
  id: 1,
  title: 'Ahorra el 20%',
  description: 'Descripción de prueba',
  shortDescription: 'Descripción corta'
};

const mockAnalysis: FinancialAnalysis = {
  id: 10,
  period: '2024-05',
  checkpoint: 'end',
  content: 'Análisis de prueba',
  isRead: false,
  generatedAt: '2024-05-31'
};

describe('LearningContentComponent', () => {
  let component: LearningContentComponent;
  let fixture: ComponentFixture<LearningContentComponent>;
  let tipServiceSpy: jasmine.SpyObj<TipService>;
  let tabServiceSpy: { setActiveTab: jasmine.Spy };
  let chatServiceSpy: jasmine.SpyObj<ChatService>;
  let analysisServiceSpy: jasmine.SpyObj<AnalysisService>;

  beforeEach(async () => {
    tipServiceSpy = jasmine.createSpyObj('TipService', ['getRecommendedTips']);
    tabServiceSpy = { setActiveTab: jasmine.createSpy() };
    chatServiceSpy = jasmine.createSpyObj('ChatService', ['sendMessage'], {
      chatState$: of({ messages: [], isLoading: false })
    });
    analysisServiceSpy = jasmine.createSpyObj('AnalysisService', ['getAnalyses', 'markAsRead']);

    tipServiceSpy.getRecommendedTips.and.returnValue(of([]));
    analysisServiceSpy.getAnalyses.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [LearningContentComponent],
      providers: [
        { provide: TipService, useValue: tipServiceSpy },
        { provide: TabService, useValue: tabServiceSpy },
        { provide: ChatService, useValue: chatServiceSpy },
        { provide: AnalysisService, useValue: analysisServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LearningContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load tips and set isLoading to false on success', () => {
      tipServiceSpy.getRecommendedTips.and.returnValue(of([mockTip]));
      analysisServiceSpy.getAnalyses.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.tips).toEqual([mockTip]);
      expect(component.isLoading).toBeFalse();
    });

    it('should set isLoading to false on tips error', () => {
      tipServiceSpy.getRecommendedTips.and.returnValue(throwError(() => new Error('error')));
      analysisServiceSpy.getAnalyses.and.returnValue(of([]));

      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });

    it('should load analyses on success', () => {
      tipServiceSpy.getRecommendedTips.and.returnValue(of([]));
      analysisServiceSpy.getAnalyses.and.returnValue(of([mockAnalysis]));

      component.ngOnInit();

      expect(component.analyses).toEqual([mockAnalysis]);
    });

    it('should set analyses to empty array on error', () => {
      tipServiceSpy.getRecommendedTips.and.returnValue(of([]));
      analysisServiceSpy.getAnalyses.and.returnValue(throwError(() => new Error('error')));

      component.ngOnInit();

      expect(component.analyses).toEqual([]);
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

  describe('markAnalysisAsRead', () => {
    it('should call analysisService.markAsRead with the given id', () => {
      analysisServiceSpy.markAsRead.and.returnValue(of({ ...mockAnalysis, isRead: true }));
      component.markAnalysisAsRead(mockAnalysis.id);
      expect(analysisServiceSpy.markAsRead).toHaveBeenCalledOnceWith(mockAnalysis.id);
    });
  });
});

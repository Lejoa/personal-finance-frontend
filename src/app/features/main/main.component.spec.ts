import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Input, NO_ERRORS_SCHEMA, Output } from '@angular/core';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { MainComponent } from './main.component';
import { TabService } from '../../core/services/tab/tab.service';
import { MonthStateService } from '../../core/services/month-state/month-state.service';
import { TransactionService } from '../../shared/services/transaction.service';
import { CategoryService } from '../../shared/services/category.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { TrackingContentComponent } from '../tracking/components/tracking-content/tracking-content.component';
import { ChatContentComponent } from '../chat/components/chat-content/chat-content.component';
import { LearningContentComponent } from '../learning/components/learning-content/learning-content.component';
import { BudgetComponent } from '../budget/components/budget/budget.component';
import { SmsSyncSheetComponent } from '../sms-sync/components/sms-sync-sheet/sms-sync-sheet.component';
import { Transaction } from '../../shared/models/transaction.model';

@Component({ selector: 'app-header', template: '', standalone: true })
class MockHeaderComponent {}

@Component({ selector: 'app-tracking-content', template: '', standalone: true })
class MockTrackingContentComponent {}

@Component({ selector: 'app-chat-content', template: '', standalone: true })
class MockChatContentComponent {}

@Component({ selector: 'app-learning-content', template: '', standalone: true })
class MockLearningContentComponent {}

@Component({ selector: 'app-budget', template: '', standalone: true })
class MockBudgetComponent {}

@Component({ selector: 'app-sms-sync-sheet', template: '', standalone: true })
class MockSmsSyncSheetComponent {
  @Input() isOpen = false;
  @Output() sheetClosed = new EventEmitter<void>();
  @Output() approved = new EventEmitter<void>();
}

const makeTransaction = (): Transaction => ({
  name: 'Test',
  amount: 100,
  date: new Date('2024-05-01'),
  transactionType: 'gasto'
});

describe('MainComponent', () => {
  let component: MainComponent;
  let fixture: ComponentFixture<MainComponent>;
  let tabServiceSpy: jasmine.SpyObj<TabService>;
  let monthStateServiceSpy: jasmine.SpyObj<MonthStateService>;
  let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let activeTabSubject: BehaviorSubject<string>;
  let selectedMonthSubject: BehaviorSubject<Date>;
  let transactionChangedSubject: Subject<void>;
  const fixedMonth = new Date(2024, 4, 1);

  beforeEach(async () => {
    activeTabSubject = new BehaviorSubject<string>('Home');
    selectedMonthSubject = new BehaviorSubject<Date>(fixedMonth);
    transactionChangedSubject = new Subject<void>();

    tabServiceSpy = jasmine.createSpyObj('TabService', ['setActiveTab'], {
      activeTab$: activeTabSubject.asObservable()
    });
    monthStateServiceSpy = jasmine.createSpyObj('MonthStateService', ['setMonth'], {
      selectedMonth: fixedMonth,
      selectedMonth$: selectedMonthSubject.asObservable()
    });
    transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getTransactionsByDateRange'], {
      transactionChanged$: transactionChangedSubject.asObservable()
    });
    categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories']);

    transactionServiceSpy.getTransactionsByDateRange.and.returnValue(of([]));
    categoryServiceSpy.getCategories.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [MainComponent],
      providers: [
        { provide: TabService,          useValue: tabServiceSpy },
        { provide: MonthStateService,   useValue: monthStateServiceSpy },
        { provide: TransactionService,  useValue: transactionServiceSpy },
        { provide: CategoryService,     useValue: categoryServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(MainComponent, {
      remove: { imports: [
        HeaderComponent,
        TrackingContentComponent,
        ChatContentComponent,
        LearningContentComponent,
        BudgetComponent,
        SmsSyncSheetComponent
      ]},
      add: { imports: [
        MockHeaderComponent,
        MockTrackingContentComponent,
        MockChatContentComponent,
        MockLearningContentComponent,
        MockBudgetComponent,
        MockSmsSyncSheetComponent
      ]}
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('selectedMonth getter', () => {
    it('should return selectedMonth from MonthStateService', () => {
      expect(component.selectedMonth).toBe(fixedMonth);
    });
  });

  describe('ngOnInit', () => {
    it('should sync activeTab with TabService', () => {
      activeTabSubject.next('Tracking');
      expect(component.activeTab).toBe('Tracking');
    });

    it('should load categories on init', () => {
      expect(categoryServiceSpy.getCategories).toHaveBeenCalled();
    });

    it('should load home transactions on init', () => {
      expect(transactionServiceSpy.getTransactionsByDateRange).toHaveBeenCalled();
    });

    it('should reload transactions when transactionChanged$ emits', () => {
      const callsBefore = transactionServiceSpy.getTransactionsByDateRange.calls.count();
      transactionChangedSubject.next();
      expect(transactionServiceSpy.getTransactionsByDateRange.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should reload transactions when selectedMonth$ emits', () => {
      const callsBefore = transactionServiceSpy.getTransactionsByDateRange.calls.count();
      selectedMonthSubject.next(new Date(2024, 5, 1));
      expect(transactionServiceSpy.getTransactionsByDateRange.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should populate homeTransactions on successful load', () => {
      const tx = makeTransaction();
      transactionServiceSpy.getTransactionsByDateRange.and.returnValue(of([tx]));
      component.ngOnInit();
      expect(component.homeTransactions).toEqual([tx]);
    });
  });

  describe('onMonthChange', () => {
    it('should call monthStateService.setMonth with the new month', () => {
      const newMonth = new Date(2024, 5, 1);
      component.onMonthChange(newMonth);
      expect(monthStateServiceSpy.setMonth).toHaveBeenCalledOnceWith(newMonth);
    });
  });

  describe('openSheet', () => {
    it('should set isSheetOpen to true', () => {
      component.openSheet();
      expect(component.isSheetOpen).toBeTrue();
    });
  });

  describe('closeSheet', () => {
    it('should set isSheetOpen to false', () => {
      component.isSheetOpen = true;
      component.closeSheet();
      expect(component.isSheetOpen).toBeFalse();
    });
  });
});

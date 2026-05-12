import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, Component, Input, Output, EventEmitter } from '@angular/core';
import { Subject, of } from 'rxjs';
import { TrackingContentComponent } from './tracking-content.component';
import { ChartsSectionComponent } from '../charts-section/charts-section.component';

@Component({ selector: 'app-charts-section', template: '', standalone: true })
class MockChartsSectionComponent {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() transactions: any[] = [];
  @Input() selectedMonth: Date = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Output() transactionTypeChange = new EventEmitter<any>();
}
import { TrackingExpensesService } from '../../../../core/services/tracking-expenses/tracking-expenses.service';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { CategoryService } from '../../../../shared/services/category.service';
import { MonthStateService } from '../../../../core/services/month-state/month-state.service';
import { Transaction, TransactionType } from '../../../../shared/models/transaction.model';

const makeTransaction = (type: TransactionType): Transaction => ({
  name: 'Test',
  amount: 100,
  date: new Date('2024-05-01'),
  transactionType: type
});

describe('TrackingContentComponent', () => {
  let component: TrackingContentComponent;
  let fixture: ComponentFixture<TrackingContentComponent>;
  let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let trackingExpensesServiceSpy: jasmine.SpyObj<TrackingExpensesService>;
  let monthStateServiceSpy: jasmine.SpyObj<MonthStateService>;
  let transactionChangedSubject: Subject<void>;
  const fixedMonth = new Date(2024, 4, 1);

  beforeEach(async () => {
    transactionChangedSubject = new Subject<void>();

    transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getTransactionsByDateRange'], {
      transactionChanged$: transactionChangedSubject.asObservable()
    });
    categoryServiceSpy = jasmine.createSpyObj('CategoryService', ['getCategories']);
    trackingExpensesServiceSpy = jasmine.createSpyObj('TrackingExpensesService', ['setTransactionType', 'setDateRange']);
    monthStateServiceSpy = jasmine.createSpyObj('MonthStateService', ['setMonth'], {
      selectedMonth: fixedMonth
    });

    transactionServiceSpy.getTransactionsByDateRange.and.returnValue(of([]));
    categoryServiceSpy.getCategories.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [TrackingContentComponent],
      providers: [
        { provide: TransactionService,       useValue: transactionServiceSpy },
        { provide: CategoryService,          useValue: categoryServiceSpy },
        { provide: TrackingExpensesService,  useValue: trackingExpensesServiceSpy },
        { provide: MonthStateService,        useValue: monthStateServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(TrackingContentComponent, {
      remove: { imports: [ChartsSectionComponent] },
      add:    { imports: [MockChartsSectionComponent] }
    })
    .compileComponents();

    fixture = TestBed.createComponent(TrackingContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should load categories on init', () => {
      expect(categoryServiceSpy.getCategories).toHaveBeenCalled();
    });

    it('should load transactions on init', () => {
      expect(transactionServiceSpy.getTransactionsByDateRange).toHaveBeenCalled();
    });

    it('should reload transactions when transactionChanged$ emits', () => {
      const callsBefore = transactionServiceSpy.getTransactionsByDateRange.calls.count();
      transactionChangedSubject.next();
      expect(transactionServiceSpy.getTransactionsByDateRange.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should populate allMonthTransactions and filteredTransactions', () => {
      const tx = makeTransaction('gasto');
      transactionServiceSpy.getTransactionsByDateRange.and.returnValue(of([tx]));

      component.ngOnInit();

      expect(component.allMonthTransactions).toEqual([tx]);
      expect(component.filteredTransactions).toEqual([tx]);
    });
  });

  describe('selectedMonth getter', () => {
    it('should return selectedMonth from monthStateService', () => {
      expect(component.selectedMonth).toBe(fixedMonth);
    });
  });

  describe('onMonthChange', () => {
    it('should call monthStateService.setMonth with the new month', () => {
      const newMonth = new Date(2024, 5, 1);
      component.onMonthChange(newMonth);
      expect(monthStateServiceSpy.setMonth).toHaveBeenCalledOnceWith(newMonth);
    });

    it('should call trackingExpensesService.setDateRange with first and last day of the month', () => {
      const newMonth = new Date(2024, 5, 1);
      component.onMonthChange(newMonth);

      const [range] = trackingExpensesServiceSpy.setDateRange.calls.mostRecent().args;
      expect(range.start).toEqual(new Date(2024, 5, 1));
      expect(range.end).toEqual(new Date(2024, 6, 0));
    });

    it('should reload transactions after month change', () => {
      const callsBefore = transactionServiceSpy.getTransactionsByDateRange.calls.count();
      component.onMonthChange(new Date(2024, 5, 1));
      expect(transactionServiceSpy.getTransactionsByDateRange.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  describe('onTransactionTypeChange', () => {
    it('should update currentTransactionType', () => {
      component.onTransactionTypeChange('ingreso');
      expect(component.currentTransactionType).toBe('ingreso');
    });

    it('should call trackingExpensesService.setTransactionType with the new type', () => {
      component.onTransactionTypeChange('ingreso');
      expect(trackingExpensesServiceSpy.setTransactionType).toHaveBeenCalledOnceWith('ingreso');
    });

    it('should reload filtered transactions', () => {
      const tx = makeTransaction('ingreso');
      transactionServiceSpy.getTransactionsByDateRange.and.returnValue(of([tx]));

      component.onTransactionTypeChange('ingreso');

      expect(component.filteredTransactions).toEqual([tx]);
    });
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { BudgetComponent } from './budget.component';
import { BudgetService } from '../../../../shared/services/budget.service';
import { CategoryService } from '../../../../shared/services/category.service';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { MonthStateService } from '../../../../core/services/month-state/month-state.service';
import { Budget } from '../../../../shared/models/budget.model';
import { Category } from '../../../../shared/models/category.model';
import { Transaction } from '../../../../shared/models/transaction.model';

const FIXED_MONTH = new Date('2026-04-01');

const MOCK_BUDGET: Budget = {
  id: 1,
  startDate: new Date('2026-04-01'),
  endDate: new Date('2026-04-30'),
  items: [],
  categories: [
    { id: 10, categoryId: 1, categoryName: 'Alimentación', categoryDescription: '', amount: 500000 }
  ]
};

const MOCK_CATEGORIES: Category[] = [
  { id: 1, name: 'Alimentación', description: '', type: 'gasto' },
  { id: 2, name: 'Transporte',   description: '', type: 'gasto' }
];

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', name: 'Mercado', amount: 200000, date: new Date('2026-04-05'), categoryId: 1, categoryName: 'Alimentación', transactionType: 'gasto' },
  { id: '2', name: 'Bus',     amount:  50000, date: new Date('2026-04-06'), categoryId: 2, categoryName: 'Transporte',   transactionType: 'gasto' },
];

describe('BudgetComponent', () => {
  let component: BudgetComponent;
  let fixture: ComponentFixture<BudgetComponent>;
  let budgetServiceSpy: jasmine.SpyObj<BudgetService>;
  let categoryServiceSpy: jasmine.SpyObj<CategoryService>;
  let transactionServiceSpy: jasmine.SpyObj<TransactionService>;
  let monthStateServiceSpy: jasmine.SpyObj<MonthStateService>;
  let selectedMonthSubject: BehaviorSubject<Date>;

  beforeEach(async () => {
    selectedMonthSubject = new BehaviorSubject<Date>(FIXED_MONTH);

    budgetServiceSpy      = jasmine.createSpyObj('BudgetService',      ['getBudgetByMonth']);
    categoryServiceSpy    = jasmine.createSpyObj('CategoryService',    ['getCategories']);
    transactionServiceSpy = jasmine.createSpyObj('TransactionService', ['getTransactionsByDateRange']);
    monthStateServiceSpy  = jasmine.createSpyObj('MonthStateService',  ['setMonth'], {
      selectedMonth:  FIXED_MONTH,
      selectedMonth$: selectedMonthSubject.asObservable()
    });

    budgetServiceSpy.getBudgetByMonth.and.returnValue(of(MOCK_BUDGET));
    categoryServiceSpy.getCategories.and.returnValue(of(MOCK_CATEGORIES));
    transactionServiceSpy.getTransactionsByDateRange.and.returnValue(of(MOCK_TRANSACTIONS));

    await TestBed.configureTestingModule({
      imports: [BudgetComponent],
      providers: [
        { provide: BudgetService,      useValue: budgetServiceSpy },
        { provide: CategoryService,    useValue: categoryServiceSpy },
        { provide: TransactionService, useValue: transactionServiceSpy },
        { provide: MonthStateService,  useValue: monthStateServiceSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('onMonthChange', () => {
    it('calls monthStateService.setMonth with the new month', () => {
      const month = new Date('2026-04-01');
      component.onMonthChange(month);
      expect(monthStateServiceSpy.setMonth).toHaveBeenCalledOnceWith(month);
    });
  });

  describe('loadBudgetData', () => {
    it('populates budgetedCategories from budget response', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.budgetedCategories.length).toBe(1);
      const cat = component.budgetedCategories[0];
      expect(cat.categoryId).toBe(1);
      expect(cat.categoryName).toBe('Alimentación');
      expect(cat.limit).toBe(500000);
      expect(cat.spent).toBe(200000);
      expect(cat.remaining).toBe(300000);
      expect(cat.isOverBudget).toBeFalse();
    }));

    it('populates unbudgetedCategories with categories not in budget', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.unbudgetedCategories.length).toBe(1);
      expect(component.unbudgetedCategories[0].categoryName).toBe('Transporte');
      expect(component.unbudgetedCategories[0].spent).toBe(50000);
    }));

    it('calculates totalBudget and totalSpent correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.totalBudget).toBe(500000);
      expect(component.totalSpent).toBe(200000);
    }));

    it('marks category as isOverBudget when spent exceeds limit', fakeAsync(() => {
      budgetServiceSpy.getBudgetByMonth.and.returnValue(of({
        ...MOCK_BUDGET,
        categories: [
          { id: 10, categoryId: 1, categoryName: 'Alimentación', categoryDescription: '', amount: 100000 }
        ]
      }));

      fixture.detectChanges();
      tick();

      expect(component.budgetedCategories[0].isOverBudget).toBeTrue();
    }));

    it('handles null budget response — all categories go to unbudgeted', fakeAsync(() => {
      budgetServiceSpy.getBudgetByMonth.and.returnValue(of(null));

      fixture.detectChanges();
      tick();

      expect(component.budgetedCategories.length).toBe(0);
      expect(component.unbudgetedCategories.length).toBe(2);
    }));

    it('sets isLoading to false after success', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('sets isLoading to false after error', fakeAsync(() => {
      budgetServiceSpy.getBudgetByMonth.and.returnValue(throwError(() => new Error('HTTP error')));

      fixture.detectChanges();
      tick();

      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('isGlobalOverBudget', () => {
    it('returns true when totalSpent exceeds totalBudget', fakeAsync(() => {
      budgetServiceSpy.getBudgetByMonth.and.returnValue(of({
        ...MOCK_BUDGET,
        categories: [
          { id: 10, categoryId: 1, categoryName: 'Alimentación', categoryDescription: '', amount: 100000 }
        ]
      }));

      fixture.detectChanges();
      tick();

      expect(component.isGlobalOverBudget).toBeTrue();
    }));

    it('returns false when totalSpent is within totalBudget', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.isGlobalOverBudget).toBeFalse();
    }));
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { TransactionHistoryComponent } from './transaction-history.component';
import { Transaction } from '../../models/transaction.model';

const makeTransaction = (name: string): Transaction => ({
  name,
  amount: 100,
  date: new Date('2024-05-01'),
  transactionType: 'gasto'
});

const makeTransactions = (count: number): Transaction[] =>
  Array.from({ length: count }, (_, i) => makeTransaction(`Tx ${i + 1}`));

describe('TransactionHistoryComponent', () => {
  let component: TransactionHistoryComponent;
  let fixture: ComponentFixture<TransactionHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionHistoryComponent],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('totalPages', () => {
    it('should return 0 when transactions is empty', () => {
      component.transactions = [];
      expect(component.totalPages).toBe(0);
    });

    it('should return correct number of pages', () => {
      component.transactions = makeTransactions(12);
      component.pageSize = 5;
      expect(component.totalPages).toBe(3);
    });

    it('should return 1 when transactions fit exactly one page', () => {
      component.transactions = makeTransactions(5);
      component.pageSize = 5;
      expect(component.totalPages).toBe(1);
    });
  });

  describe('paginatedTransactions', () => {
    beforeEach(() => {
      component.transactions = makeTransactions(12);
      component.pageSize = 5;
    });

    it('should return first page items', () => {
      component.currentPage = 1;
      expect(component.paginatedTransactions.length).toBe(5);
      expect(component.paginatedTransactions[0].name).toBe('Tx 1');
    });

    it('should return second page items', () => {
      component.currentPage = 2;
      expect(component.paginatedTransactions.length).toBe(5);
      expect(component.paginatedTransactions[0].name).toBe('Tx 6');
    });

    it('should return remaining items on last page', () => {
      component.currentPage = 3;
      expect(component.paginatedTransactions.length).toBe(2);
      expect(component.paginatedTransactions[0].name).toBe('Tx 11');
    });
  });

  describe('pageNumbers', () => {
    it('should return an array with one entry per page', () => {
      component.transactions = makeTransactions(12);
      component.pageSize = 5;
      expect(component.pageNumbers).toEqual([1, 2, 3]);
    });

    it('should return empty array when there are no transactions', () => {
      component.transactions = [];
      expect(component.pageNumbers).toEqual([]);
    });
  });

  describe('ngOnChanges', () => {
    it('should reset currentPage to 1 when transactions input changes', () => {
      component.currentPage = 3;
      const newTransactions = makeTransactions(6);
      component.transactions = newTransactions;
      component.ngOnChanges({
        transactions: new SimpleChange([], newTransactions, false)
      });
      expect(component.currentPage).toBe(1);
    });

    it('should not reset currentPage when other inputs change', () => {
      component.currentPage = 2;
      component.ngOnChanges({
        pageSize: new SimpleChange(5, 10, false)
      });
      expect(component.currentPage).toBe(2);
    });
  });

  describe('goToPage', () => {
    beforeEach(() => {
      component.transactions = makeTransactions(12);
      component.pageSize = 5;
      component.currentPage = 1;
    });

    it('should navigate to a valid page', () => {
      component.goToPage(2);
      expect(component.currentPage).toBe(2);
    });

    it('should not navigate below page 1', () => {
      component.goToPage(0);
      expect(component.currentPage).toBe(1);
    });

    it('should not navigate beyond totalPages', () => {
      component.goToPage(99);
      expect(component.currentPage).toBe(1);
    });
  });

  describe('previousPage', () => {
    it('should decrement currentPage', () => {
      component.transactions = makeTransactions(12);
      component.pageSize = 5;
      component.currentPage = 2;
      component.previousPage();
      expect(component.currentPage).toBe(1);
    });

    it('should not go below page 1', () => {
      component.transactions = makeTransactions(12);
      component.pageSize = 5;
      component.currentPage = 1;
      component.previousPage();
      expect(component.currentPage).toBe(1);
    });
  });

  describe('nextPage', () => {
    it('should increment currentPage', () => {
      component.transactions = makeTransactions(12);
      component.pageSize = 5;
      component.currentPage = 1;
      component.nextPage();
      expect(component.currentPage).toBe(2);
    });

    it('should not go beyond totalPages', () => {
      component.transactions = makeTransactions(12);
      component.pageSize = 5;
      component.currentPage = 3;
      component.nextPage();
      expect(component.currentPage).toBe(3);
    });
  });
});

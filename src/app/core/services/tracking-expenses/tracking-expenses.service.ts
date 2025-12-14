import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateRange } from './interfaces/tracking-expenses.interfaces';
import { NormalizeDatesService } from './normalize-dates.service';
import { Transaction, TransactionType } from '../../../shared/models/transaction.model';
@Injectable({
  providedIn: 'root'
})
export class TrackingExpensesService {

  constructor(private readonly normalizeDatesService: NormalizeDatesService) { }

  private transactionTypeSubject = new BehaviorSubject<TransactionType>('expenses');
  private dateRangeSubject = new BehaviorSubject<DateRange>({start: null, end: null});

  readonly transactionType$ = this.transactionTypeSubject.asObservable();
  readonly dateRange$ = this.dateRangeSubject.asObservable();

  readonly filteredTransactions$: Observable<Transaction[]> = combineLatest([
    this.transactionType$,
    this.dateRange$
  ]).pipe(
    map(([type, dateRange]) => {
      console.log('[Service] Filtering transactions:', { type, dateRange });
      return this.getTransactionsByType(type, dateRange);
    })
  );

  private expensesData: Transaction[] = [
    { 
      name: 'Almuerzo', 
      amount: 150000, 
      date: new Date('2024-12-14'), 
      category: 'Comida',
      transactionType: 'expenses'
    },
    { 
      name: 'Transporte', 
      amount: 15000, 
      date: new Date('2024-12-14'), 
      category: 'Transporte',
      transactionType: 'expenses'
    },
    { 
      name: 'Cine', 
      amount: 100000, 
      date: new Date('2024-12-14'), 
      category: 'Transporte',
      transactionType: 'expenses'
    },
  ];

  private incomeData: Transaction[] = [
    { 
      name: 'Salario', 
      amount: 4500000, 
      date: new Date('2024-12-14'), 
      category: 'Trabajo',
      transactionType: 'income'
    },
    { 
      name: 'Trabajo Freelance', 
      amount: 150000, 
      date: new Date('2024-12-14'), 
      category: 'Freelance',
      transactionType: 'income'
    }
  ];

  /**
   * Method to get transactions by type and optional date range
   * 
   * @param type 
   * @param dateRange 
   * @returns 
   */
  getTransactionsByType(type: TransactionType, dateRange?: DateRange): Transaction[] {
    const transactions = type === 'expenses' ? this.expensesData : this.incomeData;
    
    if (!dateRange?.start || !dateRange?.end) {
      console.log('[Service] No valid date range, returning all transactions');
      return transactions;
    }

    const start = this.normalizeDatesService.normalizeDate(dateRange.start);
    const end = this.normalizeDatesService.normalizeDate(dateRange.end);

    console.log('[Service] Normalized range:', {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    });

    const filtered = transactions.filter(transaction => {
      // const transactionDate = this.normalizeDatesService.parseLocalDate(transaction.date);
      const isInRange = transaction.date >= start && transaction.date <= end;
      
      return isInRange;
    });

    console.log(`[Service] Filtered: ${filtered.length} of ${transactions.length} transactions`);
    
    return filtered;
  }

  setTransactionType(type: TransactionType): void {
    this.transactionTypeSubject.next(type);
  }

  setDateRange(range: DateRange): void {
    console.log('[Service] Setting date range:', {
      start: range.start?.toISOString().split('T')[0],
      end: range.end?.toISOString().split('T')[0]
    });
    
    if (range.start && range.end) {
      if (range.start > range.end) {
        console.error('[Service] Invalid range: start is after end');
        return;
      }
    }
    
    this.dateRangeSubject.next(range);
  }

}

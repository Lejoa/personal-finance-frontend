import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionType, Transaction, DateRange } from './interfaces/tracking-expenses.interfaces';
import { NormalizeDatesService } from './normalize-dates.service';
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
    { name: 'Almuerzo', amount: 15, date: '2024-06-01', category: ['Alimentos', 'Otros'] },
    { name: 'Transporte', amount: 10, date: '2024-06-02', category: ['Transporte'] },
    { name: 'Cine', amount: 20, date: '2024-06-03', category: ['Entretenimiento'] }
  ];

  private incomeData: Transaction[] = [
    { name: 'Salario', amount: 1500, date: '2024-06-01', category: ['Trabajo'] },
    { name: 'Freelance', amount: 500, date: '2024-06-05', category: ['Proyectos'] }
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
      const transactionDate = this.normalizeDatesService.parseLocalDate(transaction.date);
      const isInRange = transactionDate >= start && transactionDate <= end;
      
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

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { DateRange } from './interfaces/tracking-expenses.interfaces';
import { TransactionType } from '../../../shared/models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TrackingExpensesService {
  private transactionTypeSubject = new BehaviorSubject<TransactionType>('gasto');
  private dateRangeSubject = new BehaviorSubject<DateRange>({ start: null, end: null });

  readonly transactionType$ = this.transactionTypeSubject.asObservable();
  readonly dateRange$ = this.dateRangeSubject.asObservable();

  setTransactionType(type: TransactionType): void {
    this.transactionTypeSubject.next(type);
  }

  setDateRange(range: DateRange): void {
    this.dateRangeSubject.next(range);
  }
}

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MonthStateService {
  private readonly initialMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  private selectedMonthSubject = new BehaviorSubject<Date>(this.initialMonth);

  readonly selectedMonth$ = this.selectedMonthSubject.asObservable();

  get selectedMonth(): Date {
    return this.selectedMonthSubject.value;
  }

  setMonth(month: Date): void {
    this.selectedMonthSubject.next(new Date(month.getFullYear(), month.getMonth(), 1));
  }
}

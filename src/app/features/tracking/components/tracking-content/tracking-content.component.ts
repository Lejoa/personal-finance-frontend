import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { TransactionHistoryComponent } from '../../../../shared/components/transaction-history/transaction-history.component';
import { ChartsSectionComponent } from '../charts-section/charts-section.component';
import { MonthNavigatorComponent } from '../../../../shared/components/month-navigator/month-navigator.component';
import { BalanceComponent } from '../../../../shared/components/balance/balance.component';
import { TrackingExpensesService } from '../../../../core/services/tracking-expenses/tracking-expenses.service';
import { CategoryService } from '../../../../shared/services/category.service';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { MonthStateService } from '../../../../core/services/month-state/month-state.service';
import { Transaction, TransactionType } from '../../../../shared/models/transaction.model';

@Component({
  selector: 'app-tracking-content',
  standalone: true,
  imports: [
    ChartsSectionComponent,
    TransactionHistoryComponent,
    MonthNavigatorComponent,
    BalanceComponent
  ],
  templateUrl: './tracking-content.component.html',
  styleUrl: './tracking-content.component.scss'
})
export class TrackingContentComponent implements OnInit {
  private transactionService = inject(TransactionService);
  private categoryService = inject(CategoryService);
  private trackingExpensesService = inject(TrackingExpensesService);
  private monthStateService = inject(MonthStateService);
  private destroyRef = inject(DestroyRef);

  currentTransactionType: TransactionType = 'gasto';

  allMonthTransactions: Transaction[] = [];
  filteredTransactions: Transaction[] = [];

  get selectedMonth(): Date {
    return this.monthStateService.selectedMonth;
  }

  ngOnInit(): void {
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();

    this.loadTransactions();

    this.transactionService.transactionChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadTransactions());
  }

  onMonthChange(month: Date): void {
    this.monthStateService.setMonth(month);
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    this.trackingExpensesService.setDateRange({ start, end });
    this.loadTransactions();
  }

  onTransactionTypeChange(type: TransactionType): void {
    this.currentTransactionType = type;
    this.trackingExpensesService.setTransactionType(type);
    this.loadFilteredTransactions();
  }

  private loadTransactions(): void {
    const month = this.monthStateService.selectedMonth;
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    forkJoin({
      all: this.transactionService.getTransactionsByDateRange(start, end),
      filtered: this.transactionService.getTransactionsByDateRange(start, end, this.currentTransactionType)
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ all, filtered }) => {
          this.allMonthTransactions = all;
          this.filteredTransactions = filtered;
        },
        error: () => {}
      });
  }

  private loadFilteredTransactions(): void {
    const month = this.monthStateService.selectedMonth;
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    this.transactionService.getTransactionsByDateRange(start, end, this.currentTransactionType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(filtered => { this.filteredTransactions = filtered; });
  }
}

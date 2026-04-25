import { Component, OnInit, OnChanges, Input, SimpleChanges, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransactionCardComponent } from '../transaction-card/transaction-card.component';
import { TrackingExpensesService } from '../../../core/services/tracking-expenses/tracking-expenses.service';
import { DateRange } from '../../../core/services/tracking-expenses/interfaces/tracking-expenses.interfaces';
import { combineLatest } from 'rxjs';
import { Transaction, TransactionType } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    TransactionCardComponent
  ],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss'
})
export class TransactionHistoryComponent implements OnInit, OnChanges {
  @Input() mode: 'tracking' | 'home' = 'home';
  @Input() pageSize: number = 5;
  @Input() showPagination: boolean = true;
  @Input() selectedMonth: Date | null = null;

  private transactionService = inject(TransactionService);
  private trackingExpensesService = inject(TrackingExpensesService);
  private destroyRef = inject(DestroyRef);

  transactions: Transaction[] = [];
  isLoading = false;
  currentPage: number = 1;
  private currentType: TransactionType = 'gasto';
  private currentDateRange: DateRange = { start: null, end: null };

  private readonly today = new Date();
  private readonly defaultStartDate = new Date(this.today.getFullYear(), this.today.getMonth() - 1, 1);
  private readonly defaultEndDate = new Date(this.today.getFullYear(), this.today.getMonth(), 0);

  get totalPages(): number {
    return Math.ceil(this.transactions.length / this.pageSize);
  }

  get paginatedTransactions(): Transaction[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.transactions.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  ngOnInit(): void {
    if (this.mode === 'tracking') {
      this.initializeTrackingMode();
    } else {
      this.initializeHomeMode();
    }

    this.transactionService.transactionChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.mode === 'tracking') {
          this.loadTransactionsByDateRange();
        } else {
          this.initializeHomeMode();
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.mode === 'home' && changes['selectedMonth'] && !changes['selectedMonth'].firstChange) {
      this.initializeHomeMode();
    }
  }

  private initializeTrackingMode(): void {
    combineLatest([
      this.trackingExpensesService.transactionType$,
      this.trackingExpensesService.dateRange$
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([type, dateRange]) => {
        this.currentType = type;
        this.currentDateRange = dateRange;
        this.loadTransactionsByDateRange();
      });
  }

  private loadTransactionsByDateRange(): void {
    const startDate = this.currentDateRange.start || this.defaultStartDate;
    const endDate = this.currentDateRange.end || this.defaultEndDate;

    this.isLoading = true;
    this.transactionService.getTransactionsByDateRange(startDate, endDate, this.currentType)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: transactions => {
          this.transactions = transactions;
          this.currentPage = 1;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      });
  }

  private initializeHomeMode(): void {
    this.isLoading = true;

    if (this.selectedMonth) {
      const start = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
      const end = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0);
      this.transactionService.getTransactionsByDateRange(start, end)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: transactions => {
            this.transactions = transactions;
            this.currentPage = 1;
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
    } else {
      this.transactionService.getLatestTransactions(3)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: transactions => {
            this.transactions = transactions;
            this.isLoading = false;
          },
          error: () => {
            this.isLoading = false;
          }
        });
    }
  }
}

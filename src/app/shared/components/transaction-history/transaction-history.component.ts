import { Component, OnInit, OnDestroy, Input, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { TransactionCardComponent } from '../transaction-card/transaction-card.component';
import { TrackingExpensesService } from '../../../core/services/tracking-expenses/tracking-expenses.service';
import { DateRange } from '../../../core/services/tracking-expenses/interfaces/tracking-expenses.interfaces';
import { Subscription } from 'rxjs';
import { Transaction, TransactionType } from '../../models/transaction.model';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    TransactionCardComponent,
    NgFor,
    NgIf
  ],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss'
})
export class TransactionHistoryComponent implements OnInit, OnDestroy {
  @Input() mode: 'tracking' | 'home' = 'home';

  private transactionService = inject(TransactionService);
  private trackingExpensesService = inject(TrackingExpensesService);
  private subscription = new Subscription();

  transactions: Transaction[] = [];
  isLoading = false;
  private currentType: TransactionType = 'expenses';
  private currentDateRange: DateRange = { start: null, end: null };

  ngOnInit(): void {
    if (this.mode === 'tracking') {
      this.initializeTrackingMode();
    } else {
      this.initializeHomeMode();
    }
  }

  private initializeTrackingMode(): void {
    this.subscription.add(
      this.trackingExpensesService.transactionType$.subscribe(type => {
        this.currentType = type;
        this.loadTransactionsByDateRange();
      })
    );

    this.subscription.add(
      this.trackingExpensesService.dateRange$.subscribe(dateRange => {
        this.currentDateRange = dateRange;
        this.loadTransactionsByDateRange();
      })
    );
  }

  private loadTransactionsByDateRange(): void {
    if (!this.currentDateRange.start || !this.currentDateRange.end) {
      return;
    }

    this.isLoading = true;
    this.subscription.add(
      this.transactionService.getTransactionsByDateRange(
        this.currentDateRange.start,
        this.currentDateRange.end,
        this.currentType
      ).subscribe({
        next: transactions => {
          this.transactions = transactions;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      })
    );
  }

  private initializeHomeMode(): void {
    this.isLoading = true;
    this.subscription.add(
      this.transactionService.getLatestTransactions(3).subscribe({
        next: transactions => {
          this.transactions = transactions;
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

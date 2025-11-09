import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { NgFor } from '@angular/common';
import { TransactionCardComponent } from '../transaction-card/transaction-card.component';
import { TrackingExpensesService } from '../../../core/services/tracking-expenses/tracking-expenses.service';
import { Transaction, TransactionType, DateRange } from '../../../core/services/tracking-expenses/interfaces/tracking-expenses.interfaces';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    TransactionCardComponent,
    NgFor
  ],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss'
})

export class TransactionHistoryComponent implements OnInit, OnDestroy {
  @Input() mode: 'tracking' | 'home' = 'home';

  transactions: Transaction[] = [];
  private subscription: Subscription = new Subscription();
  private currentType: TransactionType = 'expenses';
  private currentDateRange: DateRange = { start: null, end: null };

  constructor(private TrackingExpensesService: TrackingExpensesService) { }

  ngOnInit(): void {
    if(this.mode === 'tracking') {
      this.intializeTrackingMode();
    } else {
      this.initializeHomeMode();
    }
  }

  private intializeTrackingMode(): void {
    this.subscription.add(
      this.TrackingExpensesService.transactionType$
        .subscribe( type => {
          this.currentType = type;
          this.updateTransactions();
        })
    );

    this.subscription.add(
      this.TrackingExpensesService.dateRange$
        .subscribe(
          dateRange => {
            this.currentDateRange = dateRange;
            this.updateTransactions();
          }
      )
    );
  }

  private updateTransactions(): void {
    this.transactions = 
      this.TrackingExpensesService.getTransactionsByType(this.currentType, this.currentDateRange);
  }

  private initializeHomeMode(): void {
    //TODO: Fetch only the last 3 transactions from database  
    this.transactions = this.TrackingExpensesService
        .getTransactionsByType('expenses')
        .slice(0, 3);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { TransactionService } from '../../services/transaction.service';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './balance.component.html',
  styleUrl: './balance.component.scss'
})
export class BalanceComponent implements OnInit, OnChanges {
  @Input() selectedMonth: Date = new Date();

  private transactionService = inject(TransactionService);

  income: number = 0;
  expenses: number = 0;
  balance: number = 0;
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadMonthSummary();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMonth'] && !changes['selectedMonth'].firstChange) {
      this.loadMonthSummary();
    }
  }

  private loadMonthSummary(): void {
    const start = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth(),
      1
    );
    const end = new Date(
      this.selectedMonth.getFullYear(),
      this.selectedMonth.getMonth() + 1,
      0
    );

    this.isLoading = true;
    this.transactionService.getTransactionsByDateRange(start, end).subscribe({
      next: (transactions) => {
        this.income = transactions
          .filter(t => t.transactionType === 'ingreso')
          .reduce((sum, t) => sum + t.amount, 0);
        this.expenses = transactions
          .filter(t => t.transactionType === 'gasto')
          .reduce((sum, t) => sum + t.amount, 0);
        this.balance = this.income - this.expenses;
        this.isLoading = false;
      },
      error: () => {
        this.income = 0;
        this.expenses = 0;
        this.balance = 0;
        this.isLoading = false;
      }
    });
  }
}
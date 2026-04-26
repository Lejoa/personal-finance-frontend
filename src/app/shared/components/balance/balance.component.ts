import { Component, Input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CurrencyPipe],
  templateUrl: './balance.component.html',
  styleUrl: './balance.component.scss'
})
export class BalanceComponent {
  @Input() transactions: Transaction[] = [];

  get income(): number {
    return this.transactions
      .filter(t => t.transactionType === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  get expenses(): number {
    return this.transactions
      .filter(t => t.transactionType === 'gasto')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  get balance(): number {
    return this.income - this.expenses;
  }
}
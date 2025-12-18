import { Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [
    CurrencyPipe
  ],
  templateUrl: './balance.component.html',
  styleUrl: './balance.component.scss'
})
export class BalanceComponent {

  income: number = 5000000;
  expenses: number = 2000000;
  balance: number = 3000000;
}

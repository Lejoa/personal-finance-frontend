import { Component } from '@angular/core';
import { TransactionCardComponent } from '../transaction-card/transaction-card.component';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    TransactionCardComponent
  ],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss'
})

export class TransactionHistoryComponent {

}

import { Component, Input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { DatePipe } from '@angular/common';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-synchronization-card',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './synchronization-card.component.html',
  styleUrl: './synchronization-card.component.scss'
})
export class SynchronizationCardComponent {

  @Input() transaction!: Transaction;
  
  startSync(): void {
    
  }
}

import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TransactionCardComponent } from '../transaction-card/transaction-card.component';
import { TabService } from '../../../core/services/tab/tab.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [
    AsyncPipe,
    TransactionCardComponent
  ],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss'
})

export class TransactionHistoryComponent {
  activeTab$: Observable<String>;
  constructor(private tabService: TabService) {
    this.activeTab$ = this.tabService.activeTab$;
  }
}

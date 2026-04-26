import { Component, OnChanges, Input, SimpleChanges } from '@angular/core';
import { TransactionCardComponent } from '../transaction-card/transaction-card.component';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [TransactionCardComponent],
  templateUrl: './transaction-history.component.html',
  styleUrl: './transaction-history.component.scss'
})
export class TransactionHistoryComponent implements OnChanges {
  @Input() pageSize: number = 5;
  @Input() showPagination: boolean = true;
  @Input() transactions: Transaction[] = [];

  currentPage: number = 1;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['transactions']) {
      this.currentPage = 1;
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void { this.goToPage(this.currentPage - 1); }
  nextPage(): void { this.goToPage(this.currentPage + 1); }
}
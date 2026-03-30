import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterTabsComponent } from '../../shared/components/footer-tabs/footer-tabs.component';
import { TransactionHistoryComponent } from '../../shared/components/transaction-history/transaction-history.component';
import { FinancialLiteracyComponent } from '../../shared/components/financial-literacy/financial-literacy.component';
import { RegisterButtonComponent } from '../../shared/components/register-button/register-button.component';
import { TransactionCardComponent } from '../../shared/components/transaction-card/transaction-card.component';
import { TrackingContentComponent } from  '../tracking/components/tracking-content/tracking-content.component';
import { TabService } from '../../core/services/tab/tab.service';
import { NgSwitch, NgSwitchCase, NgIf } from '@angular/common';
import { LearningContentComponent } from '../learning/components/learning-content/learning-content.component';
import { ChatContentComponent } from '../chat/components/chat-content/chat-content.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Transaction } from '../../shared/models/transaction.model';
import { BudgetComponent } from '../budget/components/budget/budget.component';
import { BalanceComponent } from '../../shared/components/balance/balance.component';
import { TransactionService } from '../../shared/services/transaction.service';
import { CategoryContentComponent } from '../categories/components/category-content/category-content.component';

export type TabType = 'Home' | 'Tracking' | 'Create' | 'Budgets' | 'Learning' | 'Categories';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterTabsComponent,
    BalanceComponent,
    TransactionHistoryComponent,
    FinancialLiteracyComponent,
    RegisterButtonComponent,
    TransactionCardComponent,
    TrackingContentComponent,
    ChatContentComponent,
    BudgetComponent,
    LearningContentComponent,
    CategoryContentComponent,
    NgSwitch,
    NgSwitchCase,
    NgIf
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements OnInit {
  private transactionService = inject(TransactionService);

  activeTab: TabType = 'Home';
  unsyncedTransaction: Transaction | null = null;

  constructor(private tabService: TabService) {
    this.tabService.activeTab$
      .pipe(takeUntilDestroyed())
      .subscribe(tab => {
        this.activeTab = tab as TabType;
      });
  }

  ngOnInit(): void {
    this.loadUnsyncedTransaction();
  }

  private loadUnsyncedTransaction(): void {
    this.transactionService.getTransactionsUnsynced().subscribe({
      next: (transactions) => {
        this.unsyncedTransaction = transactions.length > 0 ? transactions[0] : null;
      },
      error: (error) => {
        console.error('Error loading unsynced transaction:', error);
      }
    });
  }

  onTransactionSynced(): void {
    this.loadUnsyncedTransaction();
  }
}
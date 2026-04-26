import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterTabsComponent } from '../../shared/components/footer-tabs/footer-tabs.component';
import { TransactionHistoryComponent } from '../../shared/components/transaction-history/transaction-history.component';
import { RegisterButtonComponent } from '../../shared/components/register-button/register-button.component';
import { TrackingContentComponent } from '../tracking/components/tracking-content/tracking-content.component';
import { TabService } from '../../core/services/tab/tab.service';
import { MonthStateService } from '../../core/services/month-state/month-state.service';
import { TransactionService } from '../../shared/services/transaction.service';
import { NgSwitch, NgSwitchCase } from '@angular/common';
import { LearningContentComponent } from '../learning/components/learning-content/learning-content.component';
import { ChatContentComponent } from '../chat/components/chat-content/chat-content.component';
import { BudgetComponent } from '../budget/components/budget/budget.component';
import { BalanceComponent } from '../../shared/components/balance/balance.component';
import { CategoryContentComponent } from '../categories/components/category-content/category-content.component';
import { SmsSyncSheetComponent } from '../sms-sync/components/sms-sync-sheet/sms-sync-sheet.component';
import { MonthNavigatorComponent } from '../../shared/components/month-navigator/month-navigator.component';
import { Transaction } from '../../shared/models/transaction.model';

export type TabType = 'Home' | 'Tracking' | 'Create' | 'Budgets' | 'Learning' | 'Categories';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterTabsComponent,
    BalanceComponent,
    TransactionHistoryComponent,
    RegisterButtonComponent,
    TrackingContentComponent,
    ChatContentComponent,
    BudgetComponent,
    LearningContentComponent,
    CategoryContentComponent,
    SmsSyncSheetComponent,
    MonthNavigatorComponent,
    NgSwitch,
    NgSwitchCase,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent implements OnInit {
  private tabService = inject(TabService);
  private monthStateService = inject(MonthStateService);
  private transactionService = inject(TransactionService);
  private destroyRef = inject(DestroyRef);

  activeTab: TabType = 'Home';
  isSheetOpen = false;

  get selectedMonth(): Date {
    return this.monthStateService.selectedMonth;
  }

  homeTransactions: Transaction[] = [];

  ngOnInit(): void {
    this.tabService.activeTab$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(tab => {
        this.activeTab = tab as TabType;
      });

    this.transactionService.transactionChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadHomeTransactions());

    this.monthStateService.selectedMonth$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadHomeTransactions());
  }

  onMonthChange(month: Date): void {
    this.monthStateService.setMonth(month);
  }

  openSheet(): void {
    this.isSheetOpen = true;
  }

  closeSheet(): void {
    this.isSheetOpen = false;
  }

  private loadHomeTransactions(): void {
    const month = this.monthStateService.selectedMonth;
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    this.transactionService.getTransactionsByDateRange(start, end)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: transactions => { this.homeTransactions = transactions; },
        error: () => {}
      });
  }
}

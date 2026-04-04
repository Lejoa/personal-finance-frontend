import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterTabsComponent } from '../../shared/components/footer-tabs/footer-tabs.component';
import { TransactionHistoryComponent } from '../../shared/components/transaction-history/transaction-history.component';
import { FinancialLiteracyComponent } from '../../shared/components/financial-literacy/financial-literacy.component';
import { RegisterButtonComponent } from '../../shared/components/register-button/register-button.component';
import { TrackingContentComponent } from '../tracking/components/tracking-content/tracking-content.component';
import { TabService } from '../../core/services/tab/tab.service';
import { NgSwitch, NgSwitchCase } from '@angular/common';
import { LearningContentComponent } from '../learning/components/learning-content/learning-content.component';
import { ChatContentComponent } from '../chat/components/chat-content/chat-content.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BudgetComponent } from '../budget/components/budget/budget.component';
import { BalanceComponent } from '../../shared/components/balance/balance.component';
import { CategoryContentComponent } from '../categories/components/category-content/category-content.component';
import { SmsSyncSheetComponent } from '../sms-sync/components/sms-sync-sheet/sms-sync-sheet.component';

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
    TrackingContentComponent,
    ChatContentComponent,
    BudgetComponent,
    LearningContentComponent,
    CategoryContentComponent,
    SmsSyncSheetComponent,
    NgSwitch,
    NgSwitchCase,
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  activeTab: TabType = 'Home';
  isSheetOpen = false;

  constructor(private tabService: TabService) {
    this.tabService.activeTab$
      .pipe(takeUntilDestroyed())
      .subscribe(tab => {
        this.activeTab = tab as TabType;
      });
  }

  openSheet(): void {
    this.isSheetOpen = true;
  }

  closeSheet(): void {
    this.isSheetOpen = false;
  }
}
import { Component } from '@angular/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterTabsComponent } from '../../shared/components/footer-tabs/footer-tabs.component';
import { TransactionHistoryComponent } from '../../shared/components/transaction-history/transaction-history.component';
import { FinancialLiteracyComponent } from '../../shared/components/financial-literacy/financial-literacy.component';
import { RegisterButtonComponent } from '../../shared/components/register-button/register-button.component';
import { SynchronizationCardComponent } from '../../shared/components/synchronization-card/synchronization-card.component';
import { TrackingContentComponent } from '../../shared/components/tracking-content/tracking-content.component';
import { TabService } from '../../core/services/tab/tab.service';
import { NgSwitch, NgSwitchCase } from '@angular/common';
import { LearningContentComponent } from '../learning/components/learning-content/learning-content.component';
import { ChatContentComponent } from '../chat/components/chat-content/chat-content.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * Valid tab types for the main navigation
 * @type {TabType}
 */
export type TabType = 'Home' | 'Tracking' | 'Create' | 'Learning';

/**
 * MainComponent - Main application shell component
 *
 * This component serves as the primary layout container for the authenticated area of the application.
 * It implements a tab-based navigation system with four main sections: Home, Tracking, Create, and Learning.
 *
 * The component is protected by AuthGuard and provides:
 * - A persistent header with user information
 * - Dynamic content based on the active tab
 * - A bottom navigation bar for tab switching
 *
 * Layout structure:
 * - Header (app-header)
 * - Main content area (dynamically rendered based on activeTab)
 * - Footer with tabs navigation (app-footer-tabs)
 *
 * @implements No lifecycle hooks needed - subscription is managed automatically via takeUntilDestroyed
 */
@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterTabsComponent,
    TransactionHistoryComponent,
    FinancialLiteracyComponent,
    RegisterButtonComponent,
    SynchronizationCardComponent,
    TrackingContentComponent,
    ChatContentComponent,
    LearningContentComponent,
    NgSwitch,
    NgSwitchCase
],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  /**
   * Currently active tab name
   * Determines which content section is displayed to the user
   * Possible values: 'Home', 'Tracking', 'Create', 'Learning'
   * @default 'Home'
   */
  activeTab: TabType = 'Home';

  /**
   * Creates an instance of MainComponent and subscribes to tab changes
   *
   * The subscription is created in the constructor to use takeUntilDestroyed() operator,
   * which automatically unsubscribes when the component is destroyed.
   * This eliminates the need for manual cleanup in ngOnDestroy.
   *
   * @param {TabService} tabService - Service that manages tab state across the application
   */
  constructor(private tabService: TabService) {
    // Subscribe to tab changes in the constructor to use takeUntilDestroyed()
    // This operator requires being called within an injection context
    this.tabService.activeTab$
      .pipe(takeUntilDestroyed())
      .subscribe(tab => {
        this.activeTab = tab as TabType;
      });
  }
}

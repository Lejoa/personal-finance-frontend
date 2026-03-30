import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransactionHistoryComponent } from '../../../../shared/components/transaction-history/transaction-history.component';
import { ChartsSectionComponent } from '../charts-section/charts-section.component';
import { MonthNavigatorComponent } from '../../../../shared/components/month-navigator/month-navigator.component';
import { BalanceComponent } from '../../../../shared/components/balance/balance.component';
import { TrackingExpensesService } from '../../../../core/services/tracking-expenses/tracking-expenses.service';

@Component({
  selector: 'app-tracking-content',
  standalone: true,
  imports: [
    CommonModule,
    ChartsSectionComponent,
    TransactionHistoryComponent,
    MonthNavigatorComponent,
    BalanceComponent
  ],
  templateUrl: './tracking-content.component.html',
  styleUrl: './tracking-content.component.scss'
})
export class TrackingContentComponent {
  private trackingExpensesService = inject(TrackingExpensesService);

  selectedMonth: Date = new Date();

  onMonthChange(month: Date): void {
    this.selectedMonth = month;
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    this.trackingExpensesService.setDateRange({ start, end });
  }
}
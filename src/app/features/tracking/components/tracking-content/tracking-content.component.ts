import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TransactionHistoryComponent } from '../../../../shared/components/transaction-history/transaction-history.component';
import { ChartsSectionComponent } from '../charts-section/charts-section.component';
import { MonthNavigatorComponent } from '../../../../shared/components/month-navigator/month-navigator.component';
import { BalanceComponent } from '../../../../shared/components/balance/balance.component';
import { TrackingExpensesService } from '../../../../core/services/tracking-expenses/tracking-expenses.service';
import { CategoryService } from '../../../../shared/services/category.service';

@Component({
  selector: 'app-tracking-content',
  standalone: true,
  imports: [
    ChartsSectionComponent,
    TransactionHistoryComponent,
    MonthNavigatorComponent,
    BalanceComponent
  ],
  templateUrl: './tracking-content.component.html',
  styleUrl: './tracking-content.component.scss'
})
export class TrackingContentComponent implements OnInit {
  private trackingExpensesService = inject(TrackingExpensesService);
  private categoryService = inject(CategoryService);
  private destroyRef = inject(DestroyRef);

  selectedMonth: Date = new Date();

  ngOnInit(): void {
    this.categoryService.getCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  onMonthChange(month: Date): void {
    this.selectedMonth = month;
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    this.trackingExpensesService.setDateRange({ start, end });
  }
}
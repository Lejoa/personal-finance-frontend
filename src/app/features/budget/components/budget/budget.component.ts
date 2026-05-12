import { Component, OnInit, inject, DestroyRef } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Budget, BudgetCategory } from '../../../../shared/models/budget.model';
import { Category } from '../../../../shared/models/category.model';
import { Transaction } from '../../../../shared/models/transaction.model';
import { CategoryService } from '../../../../shared/services/category.service';
import { BudgetService } from '../../../../shared/services/budget.service';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { MonthStateService } from '../../../../core/services/month-state/month-state.service';
import { MonthNavigatorComponent } from '../../../../shared/components/month-navigator/month-navigator.component';
import { BalanceComponent } from '../../../../shared/components/balance/balance.component';
import { BudgetCategoryCardComponent } from '../budget-category-card/budget-category-card.component';
import { UnbudgetedCategoryListComponent } from '../unbudgeted-category-list/unbudgeted-category-list.component';
import { BudgetCategoryView, UnbudgetedCategory } from '../../interfaces';

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    CurrencyPipe,
    DatePipe,
    MonthNavigatorComponent,
    BalanceComponent,
    BudgetCategoryCardComponent,
    UnbudgetedCategoryListComponent,
  ],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.scss'
})
export class BudgetComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private budgetService = inject(BudgetService);
  private transactionService = inject(TransactionService);
  private monthStateService = inject(MonthStateService);
  private destroyRef = inject(DestroyRef);

  currentBudget: Budget | null = null;
  budgetedCategories: BudgetCategoryView[] = [];
  unbudgetedCategories: UnbudgetedCategory[] = [];
  allMonthTransactions: Transaction[] = [];
  totalBudget = 0;
  totalSpent = 0;
  isLoading = false;

  get selectedMonth(): Date {
    return this.monthStateService.selectedMonth;
  }

  ngOnInit(): void {
    this.monthStateService.selectedMonth$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadBudgetData());
  }

  onMonthChange(month: Date): void {
    this.monthStateService.setMonth(month);
  }

  loadBudgetData(): void {
    this.isLoading = true;
    const month = this.monthStateService.selectedMonth;
    const monthStartDate = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEndDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    forkJoin({
      budget: this.budgetService.getBudgetByMonth(month),
      categories: this.categoryService.getCategories({ type: 'gasto' }),
      allTransactions: this.transactionService.getTransactionsByDateRange(monthStartDate, monthEndDate),
      spentTransactions: this.transactionService.getTransactionsByDateRange(monthStartDate, monthEndDate, 'gasto')
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ budget, categories, allTransactions, spentTransactions }) => {
        this.currentBudget = budget;
        this.allMonthTransactions = allTransactions;
        this.buildCategoryViews(budget, categories, spentTransactions);
        this.isLoading = false;
      },
      error: () => { this.isLoading = false; }
    });
  }

  private buildCategoryViews(budget: Budget | null, categories: Category[], transactions: Transaction[]): void {
    const spentByCategoryId = this.calculateSpentByCategoryId(transactions);
    const budgetedCategoryIds = new Set<number>();

    if (budget?.categories?.length) {
      this.budgetedCategories = budget.categories.map((bc: BudgetCategory) => {
        const spent = spentByCategoryId[bc.categoryId] ?? 0;
        budgetedCategoryIds.add(bc.categoryId);
        return {
          categoryId: bc.categoryId,
          categoryName: bc.categoryName,
          limit: bc.amount,
          spent,
          remaining: bc.amount - spent,
          isOverBudget: spent > bc.amount,
          budgetId: budget.id,
          budgetCategoryId: bc.id
        };
      });
    } else {
      this.budgetedCategories = [];
    }

    this.totalBudget = this.budgetedCategories.reduce((sum, c) => sum + c.limit, 0);
    this.totalSpent = this.budgetedCategories.reduce((sum, c) => sum + c.spent, 0);

    this.unbudgetedCategories = categories
      .filter(cat => !budgetedCategoryIds.has(cat.id))
      .map(cat => ({
        categoryId: cat.id,
        categoryName: cat.name,
        spent: spentByCategoryId[cat.id] ?? 0
      }));
  }

  private calculateSpentByCategoryId(transactions: Transaction[]): Record<number, number> {
    return transactions.reduce((acc, t) => {
      if (t.categoryId != null) {
        acc[t.categoryId] = (acc[t.categoryId] ?? 0) + t.amount;
      }
      return acc;
    }, {} as Record<number, number>);
  }

  get isGlobalOverBudget(): boolean {
    return this.totalSpent > this.totalBudget;
  }
}

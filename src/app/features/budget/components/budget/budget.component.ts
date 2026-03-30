import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Budget, BudgetCategory } from '../../../../shared/models/budget.model';
import { Category } from '../../../../shared/models/category.model';
import { Transaction } from '../../../../shared/models/transaction.model';
import { CategoryService } from '../../../../shared/services/category.service';
import { BudgetService } from '../../../../shared/services/budget.service';
import { TransactionService } from '../../../../shared/services/transaction.service';
import { MonthNavigatorComponent } from '../../../../shared/components/month-navigator/month-navigator.component';
import { BalanceComponent } from '../../../../shared/components/balance/balance.component';

interface BudgetCategoryView {
  categoryId: number;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number;
  progressPercent: number;
  isOverBudget: boolean;
  budgetId?: number;
  budgetCategoryId?: number;
}

interface UnbudgetedCategory {
  categoryId: number;
  categoryName: string;
  spent: number;
}

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CurrencyPipe,
    MonthNavigatorComponent,
    BalanceComponent
  ],
  templateUrl: './budget.component.html',
  styleUrl: './budget.component.scss'
})
export class BudgetComponent implements OnInit {
  private categoryService = inject(CategoryService);
  private budgetService = inject(BudgetService);
  private transactionService = inject(TransactionService);

  selectedMonth: Date = new Date();
  currentBudget: Budget | null = null;
  budgetedCategories: BudgetCategoryView[] = [];
  unbudgetedCategories: UnbudgetedCategory[] = [];
  totalBudget: number = 0;
  totalSpent: number = 0;
  isLoading: boolean = false;

  // Modal state
  isModalOpen: boolean = false;
  selectedCategoryForModal: UnbudgetedCategory | null = null;
  modalLimit: number = 0;
  isSaving: boolean = false;

  ngOnInit(): void {
    // monthChange emits on init from MonthNavigatorComponent
  }

  onMonthChange(month: Date): void {
    this.selectedMonth = month;
    this.loadBudgetData();
  }

  private loadBudgetData(): void {
    this.isLoading = true;
    const start = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth(), 1);
    const end = new Date(this.selectedMonth.getFullYear(), this.selectedMonth.getMonth() + 1, 0);

    forkJoin({
      budget: this.budgetService.getBudgetByMonth(this.selectedMonth),
      categories: this.categoryService.getCategories({ type: 'gasto' }),
      transactions: this.transactionService.getTransactionsByDateRange(start, end, 'gasto')
    }).subscribe({
      next: ({ budget, categories, transactions }) => {
        this.currentBudget = budget;
        this.buildViews(budget, categories, transactions);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  private buildViews(budget: Budget | null, categories: Category[], transactions: Transaction[]): void {
    const spentByCategory: Record<number, number> = {};
    transactions.forEach(t => {
      if (t.categoryId != null) {
        spentByCategory[t.categoryId] = (spentByCategory[t.categoryId] || 0) + t.amount;
      }
    });

    const budgetedCategoryIds = new Set<number>();

    if (budget?.categories && budget.categories.length > 0) {
      this.budgetedCategories = budget.categories.map((bc: BudgetCategory) => {
        const spent = spentByCategory[bc.categoryId] || 0;
        const limit = bc.amount;
        const remaining = limit - spent;
        const progressPercent = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
        budgetedCategoryIds.add(bc.categoryId);
        return {
          categoryId: bc.categoryId,
          categoryName: bc.categoryName,
          limit,
          spent,
          remaining,
          progressPercent,
          isOverBudget: spent > limit,
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
        spent: spentByCategory[cat.id] || 0
      }));
  }

  openSetBudgetModal(cat: UnbudgetedCategory): void {
    this.selectedCategoryForModal = cat;
    this.modalLimit = 0;
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.selectedCategoryForModal = null;
    this.modalLimit = 0;
    this.isSaving = false;
  }

  confirmSetBudget(): void {
    if (!this.selectedCategoryForModal || this.modalLimit <= 0) return;
    this.isSaving = true;
    this.budgetService.setBudgetForCategory(
      this.selectedCategoryForModal.categoryId,
      this.modalLimit,
      this.selectedMonth,
      this.currentBudget
    ).subscribe({
      next: () => {
        this.closeModal();
        this.loadBudgetData();
      },
      error: () => {
        this.isSaving = false;
      }
    });
  }

  deleteBudget(budgetId: number): void {
    this.budgetService.deleteBudget(budgetId).subscribe({
      next: () => this.loadBudgetData(),
      error: (err) => console.error('Error deleting budget:', err)
    });
  }

  get globalProgressPercent(): number {
    return this.totalBudget > 0
      ? Math.min((this.totalSpent / this.totalBudget) * 100, 100)
      : 0;
  }

  get isGlobalOverBudget(): boolean {
    return this.totalSpent > this.totalBudget;
  }
}
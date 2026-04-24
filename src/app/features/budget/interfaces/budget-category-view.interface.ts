export interface BudgetCategoryView {
  categoryId: number;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number;
  isOverBudget: boolean;
  budgetId?: number;
  budgetCategoryId?: number;
}

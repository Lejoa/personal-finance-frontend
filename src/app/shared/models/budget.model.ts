export interface BudgetItem {
  nombre: string;
  tope: number;
}

export interface BudgetCategory {
  id?: number;
  categoryId: number;
  categoryName: string;
  categoryDescription: string;
  amount: number;
}

export interface Budget {
  id?: number;
  startDate: Date;
  endDate: Date;
  items: BudgetItem[];
  categories?: BudgetCategory[];
  createdAt?: Date;
}

export interface CreateBudgetRequest {
  startDate: string;
  endDate: string;
  categories: {
    categoryId: number;
    amount: number;
  }[];
}

export interface UpdateBudgetRequest {
  startDate?: string;
  endDate?: string;
  categories?: {
    categoryId: number;
    amount: number;
  }[];
}
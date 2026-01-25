export interface BudgetItem {
  nombre: string;
  tope: number;
}

export interface Budget {
  id?: string;
  startDate: Date;
  endDate: Date;
  items: BudgetItem[];
  createdAt?: Date;
}
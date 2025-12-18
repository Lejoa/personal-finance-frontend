export interface BudgetItem {
  nombre: string;
  tope: number;
}

export interface Budget {
  id?: string;
  mes: number;
  anio: number;
  items: BudgetItem[];
  createdAt?: Date;
}